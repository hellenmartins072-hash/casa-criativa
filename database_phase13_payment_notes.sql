-- Banco de Dados: Atualização da Fase 13
-- Adicionando campo para Detalhes de Pagamento e Parcelamentos no Pedido
-- Executar no SQL Editor do Supabase

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_notes TEXT;
