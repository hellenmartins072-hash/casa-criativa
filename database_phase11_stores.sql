-- Script SQL para criar a tabela de Lojas e Perfis da Casa Criativa
-- Fase 11 - Casa Criativa

CREATE TYPE store_type AS ENUM ('Varejo', 'Laser', 'Corporativo', 'E-commerce');

CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instagram TEXT,
  type store_type DEFAULT 'Varejo',
  color TEXT DEFAULT 'bg-purple-500',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir as 4 lojas padrão (apenas se a tabela estiver vazia)
INSERT INTO public.stores (name, instagram, type, color, is_active)
SELECT 'Madu Personalizados', '@madupersonalizados', 'Varejo', 'bg-pink-500', true
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE name = 'Madu Personalizados');

INSERT INTO public.stores (name, instagram, type, color, is_active)
SELECT 'Studio Laser', '@studiolaser', 'Laser', 'bg-gray-800', true
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE name = 'Studio Laser');

INSERT INTO public.stores (name, instagram, type, color, is_active)
SELECT 'Casa Criativa', '@casacriativa', 'Corporativo', 'bg-[#5C3D8F]', true
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE name = 'Casa Criativa');

INSERT INTO public.stores (name, instagram, type, color, is_active)
SELECT 'Topo de Bolo Anápolis', '@topodeboloanapolis', 'E-commerce', 'bg-rose-300', true
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE name = 'Topo de Bolo Anápolis');

-- Adicionando políticas de segurança simples
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.stores FOR ALL TO authenticated USING (true) WITH CHECK (true);
