-- Banco de Dados: Atualizações Lote 4
-- Executar no SQL Editor do Supabase

-- 1. Adicionar amount_paid
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0;

-- 2. Tabela de Histórico de Pedidos
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Variações de Produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb;

-- 4. Criação da Tabela de Serviços Terceirizados (Fase 11)
CREATE TABLE IF NOT EXISTS public.outsourced_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  cost NUMERIC(10, 2) DEFAULT 0,
  sent_date DATE,
  expected_return_date DATE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Permitir operações na tabela de serviços terceirizados (RLS)
ALTER TABLE public.outsourced_services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'outsourced_services' AND policyname = 'Enable all operations for outsourced_services'
    ) THEN
        CREATE POLICY "Enable all operations for outsourced_services"
        ON public.outsourced_services
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;
