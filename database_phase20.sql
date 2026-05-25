-- Banco de Dados: Atualização da Fase 20
-- Vendas, Marketing Ativo e Programa de Indicação
-- Executar no SQL Editor do Supabase

-- 1. Crédito de Indicação para Clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS referral_credit DECIMAL(12,2) DEFAULT 0;

-- 2. Tabela de Cupons de Indicação (Referral)
CREATE TABLE IF NOT EXISTS public.referral_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- Ex: MARIA10
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  discount_percent DECIMAL(5,2) DEFAULT 0, -- Ex: 10% de desconto para o amigo
  credit_reward DECIMAL(12,2) DEFAULT 0, -- Ex: R$ 15 de crédito para a Maria
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index para busca rápida de cupom
CREATE INDEX IF NOT EXISTS idx_referral_coupons_code ON public.referral_coupons(code);
