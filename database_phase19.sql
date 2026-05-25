-- Banco de Dados: Atualização da Fase 19
-- Gestão Operacional (Checklist, Retrabalhos, Galeria de Projetos)
-- Executar no SQL Editor do Supabase

-- 1. Checklists de Produção por Pedido
CREATE TABLE IF NOT EXISTS public.order_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Registro de Retrabalhos e Erros
CREATE TABLE IF NOT EXISTS public.order_reworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  extra_cost DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Galeria de Projetos (Portfólio Interno)
CREATE TABLE IF NOT EXISTS public.project_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT, -- Ex: 'Acrílico', 'MDF', 'Casamento'
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Criação do Bucket de Storage para a Galeria
-- Nota: se der erro de permissão no bucket via SQL, criar o bucket "gallery" como Public no painel do Supabase.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies para a Galeria
CREATE POLICY "Public Access Gallery" ON storage.objects
FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Auth Insert Gallery" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Auth Update Gallery" ON storage.objects
FOR UPDATE USING (bucket_id = 'gallery');

CREATE POLICY "Auth Delete Gallery" ON storage.objects
FOR DELETE USING (bucket_id = 'gallery');
