-- Script SQL para criar a tabela de Serviços Terceirizados vinculados a Pedidos
-- Fase 11 - Casa Criativa

CREATE TYPE outsourced_status AS ENUM (
  'Aguardando envio', 
  'Enviado', 
  'Em produção parceiro', 
  'Recebido', 
  'Problema'
);

CREATE TABLE public.outsourced_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  cost NUMERIC DEFAULT 0.00,
  sent_date DATE,
  expected_return_date DATE,
  status outsourced_status DEFAULT 'Aguardando envio',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.outsourced_services ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança simplificadas para desenvolvimento
CREATE POLICY "Acesso total a outsourced_services" 
ON public.outsourced_services 
FOR ALL TO authenticated 
USING (true);

-- Comentários
COMMENT ON TABLE public.outsourced_services IS 'Registros de serviços terceirizados vinculados a pedidos específicos.';
