-- Adicionar FK de fornecedor nos serviços terceirizados
ALTER TABLE public.outsourced_services
ADD CONSTRAINT outsourced_services_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
