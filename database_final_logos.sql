-- Banco de Dados: Atualização Final (Logotipos)
-- Executar no SQL Editor do Supabase

-- 1. Tabela Stores: Adição de Logo
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Storage Bucket "logos"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies para Logos
CREATE POLICY "Public Access Logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Auth Insert Logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Auth Update Logos" ON storage.objects
FOR UPDATE USING (bucket_id = 'logos');

CREATE POLICY "Auth Delete Logos" ON storage.objects
FOR DELETE USING (bucket_id = 'logos');
