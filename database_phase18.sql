-- Banco de Dados: Atualização da Fase 18
-- Financeiro Avançado (Contas Bancárias, Contas a Pagar/Receber, Comissões B2B)
-- Executar no SQL Editor do Supabase

-- 1. Contas Bancárias (Separação PF/PJ)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Ex: "Nubank PF", "Inter PJ"
  type TEXT NOT NULL, -- 'PF' ou 'PJ'
  balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Atualização das Transações Financeiras (Contas a Pagar/Receber)
-- Adiciona suporte a status e vencimento, e vincula à conta bancária.
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pago'; -- 'Pago', 'Pendente', 'Atrasado'

-- 3. Atualização de Empresas B2B (Comissões)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage'; -- 'percentage' ou 'fixed'
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS commission_value DECIMAL(12,2) DEFAULT 0;

-- 4. Tabela de Comissões a Pagar
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'Pendente', -- 'Pendente', 'Pago'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  paid_at TIMESTAMP WITH TIME ZONE
);
