-- Script para corrigir Row Level Security (RLS) nas tabelas secundárias

-- 1. company_contacts
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a company_contacts" ON public.company_contacts;
CREATE POLICY "Acesso total a company_contacts" ON public.company_contacts FOR ALL USING (true) WITH CHECK (true);

-- 2. supplier_products
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total a supplier_products" ON public.supplier_products;
CREATE POLICY "Acesso total a supplier_products" ON public.supplier_products FOR ALL USING (true) WITH CHECK (true);

