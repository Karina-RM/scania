-- ScanIA: esquema do banco (execute no SQL Editor do Supabase)
-- No Supabase local: docker exec -i supabase_db_scania psql -U postgres < supabase/schema.sql

-- 1) Tabelas ------------------------------------------------------------
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  image_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'error')),
  merchant text,
  purchase_date date,
  total numeric(12, 2) check (total is null or total > 0),
  category text,
  payment_method text,
  error_message text,
  created_at timestamptz not null default now(),
  -- A foto precisa estar na pasta do próprio dono (<user_id>/arquivo.jpg).
  -- Sem isto, uma nota poderia apontar para a foto de outra pessoa.
  constraint receipts_image_path_own_folder
    check (split_part(image_path, '/', 1) = user_id::text)
);

create table public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  description text not null,
  quantity numeric(10, 3) not null default 1,
  unit_price numeric(12, 2),
  total_price numeric(12, 2) not null
);

create index receipts_user_created_idx
  on public.receipts (user_id, created_at desc);
create index receipt_items_receipt_idx
  on public.receipt_items (receipt_id);

-- 2) Segurança: Row Level Security --------------------------------------
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

create policy "Notas: ler as próprias"
  on public.receipts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Notas: criar as próprias"
  on public.receipts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Notas: editar as próprias"
  on public.receipts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Notas: excluir as próprias"
  on public.receipts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Os itens pertencem a uma nota: a regra segue o dono da nota.
create policy "Itens: acesso às notas próprias"
  on public.receipt_items for all to authenticated
  using (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_id and r.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.receipts r
      where r.id = receipt_id and r.user_id = (select auth.uid())
    )
  );

-- 3) Permissões de acesso pela API ----------------------------------------
-- No Supabase, toda tabela nova em "public" já nasce com TODAS as permissões
-- para anon (visitante sem login) e authenticated, inclusive TRUNCATE, que
-- apaga a tabela inteira sem passar pelo RLS. Por isso, primeiro revogamos
-- tudo e depois concedemos só o que o app usa.
revoke all on public.receipts, public.receipt_items from anon, authenticated;
grant select, insert, update, delete on public.receipts to authenticated;
grant select, insert, update, delete on public.receipt_items to authenticated;

-- 4) Storage: bucket privado para as fotos ------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Cada usuário só acessa a pasta com o próprio id: receipts/<user_id>/arquivo.jpg
create policy "Fotos: ler as próprias"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Fotos: enviar para a própria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Fotos: excluir as próprias"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
