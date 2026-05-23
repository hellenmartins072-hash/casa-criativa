-- Banco de Dados: Fase 5 - Produtos, Catálogos e Loja Virtual
-- Executar no SQL Editor do Supabase

-- 1. Criação do Bucket de Imagens no Storage (Se der erro nesta linha de permissão, pule e crie manualmente pelo painel Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Tabela de Produtos Finais
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    price_retail DECIMAL(10,2) DEFAULT 0.00,
    price_resale DECIMAL(10,2) DEFAULT 0.00,
    price_ecommerce DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    store_id UUID, -- Sem foreign key para evitar erros caso a tabela stores não exista
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Catálogos Customizados
CREATE TABLE IF NOT EXISTS catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    store_id UUID,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Ligação: Produtos dentro de um Catálogo
CREATE TABLE IF NOT EXISTS catalog_products (
    catalog_id UUID REFERENCES catalogs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (catalog_id, product_id)
);
