-- Banco de Dados: Atualizações do Lote 3
-- Executar no SQL Editor do Supabase

-- 1. Contatos Internos das Empresas B2B
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT, -- Ex: Gerente de Compras, RH, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabela de Preços/Insumos dos Fornecedores
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT, -- Condições, Qtd Mínima, Prazo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
