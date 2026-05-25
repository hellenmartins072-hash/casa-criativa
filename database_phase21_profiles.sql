-- Script Phase 21: Perfis e Arquivos

-- 1. Tabela de Perfis (User Profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin' ou 'reseller'
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para criar perfil automaticamente ao cadastrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'admin'); -- Por padrão, novos usuários são admins.
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Habilitar RLS em user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a user_profiles" ON public.user_profiles;
CREATE POLICY "Acesso total a user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela de Arquivos do Pedido
CREATE TABLE IF NOT EXISTS public.order_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em order_files
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a order_files" ON public.order_files;
CREATE POLICY "Acesso total a order_files" ON public.order_files FOR ALL USING (true) WITH CHECK (true);

-- 3. Inserir perfis para os usuários existentes (se não existirem)
INSERT INTO public.user_profiles (id, role)
SELECT id, 'admin' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ATENÇÃO: Para o Storage, você precisará executar no painel SQL do Supabase:
-- insert into storage.buckets (id, name, public) values ('order-files', 'order-files', true);
-- CREATE POLICY "Acesso publico aos arquivos" ON storage.objects FOR SELECT USING ( bucket_id = 'order-files' );
-- CREATE POLICY "Upload de arquivos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'order-files' );
