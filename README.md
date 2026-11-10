# ScanIA

Aplicativo mobile que lê notas fiscais com inteligência artificial: fotografe o
cupom, e o app extrai estabelecimento, data, valor, categoria e itens. Você revisa,
corrige e acompanha seus gastos por categoria.

Projeto 5 de 5 da disciplina **Programação para Dispositivos Móveis** (IESB),
construído a partir do guia do Prof. Me. Bruno Assunção Dias.

## Funcionalidades

- Cadastro, login e sessão persistente (Supabase Auth)
- Captura por câmera ou galeria, com redução da imagem antes do envio
- Leitura da nota por IA em uma **Edge Function** (a chave da IA nunca vai para o app)
- Saída estruturada da IA (tool use) e validação testada antes de gravar no banco
- Revisão e correção dos dados extraídos (humano no circuito)
- Resumo mensal com gráfico por categoria
- Fotos em **Storage privado**, com acesso restrito ao dono (RLS)

## Tecnologias

React Native · Expo (SDK 58) · Expo Router · TypeScript · Supabase (Auth, Postgres,
RLS, Storage, Edge Functions em Deno) · Claude API (visão) · TanStack Query ·
React Hook Form · Zod · Jest · PGlite (testes do banco)

## Como executar (Supabase local)

O projeto roda com o **Supabase local em Docker**, com portas próprias
(54360–54369) para conviver com outros projetos no mesmo computador.

1. Instale as dependências: `npm install`
2. Com o Docker aberto, inicie o Supabase: `npx supabase start`
3. Crie as tabelas, as políticas e o bucket:
   `docker exec -i supabase_db_scania psql -U postgres < supabase/schema.sql`
4. Copie `.env.example` para `.env` com o endereço do computador na rede
   (`http://NOME-DO-MAC.local:54361`) e a chave **Publishable** que aparece em
   `npx supabase status`.
5. Copie `supabase/functions/.env.example` para `supabase/functions/.env`
   (`MOCK_AI=true` para o modo simulado) e, em outro Terminal, sirva a função:
   `npx supabase functions serve`
6. Inicie o app com `npx expo start` e abra no Expo Go.

Para usar a IA de verdade, coloque `ANTHROPIC_API_KEY` e `MOCK_AI=false` em
`supabase/functions/.env` e reinicie o `functions serve`. A chave fica só nesse
arquivo, que está fora do Git.

No Supabase da nuvem, o caminho é o do guia: `npx supabase link`,
`npx supabase secrets set MOCK_AI=true` e `npx supabase functions deploy scan-receipt`.

## Testes

| Comando             | O que testa                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `npm test`          | Tudo: app (Jest) e banco (PGlite)                                 |
| `npm run test:app`  | 36 testes: dinheiro, datas, resumo e validação da resposta da IA  |
| `npm run test:db`   | 14 testes: RLS de notas e itens, Storage, restrições e permissões |
| `npm run typecheck` | Verifica os tipos                                                 |

Os testes do banco reproduzem as **permissões padrão do Supabase real** (que
liberam tudo para `anon` e `authenticated`, inclusive `TRUNCATE`); o
`schema.sql` revoga essas permissões e concede só o necessário.

## Diferenças em relação ao guia

Correções feitas durante a construção, todas documentadas no relatório:

- **Segurança:** `revoke` dos privilégios padrão do Supabase nas duas tabelas, e
  a foto de uma nota precisa estar na pasta do próprio dono.
- **Modo simulado:** a nota simulada usa a data de hoje, para aparecer no resumo
  do mês atual.
- **Excluir nota:** o app não busca de novo a nota que acabou de apagar.
- **Sem conexão:** limite de tempo nas requisições (maior para a Edge Function, que
  espera a IA) e mensagens de rede do iOS traduzidas.
- **Versões:** Expo SDK 58 (o guia usa o 57) e dois ajustes de tipo.

## Arquitetura

```
app/            rotas (Expo Router): (auth) login e cadastro; (app) abas e detalhes
src/
  components/   interface (botões, campos, cartões, gráfico, formulário de revisão)
  constants/    categorias
  context/      sessão do Supabase Auth
  hooks/        notas com TanStack Query
  lib/          cliente do Supabase e do TanStack Query
  schemas/      validação dos formulários (Zod)
  services/     notas, Storage, Edge Function, câmera e galeria
  theme/        cores, espaçamentos e raios
  utils/        dinheiro, datas, resumo, erros e ícones
supabase/
  config.toml               Supabase local (portas próprias, Storage e Edge Functions)
  schema.sql                tabelas, RLS, bucket privado e políticas do Storage
  functions/scan-receipt/   Edge Function (Deno) que chama a IA; parse.ts é puro e testado
  tests/                    testes do banco
__tests__/      testes unitários (Jest)
```

## Autora

**Karina Ribeiro Modesto**

- GitHub: https://github.com/Karina-RM
