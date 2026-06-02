-- 1. Permitir exclusão de Empresa (Cascade Delete em Contatos)
ALTER TABLE public.company_contacts 
DROP CONSTRAINT IF EXISTS company_contacts_company_id_fkey;

ALTER TABLE public.company_contacts 
ADD CONSTRAINT company_contacts_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Modificar pagamento_method em companies para aceitar multiplos (Array)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}'::TEXT[];

-- 3. Adicionar Revendedores e Datas na tabela Orders (Pedidos/Orçamentos)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_date DATE;

-- 4. Adicionar campos de recorrência na tabela de Financeiro (financial_transactions)
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS current_installment INTEGER DEFAULT 1;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS recurrence_period TEXT DEFAULT 'Mensal';

-- Forçar atualização do Cache da API do Supabase
NOTIFY pgrst, 'reload schema';
