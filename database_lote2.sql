-- Banco de Dados: Atualizações do Lote 2
-- Executar no SQL Editor do Supabase

-- 1. Tabela de Parceiros de Frete / Entregadores
CREATE TABLE IF NOT EXISTS shipping_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  base_fee NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Atualizar Tabela de Configurações da Empresa (Dados Bancários, Cores, Logo)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bank_pix TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bank_agency TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#5C3D8F';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. Atualizar Tabela de Pedidos (Orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_installments INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credit_fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_payment_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_partner_id UUID REFERENCES shipping_partners(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS out_of_state_shipping BOOLEAN DEFAULT false;
