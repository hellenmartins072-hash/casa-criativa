-- Script SQL para criar a tabela de Lojas/Perfis no Supabase

CREATE TYPE store_type AS ENUM ('Varejo', 'Laser', 'Corporativo', 'E-commerce');

CREATE TABLE public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instagram TEXT,
  type store_type NOT NULL DEFAULT 'Varejo',
  color TEXT DEFAULT '#5C3D8F',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- Permitir que qualquer usuário autenticado veja as lojas (leitura)
CREATE POLICY "Usuários autenticados podem ver as lojas"
ON public.stores FOR SELECT
TO authenticated
USING (true);

-- Permitir que apenas usuários com permissão possam inserir/editar lojas
-- NOTA: Por enquanto permitiremos todos os autenticados, mas isso deve
-- ser restrito posteriormente baseando-se no perfil/role do usuário.
CREATE POLICY "Usuários autenticados podem inserir lojas"
ON public.stores FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar lojas"
ON public.stores FOR UPDATE
TO authenticated
USING (true);

-- Dados Iniciais (Madu, Studio Laser, Casa Criativa, Topo de Bolo Anápolis)
INSERT INTO public.stores (name, instagram, type, color) VALUES
('Madu Personalizados', '@madupersonalizados', 'Varejo', '#FF69B4'),
('Studio Laser', '@studiolaser', 'Laser', '#333333'),
('Casa Criativa', '@casacriativa', 'Corporativo', '#5C3D8F'),
('Topo de Bolo Anápolis', '@topodeboloanapolis', 'E-commerce', '#FFB6C1');
