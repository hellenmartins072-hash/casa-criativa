import { supabase } from '../supabase'

export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago' | 'Cancelado'

export type FinancialTransaction = {
  id: string
  type: TransactionType
  category: string | null
  description: string
  amount: number
  due_date: string
  payment_date: string | null
  status: TransactionStatus
  payment_method: string | null
  order_id: string | null
  supplier_id: string | null
  notes: string | null
  created_at: string
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select(`
      *,
      orders(order_number),
      suppliers(name)
    `)
    .order('due_date', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
  return data
}

export async function createTransaction(transaction: Partial<FinancialTransaction>) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert([transaction])
    .select()

  if (error) {
    console.error('Error creating transaction:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateTransaction(id: string, transaction: Partial<FinancialTransaction>) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .update(transaction)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating transaction:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting transaction:', error)
    throw error
  }
  return true
}

export async function getDashboardMetrics() {
  // Receita Total (Soma de todos os pedidos não cancelados)
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('total_amount, status')
    .neq('status', 'Cancelado')
    
  let totalRevenue = 0
  let orderCount = 0
  if (orders && !ordersErr) {
    totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0)
    orderCount = orders.length
  }

  // Clientes Ativos
  const { count: clientsCount, error: cliErr } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'Despedido')

  // Lojas / Perfis (Contagem na tabela stores, se existir. Como desativamos, vamos contar Companies por enquanto)
  const { count: storesCount, error: storesErr } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  // Pedidos Recentes
  const { data: recentOrders, error: recErr } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, status, created_at, clients(full_name), companies(business_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Lucro/Despesas (Opcional, pegando do financeiro)
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('type, amount, status')
    .eq('status', 'Pago')
    
  let totalExpenses = 0
  let totalPaidRevenue = 0
  if (transactions) {
    transactions.forEach(t => {
      if (t.type === 'Despesa') totalExpenses += Number(t.amount)
      if (t.type === 'Receita') totalPaidRevenue += Number(t.amount)
    })
  }

  return {
    totalRevenue,
    orderCount,
    clientsCount: clientsCount || 0,
    storesCount: storesCount || 0,
    recentOrders: recentOrders || [],
    totalExpenses,
    totalPaidRevenue
  }
}
