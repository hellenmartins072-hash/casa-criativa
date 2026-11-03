-- Phase 28: Suporte a fotos/imagens nos itens de orçamentos e pedidos
-- Permite anexar múltiplas imagens por item no Supabase Storage

-- 1. Adicionar coluna image_urls na tabela order_items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 2. Garantir bucket order-files e políticas públicas no Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-files', 'order-files', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Atualizar cache da API do PostgREST
NOTIFY pgrst, 'reload schema';
