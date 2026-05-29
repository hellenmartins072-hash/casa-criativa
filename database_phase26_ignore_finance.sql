ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS ignore_auto_finance BOOLEAN DEFAULT false;
