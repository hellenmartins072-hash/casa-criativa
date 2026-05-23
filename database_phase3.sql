-- Script SQL para criar as tabelas de Clientes e Empresas B2B

CREATE TYPE client_type AS ENUM ('Varejo', 'Revenda', 'Corporativo');
CREATE TYPE client_status AS ENUM ('Ativo', 'Despedido');
CREATE TYPE payment_method AS ENUM ('PIX', 'Cartão', 'Boleto', 'Dinheiro');

-- Tabela de Empresas B2B
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  trading_name TEXT,
  cnpj TEXT,
  phone TEXT,
  address TEXT,
  store_ids TEXT[], -- Array de IDs de lojas associadas
  payment_method payment_method,
  boleto_only BOOLEAN DEFAULT false,
  boleto_days INTEGER,
  status client_status DEFAULT 'Ativo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Clientes
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  additional_phone TEXT,
  email TEXT,
  cpf TEXT,
  address TEXT,
  birth_date DATE,
  children_birthdays JSONB, -- Formato: [{"name": "João", "date": "2015-05-10"}]
  store_ids TEXT[],
  client_type client_type DEFAULT 'Varejo',
  status client_status DEFAULT 'Ativo',
  is_vip BOOLEAN DEFAULT false,
  preferred_payment payment_method,
  accepts_boleto BOOLEAN DEFAULT false,
  social_media TEXT,
  posts_products BOOLEAN DEFAULT false,
  discount_percentage NUMERIC,
  was_referred BOOLEAN DEFAULT false,
  referrer_name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar as referências de contatos na tabela de companies agora que clients existe
ALTER TABLE public.companies ADD COLUMN contact_quote_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.companies ADD COLUMN contact_approval_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.companies ADD COLUMN contact_finance_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança simplificadas para desenvolvimento
CREATE POLICY "Acesso total a companies" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total a clients" ON public.clients FOR ALL TO authenticated USING (true);
