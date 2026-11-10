// Testes do banco com PGlite (Postgres real, rodando dentro do Node, sem Docker).
// Aplica o MESMO schema.sql que você roda no Supabase.
// Execução: npm run test:db   (ou node --test supabase/tests/)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const SUPABASE = fileURLToPath(new URL('..', import.meta.url));
// SCHEMA permite rodar os mesmos testes contra outra versão do schema
// (foi assim que o schema original do guia foi comparado com o corrigido).
const SCHEMA = process.env.SCHEMA ?? `${SUPABASE}/schema.sql`;

const ALICE = '11111111-1111-1111-1111-111111111111';
const BOB = '22222222-2222-2222-2222-222222222222';

// O que o Supabase já oferece e o Postgres puro não tem: o schema "auth" com a
// tabela de usuários e a função auth.uid(), os papéis anon e authenticated e um
// esboço do Storage (buckets, objetos e a função storage.foldername).
const SUPABASE_STUBS = `
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  -- Permissões padrão do Supabase real: tudo o que for criado em "public" nasce
  -- liberado para anon e authenticated (inclusive TRUNCATE, que ignora o RLS).
  -- Sem isto, o teste passaria aqui e o banco ficaria aberto no Supabase.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid default auth.uid()
  );
  alter table storage.objects enable row level security;
  -- Igual à função do Supabase: as pastas do caminho, sem o nome do arquivo.
  create function storage.foldername(name text) returns text[] language plpgsql as $$
    declare _parts text[];
    begin
      select string_to_array(name, '/') into _parts;
      return _parts[1:array_length(_parts, 1) - 1];
    end
  $$;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects, storage.buckets to anon, authenticated;
`;

let db;

before(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  await db.exec(readFileSync(SCHEMA, 'utf8'));
  await db.query("insert into auth.users (id, email) values ($1, 'ana@x.com')", [ALICE]);
  await db.query("insert into auth.users (id, email) values ($1, 'bob@x.com')", [BOB]);
});

after(async () => {
  await db.close();
});

// Executa fn como um usuário logado (uid) ou como visitante sem login (null).
async function as(uid, fn) {
  await db.exec(`set role ${uid ? 'authenticated' : 'anon'};
    select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
const rows = async (sql, params = []) => (await db.query(sql, params)).rows;
const affected = (result) => result.affectedRows ?? 0;

// Mesmo caminho do app: pasta com o id do usuário.
const newReceipt = (uid, file = `${Date.now()}-${Math.random()}.jpg`) =>
  as(
    uid,
    async () =>
      (
        await one('insert into receipts (image_path) values ($1) returning id, user_id', [
          `${uid}/${file}`,
        ])
      ).id,
  );

describe('notas (receipts)', () => {
  it('o banco preenche o dono com o usuário logado e começa como pending', async () => {
    const id = await newReceipt(ALICE);
    const row = await one('select user_id, status from receipts where id = $1', [id]);
    assert.equal(row.user_id, ALICE);
    assert.equal(row.status, 'pending');
  });

  it('cada usuário só enxerga as próprias notas', async () => {
    await newReceipt(BOB);
    const ana = await as(ALICE, () => rows('select user_id from receipts'));
    const bob = await as(BOB, () => rows('select user_id from receipts'));
    assert.ok(ana.length >= 1 && ana.every((r) => r.user_id === ALICE));
    assert.ok(bob.length >= 1 && bob.every((r) => r.user_id === BOB));
  });

  it('ninguém edita nem apaga a nota de outra pessoa', async () => {
    const id = await newReceipt(ALICE);
    const upd = await as(BOB, () =>
      db.query("update receipts set total = 1, status = 'done' where id = $1", [id]),
    );
    const del = await as(BOB, () => db.query('delete from receipts where id = $1', [id]));
    assert.equal(affected(upd), 0);
    assert.equal(affected(del), 0);
    assert.equal(
      (await one('select status from receipts where id = $1', [id])).status,
      'pending',
    );
  });

  it('não dá para criar nem "passar" uma nota para outro usuário', async () => {
    await assert.rejects(
      as(BOB, () =>
        db.query('insert into receipts (user_id, image_path) values ($1, $2)', [
          ALICE,
          `${ALICE}/x.jpg`,
        ]),
      ),
      /row-level security/,
    );
    const id = await newReceipt(BOB);
    await assert.rejects(
      as(BOB, () =>
        db.query('update receipts set user_id = $1 where id = $2', [ALICE, id]),
      ),
      /row-level security/,
    );
  });

  it('o caminho da foto precisa estar na pasta do próprio dono', async () => {
    await assert.rejects(
      as(BOB, () =>
        db.query('insert into receipts (image_path) values ($1)', [
          `${ALICE}/da-ana.jpg`,
        ]),
      ),
      /receipts_image_path_own_folder/,
    );
  });

  it('rejeita estado desconhecido e total zero ou negativo', async () => {
    const id = await newReceipt(ALICE);
    await assert.rejects(
      as(ALICE, () => db.query("update receipts set status = 'ok' where id = $1", [id])),
      /check constraint/,
    );
    await assert.rejects(
      as(ALICE, () => db.query('update receipts set total = 0 where id = $1', [id])),
      /check constraint/,
    );
  });
});

describe('itens da nota (receipt_items)', () => {
  it('fluxo da Edge Function: apaga itens antigos, grava o resultado e os itens', async () => {
    const id = await newReceipt(ALICE);
    await as(ALICE, async () => {
      await db.query('delete from receipt_items where receipt_id = $1', [id]);
      const upd = await db.query(
        `update receipts set status = 'done', merchant = 'Supermercado Exemplo',
           total = 87.40, category = 'Alimentação' where id = $1`,
        [id],
      );
      assert.equal(affected(upd), 1);
      await db.query(
        `insert into receipt_items (receipt_id, description, quantity, unit_price, total_price)
           values ($1, 'Arroz 5 kg', 1, 29.9, 29.9), ($1, 'Feijão', 2, 8.5, 17)`,
        [id],
      );
    });
    const items = await as(ALICE, () =>
      rows('select description from receipt_items where receipt_id = $1', [id]),
    );
    assert.equal(items.length, 2);
  });

  it('itens herdam o dono da nota: outra pessoa não lê nem acrescenta', async () => {
    const id = await newReceipt(ALICE);
    await as(ALICE, () =>
      db.query(
        "insert into receipt_items (receipt_id, description, total_price) values ($1, 'Café', 35)",
        [id],
      ),
    );
    const seen = await as(BOB, () =>
      rows('select id from receipt_items where receipt_id = $1', [id]),
    );
    assert.equal(seen.length, 0);
    await assert.rejects(
      as(BOB, () =>
        db.query(
          "insert into receipt_items (receipt_id, description, total_price) values ($1, 'x', 1)",
          [id],
        ),
      ),
      /row-level security/,
    );
  });

  it('apagar a nota apaga os itens junto (cascade)', async () => {
    const id = await newReceipt(ALICE);
    await as(ALICE, () =>
      db.query(
        "insert into receipt_items (receipt_id, description, total_price) values ($1, 'Pão', 7.5)",
        [id],
      ),
    );
    await as(ALICE, () => db.query('delete from receipts where id = $1', [id]));
    const left = await one(
      'select count(*)::int as n from receipt_items where receipt_id = $1',
      [id],
    );
    assert.equal(left.n, 0);
  });
});

describe('Storage (bucket receipts)', () => {
  it('o bucket é privado, limitado a 5 MB e só aceita imagens', async () => {
    const b = await one("select * from storage.buckets where id = 'receipts'");
    assert.equal(b.public, false);
    assert.equal(Number(b.file_size_limit), 5 * 1024 * 1024);
    assert.deepEqual(b.allowed_mime_types, ['image/jpeg', 'image/png', 'image/webp']);
  });

  it('cada usuário envia, lê e apaga só na própria pasta', async () => {
    await as(ALICE, () =>
      db.query("insert into storage.objects (bucket_id, name) values ('receipts', $1)", [
        `${ALICE}/foto.jpg`,
      ]),
    );
    await assert.rejects(
      as(BOB, () =>
        db.query(
          "insert into storage.objects (bucket_id, name) values ('receipts', $1)",
          [`${ALICE}/intrusa.jpg`],
        ),
      ),
      /row-level security/,
    );
    const bobSees = await as(BOB, () =>
      rows('select name from storage.objects where name like $1', [`${ALICE}/%`]),
    );
    assert.equal(bobSees.length, 0);
    const bobDel = await as(BOB, () =>
      db.query('delete from storage.objects where name = $1', [`${ALICE}/foto.jpg`]),
    );
    assert.equal(affected(bobDel), 0);
    const anaDel = await as(ALICE, () =>
      db.query('delete from storage.objects where name = $1', [`${ALICE}/foto.jpg`]),
    );
    assert.equal(affected(anaDel), 1);
  });

  it('visitante sem login não lê nenhuma foto', async () => {
    await as(ALICE, () =>
      db.query("insert into storage.objects (bucket_id, name) values ('receipts', $1)", [
        `${ALICE}/outra.jpg`,
      ]),
    );
    const seen = await as(null, () => rows('select name from storage.objects'));
    assert.equal(seen.length, 0);
  });
});

describe('permissões da API (grants padrão do Supabase)', () => {
  it('visitante sem login não consulta as tabelas', async () => {
    for (const table of ['receipts', 'receipt_items']) {
      await assert.rejects(
        as(null, () => db.query(`select * from ${table}`)),
        /permission denied/,
        table,
      );
    }
  });

  it('ninguém apaga as tabelas inteiras com TRUNCATE (que ignora o RLS)', async () => {
    for (const uid of [null, BOB]) {
      for (const table of ['receipt_items', 'receipts']) {
        await assert.rejects(
          as(uid, () => db.query(`truncate ${table} cascade`)),
          /permission denied/,
          `${uid ?? 'anon'}: ${table}`,
        );
      }
    }
    assert.ok((await one('select count(*)::int as n from receipts')).n > 0);
  });
});
