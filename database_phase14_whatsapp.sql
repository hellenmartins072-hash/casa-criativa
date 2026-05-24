-- Banco de Dados: Atualização da Fase 14
-- Adicionando campos para Integração com WhatsApp Oficial (Meta)
-- Executar no SQL Editor do Supabase

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS wa_access_token TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS wa_template_approved TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS wa_template_production TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS wa_template_ready TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS wa_template_delivered TEXT;
