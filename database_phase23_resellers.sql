-- Script Phase 23: Gestão de Revendedores (Admin)

CREATE TABLE IF NOT EXISTS public.resellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  document_number TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  social_media TEXT,
  bank_details TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Ativo', -- Ativo, Inativo, Suspenso
  discount_percentage NUMERIC(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Atualiza a tabela user_profiles para também referenciar um reseller_id se necessário
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='reseller_id') THEN
    ALTER TABLE public.user_profiles ADD COLUMN reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar políticas de RLS para Resellers
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin tem acesso total a resellers" ON public.resellers;
CREATE POLICY "Admin tem acesso total a resellers" ON public.resellers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Revendedor vê seu próprio cadastro" ON public.resellers;
CREATE POLICY "Revendedor vê seu próprio cadastro" ON public.resellers FOR SELECT USING (
  user_id = auth.uid()
);

-- Adicionar gatilho para updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_resellers_updated_at ON public.resellers;
CREATE TRIGGER set_resellers_updated_at
BEFORE UPDATE ON public.resellers
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
