-- Banco de Dados: Fase 8 - Controle de Estoque Integrado (Receitas e Baixas)
-- Executar no SQL Editor do Supabase

-- 1. Criação do Tipo de Movimentação de Estoque
CREATE TYPE movement_type AS ENUM ('Entrada', 'Saída', 'Ajuste');

-- 2. Tabela de Receita do Produto (Quais materiais formam o produto)
CREATE TABLE IF NOT EXISTS public.product_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,4) NOT NULL DEFAULT 1.0000, -- Quantidade de material usada para 1 unidade do produto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Movimentações de Estoque (Histórico e Consumo)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,4) NOT NULL, -- Valores positivos para Entrada/Ajuste, Negativos/Positivos para Saída
    description TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Caso a saída seja de um pedido
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Desabilitar RLS (Row Level Security) temporariamente para o ambiente de desenvolvimento
ALTER TABLE public.product_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements DISABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas abertas para evitar erros
CREATE POLICY "Acesso total a product_materials" ON public.product_materials FOR ALL USING (true);
CREATE POLICY "Acesso total a inventory_movements" ON public.inventory_movements FOR ALL USING (true);
