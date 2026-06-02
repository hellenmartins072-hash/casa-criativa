-- 1. Add amount_paid to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0.00;

-- 2. Create order_history table
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for order_history
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.order_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.order_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.order_history
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.order_history
  FOR DELETE USING (auth.role() = 'authenticated');

-- Forçar atualização do Cache da API do Supabase
NOTIFY pgrst, 'reload schema';
