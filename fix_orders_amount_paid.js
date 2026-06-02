const fs = require('fs');

// Update orders.ts
let ordersContent = fs.readFileSync('src/lib/api/orders.ts', 'utf8');

// 1. Add amount_paid to Order interface
if (!ordersContent.includes('amount_paid?: number')) {
  ordersContent = ordersContent.replace('total_amount?: number', 'total_amount?: number\n  amount_paid?: number');
}

// 2. Add History types and function
if (!ordersContent.includes('OrderHistory')) {
  const historyCode = `
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
`;
  ordersContent += historyCode;
}

// 3. Inject history logging in createOrder and updateOrder
let targetCreate = `  if (error || !data) {
    console.error('Error creating order:', error)
    throw error
  }`;
let replCreate = `  if (error || !data) {
    console.error('Error creating order:', error)
    throw error
  }
  // Log history
  await supabase.from('order_history').insert([{ order_id: data[0].id, status: order.status || 'Orçamento', notes: 'Pedido criado' }])`;
ordersContent = ordersContent.replace(targetCreate, replCreate);

let targetUpdate = `  if (error || !data) {
    console.error('Error updating order:', error)
    throw error
  }`;
let replUpdate = `  if (error || !data) {
    console.error('Error updating order:', error)
    throw error
  }
  // Log history
  await supabase.from('order_history').insert([{ order_id: id, status: order.status || 'Atualizado', notes: 'Pedido atualizado' }])`;
ordersContent = ordersContent.replace(targetUpdate, replUpdate);

fs.writeFileSync('src/lib/api/orders.ts', ordersContent, 'utf8');
console.log('done updating orders.ts');
