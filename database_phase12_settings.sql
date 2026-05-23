-- Script SQL para criar tabelas de Configurações e Taxas Dinâmicas
-- Fase 12 - Casa Criativa

-- 1. Tabela Global de Configurações da Empresa (Singleton)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Sempre será 1
  business_name TEXT DEFAULT 'Casa Criativa',
  document_number TEXT, -- CNPJ ou CPF
  phone TEXT,
  email TEXT,
  address TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row CHECK (id = 1) -- Garante que só terá uma linha
);

-- Inserir a linha padrão se não existir
INSERT INTO public.settings (id, business_name) 
VALUES (1, 'Casa Criativa') 
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Taxas Dinâmicas (Maquininhas, Shopee, Links, etc.)
CREATE TYPE fee_type AS ENUM ('Maquininha', 'Plataforma', 'Link de Pagamento', 'Outros');

CREATE TABLE IF NOT EXISTS public.payment_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Ex: "Shopee", "Ton Aproximação", "Mercado Livre"
  type fee_type DEFAULT 'Outros',
  percentage_fee NUMERIC DEFAULT 0, -- Taxa em % (Ex: 18.00)
  fixed_fee NUMERIC DEFAULT 0, -- Taxa fixa em R$ (Ex: 3.00)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserindo algumas taxas de exemplo para demonstração inicial
INSERT INTO public.payment_fees (name, type, percentage_fee) VALUES
('PIX', 'Outros', 0.00),
('Cartão Débito (Padrão)', 'Maquininha', 1.99),
('Cartão Crédito 1x (Padrão)', 'Maquininha', 3.49),
('Shopee', 'Plataforma', 18.00),
('Mercado Livre', 'Plataforma', 16.00)
ON CONFLICT DO NOTHING;

-- Adicionando políticas de segurança simples (Liberado para dev)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.payment_fees FOR ALL TO authenticated USING (true) WITH CHECK (true);
