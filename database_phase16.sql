-- Banco de Dados: Atualização da Fase 16
-- CRM, Histórico de Clientes e Contratos
-- Executar no SQL Editor do Supabase

-- 1. Tabela de Histórico de Interações (CRM)
CREATE TABLE IF NOT EXISTS public.client_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL DEFAULT 'WhatsApp', -- WhatsApp, Ligação, E-mail, Reunião, Outros
  notes TEXT NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Check constraints to ensure at least one relationship exists
ALTER TABLE public.client_interactions ADD CONSTRAINT chk_client_or_company CHECK (
  (client_id IS NOT NULL AND company_id IS NULL) OR 
  (company_id IS NOT NULL AND client_id IS NULL)
);

-- 2. Novas Colunas na Tabela Orders para o Contrato Digital
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contract_signature_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contract_ip TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contract_accepted_by TEXT;

-- 3. Criação do Bucket de Storage para Assinaturas
-- Nota: Caso este comando falhe no SQL Editor por falta de permissão, 
-- crie o bucket manualmente na aba 'Storage' do Supabase com o nome 'signatures', 
-- e deixe-o como Público.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o Bucket (Permite inserção pública e leitura pública)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');
