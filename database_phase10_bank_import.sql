-- Banco de Dados: Fase 10 - Importação de Extratos Bancários (CSV/OFX)
-- Executar no SQL Editor do Supabase

-- 1. Adicionar identificador único da transação bancária e vínculo de loja na tabela financeira
-- Isso evita importar a mesma transação do extrato duas vezes.
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS bank_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS store_id UUID;

-- 2. Tabela para rastrear transações que o usuário escolheu ignorar
-- Para que o sistema não ofereça novamente uma transação já ignorada em extratos futuros.
CREATE TABLE IF NOT EXISTS public.ignored_bank_transactions (
    bank_transaction_id TEXT PRIMARY KEY,
    ignored_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desabilitar RLS para desenvolvimento local
ALTER TABLE public.ignored_bank_transactions DISABLE ROW LEVEL SECURITY;

-- Políticas de acesso aberto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ignored_bank_transactions' AND policyname = 'Acesso total a ignored_bank_transactions'
    ) THEN
        CREATE POLICY "Acesso total a ignored_bank_transactions" ON public.ignored_bank_transactions FOR ALL USING (true);
    END IF;
END
$$;
