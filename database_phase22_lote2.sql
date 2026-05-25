-- Script Phase 22: Lote 2 - Logotipos e WhatsApp

-- 1. Colunas do WhatsApp na Tabela Settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='whatsapp_api_token') THEN
    ALTER TABLE public.settings ADD COLUMN whatsapp_api_token TEXT;
    ALTER TABLE public.settings ADD COLUMN whatsapp_phone_id TEXT;
    ALTER TABLE public.settings ADD COLUMN whatsapp_template_name TEXT DEFAULT 'status_pedido';
    ALTER TABLE public.settings ADD COLUMN auto_whatsapp_notification BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. Coluna de Logo na Tabela Stores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='logo_url') THEN
    ALTER TABLE public.stores ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- 3. Bucket de Storage para Logotipos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true) ON CONFLICT (id) DO NOTHING;

-- Criar políticas de segurança para o Bucket brand-logos
DROP POLICY IF EXISTS "Acesso publico aos logos" ON storage.objects;
CREATE POLICY "Acesso publico aos logos" ON storage.objects FOR SELECT USING ( bucket_id = 'brand-logos' );

DROP POLICY IF EXISTS "Upload de logos" ON storage.objects;
CREATE POLICY "Upload de logos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'brand-logos' );

DROP POLICY IF EXISTS "Atualizar logos" ON storage.objects;
CREATE POLICY "Atualizar logos" ON storage.objects FOR UPDATE USING ( bucket_id = 'brand-logos' );

DROP POLICY IF EXISTS "Excluir logos" ON storage.objects;
CREATE POLICY "Excluir logos" ON storage.objects FOR DELETE USING ( bucket_id = 'brand-logos' );
