-- Banco de Dados: Fase 4 - Materiais, Fornecedores e Precificação
-- Executar no SQL Editor do Supabase

-- Tabela de Fornecedores e Parceiros
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    type TEXT, -- Fornecedor de material, Serviço terceirizado, Parceiro de revenda
    provided_items TEXT,
    average_delivery_days INTEGER,
    payment_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Materiais e Estoque
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT, -- Caneca, Camiseta, Topo de bolo, etc.
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    unit_measure TEXT, -- Unidade, Metro, Kg, Litro
    current_stock DECIMAL(10,2) DEFAULT 0.00,
    minimum_stock DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Regras de Precificação (Markup)
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT UNIQUE NOT NULL,
    markup_retail DECIMAL(10,2) DEFAULT 0.00,
    markup_resale DECIMAL(10,2) DEFAULT 0.00,
    markup_corporate DECIMAL(10,2) DEFAULT 0.00,
    markup_shopee DECIMAL(10,2) DEFAULT 0.00,
    markup_mercado_livre DECIMAL(10,2) DEFAULT 0.00,
    markup_elo7 DECIMAL(10,2) DEFAULT 0.00,
    markup_instagram DECIMAL(10,2) DEFAULT 0.00,
    markup_tiktok DECIMAL(10,2) DEFAULT 0.00,
    markup_google DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir algumas categorias padrão na tabela de precificação para adiantar o trabalho
INSERT INTO pricing_rules (category, markup_retail) VALUES
('Caneca', 100),
('Topo de bolo', 150),
('Corte laser', 200),
('Brinde', 80),
('Embalagem', 50)
ON CONFLICT (category) DO NOTHING;
