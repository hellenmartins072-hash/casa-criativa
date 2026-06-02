-- Adicionar data de aniversário/fundação em Revendedores
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Adicionar data de aniversário/fundação em Empresas B2B
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Forçar atualização do Cache da API do Supabase
NOTIFY pgrst, 'reload schema';
