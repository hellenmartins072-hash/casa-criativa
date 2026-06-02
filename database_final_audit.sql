-- Script de Auditoria e Atualização Final do Banco de Dados
-- Executar no SQL Editor do Supabase

-- 1. Permitir exclusão de Empresa (Cascade Delete em Contatos)
ALTER TABLE public.company_contacts 
DROP CONSTRAINT IF EXISTS company_contacts_company_id_fkey;

ALTER TABLE public.company_contacts 
ADD CONSTRAINT company_contacts_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Modificar pagamento_method em companies para aceitar array/texto livre
-- Como a coluna payment_method pode ter um CHECK (ex: 'PIX', 'Boleto'), vamos descartar e criar uma nova `payment_methods` (Array)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}'::TEXT[];

-- Opcional: Migrar dados antigos (se payment_method tiver valor, colocar no array)
UPDATE public.companies SET payment_methods = ARRAY[payment_method] WHERE payment_method IS NOT NULL AND array_length(payment_methods, 1) IS NULL;

-- 3. Adicionar campos extras na tabela Orders (Orçamentos/Pedidos)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_date DATE;

-- 4. Adicionar campos de recorrência na tabela de Contas a Pagar (Accounts Payable)
-- (Garante que a tabela existe antes)
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Pendente',
    category TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS current_installment INTEGER DEFAULT 1;
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS recurrence_period TEXT DEFAULT 'Mensal';

-- Forçar atualização do Schema Cache
NOTIFY pgrst, 'reload schema';
