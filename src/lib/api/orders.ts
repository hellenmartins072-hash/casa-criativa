import { supabase } from '../supabase'
import { createTransaction } from './finance'

export type OrderStatus = 'Orçamento' | 'Aprovado' | 'Em Produção' | 'Finalizado' | 'Entregue' | 'Cancelado'
export type PaymentMethod = 'PIX' | 'Cartão de crédito' | 'Cartão de débito' | 'Transferência' | 'Boleto' | 'Dinheiro'

export type OrderItem = {
  id?: string
  order_id?: string
  product_id?: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string | null
  created_at?: string
}

export type Order = {
  id: string
  order_number: number
  client_id?: string | null
  company_id?: string | null
  store_id?: string | null
  status: OrderStatus
  total_amount: number
  discount_amount: number
  shipping_cost: number
  amount_paid?: number
  payment_method?: PaymentMethod | null
  payment_status?: string
  notes?: string | null
  deadline?: string | null
  
  // Novos campos do Lote 2
  credit_installments?: number
  credit_fee?: number
  entry_date?: string | null
  final_payment_date?: string | null
  delivery_date?: string | null
  shipping_partner_id?: string | null
  out_of_state_shipping?: boolean
  payment_notes?: string | null
  
  // Novos campos Lote 3
  reseller_id?: string | null
  quote_date?: string | null
  order_date?: string | null
  created_at: string
  
  // Relações que vamos puxar do banco
  clients?: { full_name: string } | null
  companies?: { business_name: string, trading_name?: string } | null
  items?: OrderItem[]
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      clients(full_name),
      companies(business_name, trading_name),
        resellers(full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
  return data as Order[]
}

export async function getOrder(id: string) {
  // Puxa o pedido base
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      clients(full_name, whatsapp, email),
      companies(business_name, trading_name, phone, cnpj),
        resellers(full_name, whatsapp, phone)
    `)
    .eq('id', id)
    .single()

  if (orderError) throw orderError

  // Puxa os itens do pedido
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  if (itemsError) throw itemsError

  return {
    ...order,
    items
  } as Order
}

export async function createOrder(orderData: Partial<Order>, items: OrderItem[]) {
  // 1. Cria o pedido
  const payload: any = {
    status: orderData.status || 'Orçamento',
    total_amount: orderData.total_amount || 0,
    discount_amount: orderData.discount_amount || 0,
    shipping_cost: orderData.shipping_cost || 0,
    amount_paid: orderData.amount_paid || 0,
    payment_method: orderData.payment_method || null,
    payment_status: orderData.payment_status || 'Pendente',
    notes: orderData.notes || '',
    deadline: orderData.deadline || null,
    
    // Novos campos do Lote 2
    credit_installments: orderData.credit_installments || 1,
    credit_fee: orderData.credit_fee || 0,
    entry_date: orderData.entry_date || null,
    final_payment_date: orderData.final_payment_date || null,
    delivery_date: orderData.delivery_date || null,
    quote_date: orderData.quote_date,
    order_date: orderData.order_date || null,
    out_of_state_shipping: orderData.out_of_state_shipping || false,
    payment_notes: orderData.payment_notes || null
  }

  const uuidFields = ['client_id', 'company_id', 'store_id', 'reseller_id', 'shipping_partner_id'];
  uuidFields.forEach(field => {
    const val = (orderData as any)[field];
    if (val === '' || val === 'none') {
      payload[field] = null;
    } else if (val !== undefined) {
      payload[field] = val;
    }
  });

  if (orderData.quote_date) payload.quote_date = orderData.quote_date
  if (orderData.order_date) payload.order_date = orderData.order_date

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert([payload])
    .select()

  if (orderError || !newOrder || newOrder.length === 0) {
    console.error('Error creating order:', orderError)
    throw orderError
  }

  const orderId = newOrder[0].id

  // 2. Insere os itens
  if (items && items.length > 0) {
    const itemsData = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      notes: item.notes || ''
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsData)

    if (itemsError) {
      console.error('Error inserting order items:', itemsError)
      throw itemsError
    }
  }

  // 3. Integração Financeira Automática
  const amountToRegister = payload.payment_status === 'Pago' ? payload.total_amount : 
                           (payload.payment_status === 'Pago Parcial' && payload.amount_paid > 0) ? payload.amount_paid : 0;

  if (amountToRegister > 0) {
    await createTransaction({
      type: 'Receita',
      category: 'Vendas',
      description: `Pedido #${newOrder[0].order_number} (${payload.payment_status})`,
      amount: amountToRegister,
      due_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString().split('T')[0],
      status: 'Pago',
      payment_method: payload.payment_method || 'Dinheiro',
      order_id: orderId
    })
  }

  // 4. Integração de Estoque Automática (se já nascer Aprovado)
  if (payload.status === 'Aprovado' || payload.status === 'Em Produção' || payload.status === 'Entregue') {
    await processOrderInventoryDeduction(orderId)
  }

  // 5. Histórico do Pedido
  await addOrderHistory(orderId, payload.status, 'Pedido Criado');

  return newOrder[0]
}

export async function updateOrder(id: string, orderData: Partial<Order>, items: OrderItem[]) {
  // 1. Atualiza dados base do pedido
  const payload: any = {
    status: orderData.status,
    total_amount: orderData.total_amount,
    discount_amount: orderData.discount_amount,
    shipping_cost: orderData.shipping_cost,
    amount_paid: orderData.amount_paid,
    payment_method: orderData.payment_method,
    payment_status: orderData.payment_status,
    notes: orderData.notes,
    deadline: orderData.deadline,
    
    // Novos campos do Lote 2
    credit_installments: orderData.credit_installments,
    credit_fee: orderData.credit_fee,
    entry_date: orderData.entry_date,
    final_payment_date: orderData.final_payment_date,
    delivery_date: orderData.delivery_date,
    quote_date: orderData.quote_date,
    order_date: orderData.order_date,
    out_of_state_shipping: orderData.out_of_state_shipping,
    payment_notes: orderData.payment_notes
  }

  const uuidFieldsUpdate = ['client_id', 'company_id', 'store_id', 'reseller_id', 'shipping_partner_id'];
  uuidFieldsUpdate.forEach(field => {
    const val = (orderData as any)[field];
    if (val === '' || val === 'none') {
      payload[field] = null;
    } else if (val !== undefined) {
      payload[field] = val;
    }
  });

  const { data: oldOrder } = await supabase.from('orders').select('status').eq('id', id).single();

  const { error: orderError } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', id)

  if (orderError) throw orderError

  if (oldOrder && oldOrder.status !== payload.status) {
    await addOrderHistory(id, payload.status, `Status alterado de ${oldOrder.status} para ${payload.status}`);
  }

  // 2. Atualiza produtos (estratégia mais simples: deleta tudo e recria)
  const { error: delError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', id)

  if (delError) throw delError

  if (items && items.length > 0) {
    const itemsData = items.map(item => ({
      order_id: id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      notes: item.notes || ''
    }))

    const { error: insError } = await supabase
      .from('order_items')
      .insert(itemsData)

    if (insError) throw insError
  }

  // 3. Integração Financeira Automática
  const { data: existingTx } = await supabase
    .from('financial_transactions')
    .select('amount, status')
    .eq('order_id', id)
    .eq('status', 'Pago')

  const totalPaidSoFar = existingTx ? existingTx.reduce((acc, tx) => acc + Number(tx.amount), 0) : 0;
  
  let amountToRegister = 0;
  if (payload.payment_status === 'Pago') {
    amountToRegister = payload.total_amount - totalPaidSoFar;
  } else if (payload.payment_status === 'Pago Parcial' && payload.amount_paid > totalPaidSoFar) {
    amountToRegister = payload.amount_paid - totalPaidSoFar;
  }

  if (amountToRegister > 0) {
    await createTransaction({
      type: 'Receita',
      category: 'Vendas',
      description: `Pedido Atualizado (${payload.payment_status})`,
      amount: amountToRegister,
      due_date: new Date().toISOString().split('T')[0],
      payment_date: new Date().toISOString().split('T')[0],
      status: 'Pago',
      payment_method: payload.payment_method || 'Dinheiro',
      order_id: id
    })
  }

  // 4. Integração de Estoque
  if (payload.status === 'Aprovado' || payload.status === 'Em Produção' || payload.status === 'Entregue') {
    await processOrderInventoryDeduction(id)
  }

  return true
}

export async function deleteOrder(id: string) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting order:', error)
    throw error
  }
  return true
}



export async function processOrderInventoryDeduction(orderId: string) {
  // 1. Verifica se já houve baixa para este pedido (evitar duplicidade)
  const { data: existingMovements } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('order_id', orderId)
    .limit(1)

  if (existingMovements && existingMovements.length > 0) {
    return // Já foi baixado
  }

  // 2. Busca o pedido para pegar o número (para a descrição)
  const { data: order } = await supabase
    .from('orders')
    .select('order_number')
    .eq('id', orderId)
    .single()

  const orderDescription = `Baixa de Pedido #${order?.order_number || orderId.substring(0,6)}`

  // 3. Busca os itens do pedido
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (!items || items.length === 0) return

  // 4. Mapear consumo
  const materialConsumption: Record<string, number> = {}

  for (const item of items) {
    if (!item.product_id) continue // Item avulso sem produto cadastrado não tem ficha técnica

    // Busca ficha técnica (product_materials)
    const { data: bom } = await supabase
      .from('product_materials')
      .select('material_id, quantity')
      .eq('product_id', item.product_id)

    if (bom && bom.length > 0) {
      for (const mat of bom) {
        const totalNeeded = (mat.quantity || 0) * (item.quantity || 0)
        if (totalNeeded > 0) {
          materialConsumption[mat.material_id] = (materialConsumption[mat.material_id] || 0) + totalNeeded
        }
      }
    }
  }

  // Se não há materiais para baixar
  if (Object.keys(materialConsumption).length === 0) return

  // 5. Inserir Movimentações e Atualizar Estoque
  for (const [materialId, quantityToDeduct] of Object.entries(materialConsumption)) {
    // Registra movimento
    await supabase.from('inventory_movements').insert([{
      material_id: materialId,
      movement_type: 'Saída',
      quantity: quantityToDeduct,
      description: orderDescription,
      order_id: orderId
    }])

    // Busca material para pegar estoque atual (solução simples sem RPC)
    const { data: material } = await supabase
      .from('materials')
      .select('current_stock')
      .eq('id', materialId)
      .single()

    if (material) {
      const newStock = (material.current_stock || 0) - quantityToDeduct
      await supabase
        .from('materials')
        .update({ current_stock: newStock })
        .eq('id', materialId)
    }
  }
}

export async function processOrderInventoryRefund(orderId: string) {
  // 1. Verifica se existe saída de estoque para este pedido
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('order_id', orderId)
    .eq('movement_type', 'Saída')

  if (!movements || movements.length === 0) return

  // 2. Verifica se já não houve estorno (Entrada) para este pedido
  const { data: existingRefunds } = await supabase
    .from('inventory_movements')
    .select('id')
    .eq('order_id', orderId)
    .eq('movement_type', 'Entrada')
    .limit(1)

  if (existingRefunds && existingRefunds.length > 0) return

  // 3. Estornar
  for (const mov of movements) {
    // Registra entrada (estorno)
    await supabase.from('inventory_movements').insert([{
      material_id: mov.material_id,
      movement_type: 'Entrada',
      quantity: mov.quantity, // Mesma quantidade devolvida
      description: `Estorno de Pedido Cancelado`,
      order_id: orderId
    }])

    // Devolve pro estoque
    const { data: material } = await supabase
      .from('materials')
      .select('current_stock')
      .eq('id', mov.material_id)
      .single()

    if (material) {
      const newStock = (material.current_stock || 0) + (mov.quantity || 0)
      await supabase
        .from('materials')
        .update({ current_stock: newStock })
        .eq('id', mov.material_id)
    }
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data: oldOrder } = await supabase.from('orders').select('status').eq('id', id).single()

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()

  if (error) throw error

  if (oldOrder && oldOrder.status !== status) {
    await addOrderHistory(id, status, `Status alterado de ${oldOrder.status} para ${status}`);
  }

  // Integração com Estoque
  if (status === 'Aprovado' || status === 'Em Produção' || status === 'Entregue') {
    await processOrderInventoryDeduction(id)
  } else if (status === 'Cancelado') {
    await processOrderInventoryRefund(id)
  }

  return data ? (data[0] as Order) : null
}

// ==========================================
// Módulo de Serviços Terceirizados (Fase 11)
// ==========================================

export type OutsourcedStatus = 'Aguardando envio' | 'Enviado' | 'Em produção parceiro' | 'Recebido' | 'Problema'

export type OutsourcedService = {
  id: string
  order_id: string
  supplier_id?: string | null
  description: string
  cost: number
  sent_date?: string | null
  expected_return_date?: string | null
  status: OutsourcedStatus
  notes?: string | null
  created_at: string
  suppliers?: { name: string } | null
}

export async function getOrderOutsourcedServices(orderId: string) {
  const { data, error } = await supabase
    .from('outsourced_services')
    .select('*, suppliers(name)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as OutsourcedService[]
}

export async function createOutsourcedService(service: Partial<OutsourcedService>) {
  const { data, error } = await supabase
    .from('outsourced_services')
    .insert([service])
    .select()

  if (error) throw error
  return data[0] as OutsourcedService
}

export async function updateOutsourcedService(id: string, service: Partial<OutsourcedService>) {
  const { data, error } = await supabase
    .from('outsourced_services')
    .update(service)
    .eq('id', id)
    .select()

  if (error) throw error

  // Integração com Financeiro: Se marcou como "Recebido", lançar despesa
  if (service.status === 'Recebido') {
    const { data: fullService } = await supabase
      .from('outsourced_services')
      .select('*, orders(order_number)')
      .eq('id', id)
      .single()
      
    if (fullService && fullService.cost > 0) {
      // Verifica se já não existe transação para este serviço
      const descMarker = `[Terceirizado #${id.substring(0,6)}]`
      const { data: existingTx } = await supabase
        .from('financial_transactions')
        .select('id')
        .ilike('description', `%${descMarker}%`)
        .limit(1)

      if (!existingTx || existingTx.length === 0) {
        await createTransaction({
          type: 'Despesa',
          category: 'Materiais / Insumos', // Categoria existente (ou criar 'Serviços Terceirizados')
          description: `Serviço de parceiro: ${fullService.description} (Pedido #${fullService.orders?.order_number || ''}) ${descMarker}`,
          amount: fullService.cost,
          due_date: new Date().toISOString().split('T')[0],
          payment_date: new Date().toISOString().split('T')[0],
          status: 'Pago',
          payment_method: 'PIX',
          order_id: fullService.order_id
        })
      }
    }
  }

  return data[0] as OutsourcedService
}

export async function deleteOutsourcedService(id: string) {
  const { error } = await supabase
    .from('outsourced_services')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export interface OrderHistory {
  id: string
  order_id: string
  status: string
  notes?: string | null
  created_at: string
}

export async function getOrderHistory(orderId: string) {
  const { data, error } = await supabase
    .from('order_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching order history:', error)
    return []
  }
  return data as OrderHistory[]
}

export async function addOrderHistory(orderId: string, status: string, notes?: string) {
  const { error } = await supabase
    .from('order_history')
    .insert([{ order_id: orderId, status, notes }])

  if (error) {
    console.error('Error adding order history:', error)
  }
}
