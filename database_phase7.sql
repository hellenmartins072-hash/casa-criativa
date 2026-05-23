-- Script SQL para criar as tabelas do módulo Financeiro
-- Fase 7: Casa Criativa

CREATE TYPE transaction_type AS ENUM ('Receita', 'Despesa');
CREATE TYPE transaction_status AS ENUM ('Pendente', 'Pago', 'Cancelado');

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    category TEXT, -- Vendas, Fornecedores, Impostos, Salários, etc.
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    payment_date DATE,
    status transaction_status DEFAULT 'Pendente',
    payment_method payment_method, -- Aproveita o enum que criamos na Fase 3/6
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Se vier de um pedido
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL, -- Se vier de uma compra
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desabilitar RLS (Row Level Security) para o ambiente de desenvolvimento
ALTER TABLE public.financial_transactions DISABLE ROW LEVEL SECURITY;

-- Políticas abertas caso o RLS seja ativado futuramente
CREATE POLICY "Acesso total a financial_transactions" ON public.financial_transactions FOR ALL USING (true);
