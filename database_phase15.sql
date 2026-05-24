-- Banco de Dados: Atualização da Fase 15
-- Adicionando campo de Meta Mensal de Faturamento na tabela de configurações
-- Executar no SQL Editor do Supabase

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS monthly_revenue_goal NUMERIC(10, 2) DEFAULT 0;
