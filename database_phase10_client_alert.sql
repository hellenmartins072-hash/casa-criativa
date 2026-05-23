-- Script SQL para adicionar campo de aviso interno na tabela de clientes
-- Fase 10 - Casa Criativa

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS internal_alert TEXT;

-- Comentário
COMMENT ON COLUMN public.clients.internal_alert IS 'Aviso interno oculto (ex: cliente inadimplente, problemas de comportamento) que exibe um banner vermelho na ficha do cliente.';
