-- Script SQL para criar as tabelas de Pedidos (Orders) e Itens (Order Items)
-- Fase 6: Casa Criativa

-- Tipos Enum para garantir padronização
CREATE TYPE order_status AS ENUM ('Orçamento', 'Aprovado', 'Em Produção', 'Finalizado', 'Entregue', 'Cancelado');
-- Nota: O enum payment_method já foi criado na Fase 3. Se houver erro de "already exists", o script continuará normalmente.

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    store_id UUID, -- Sem FK forçada para evitar problemas de bloqueio
    status order_status DEFAULT 'Orçamento',
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    payment_method payment_method,
    payment_status TEXT DEFAULT 'Pendente',
    notes TEXT,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Salvamos o nome para histórico (caso o produto seja apagado depois)
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT, -- Observações específicas do item (ex: Nome na caneca)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desabilitar RLS (Row Level Security) para o ambiente de desenvolvimento
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Políticas abertas caso o RLS seja ativado futuramente
CREATE POLICY "Acesso total a orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Acesso total a order_items" ON public.order_items FOR ALL USING (true);
