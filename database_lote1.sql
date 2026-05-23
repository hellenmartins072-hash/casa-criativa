-- Banco de Dados: Atualizações do Lote 1
-- Executar no SQL Editor do Supabase

-- 1. Tabela de Clientes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram TEXT;

-- 2. Tabela de Empresas
ALTER TABLE companies ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Tabela de Fornecedores
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
