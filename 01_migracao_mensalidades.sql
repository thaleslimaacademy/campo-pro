-- ============================================================
-- GestaoFC · Fase 1 · Controle de mensalidades mês a mês
-- Tabela real: "Cobranca" (maiúscula → precisa de aspas)
-- Pode rodar AGORA. É seguro: não apaga nada.
-- ============================================================

-- 1) Colunas novas
alter table "Cobranca"
  add column if not exists competencia date,
  add column if not exists "excluidaEm" timestamp;

-- 2) BÔNUS: organiza as cobranças que JÁ existem por mês
--    (preenche a competência usando o mês do vencimento)
update "Cobranca"
set competencia = date_trunc('month', vencimento)::date
where competencia is null and vencimento is not null;

-- 3) Índices para filtrar rápido
create index if not exists idx_cobranca_competencia
  on "Cobranca" ("escolaId", competencia);

create index if not exists idx_cobranca_excluida
  on "Cobranca" ("excluidaEm");
