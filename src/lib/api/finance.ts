import { supabase } from '../supabase'

export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago' | 'Cancelado'

export type BankAccount = {
  id: string
  name: string
  type: 'PF' | 'PJ'
  balance: number
  created_at: string
}

export type FinancialTransaction = {
  id: string
  type: TransactionType
  category: string | null
  description: string
  amount: number
  due_date: string | null
  payment_date: string | null
  status: TransactionStatus
  payment_method: string | null
  bank_account_id: string | null
  order_id: string | null
  supplier_id: string | null
  notes: string | null
  created_at: string
  is_recurring?: boolean
  current_installment?: number
  total_installments?: number
  recurrence_period?: string
  bank_transaction_id?: string | null
  store_id?: string | null
  client_id?: string | null
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select(`
      *,
      orders(order_number),
      suppliers(name),
      bank_accounts(name)
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
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  // Receita Total (Soma de todos os pedidos não cancelados do mês atual)
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('total_amount, status')
    .neq('status', 'Cancelado')
    .gte('created_at', firstDay)
    .lte('created_at', lastDay)
    
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

  // Lucro/Despesas do Mês Atual
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('type, amount, status, payment_date')
    .eq('status', 'Pago')
    .gte('payment_date', firstDay)
    .lte('payment_date', lastDay)
    
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

// --- Bank Accounts CRUD ---

export async function getBankAccounts() {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching bank accounts:', error)
    return []
  }
  return data as BankAccount[]
}

export async function createBankAccount(account: Partial<BankAccount>) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert([account])
    .select()

  if (error) {
    console.error('Error creating bank account:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateBankAccount(id: string, account: Partial<BankAccount>) {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(account)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating bank account:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteBankAccount(id: string) {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting bank account:', error)
    throw error
  }
  return true
}

// --- Commissions CRUD ---

export type Commission = {
  id: string
  company_id: string
  order_id: string
  amount: number
  status: 'Pendente' | 'Pago'
  created_at: string
  paid_at: string | null
}

export async function getCommissions() {
  const { data, error } = await supabase
    .from('commissions')
    .select(`
      *,
      companies(business_name),
      orders(order_number, total_amount)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching commissions:', error)
    return []
  }
  return data
}

export async function updateCommissionStatus(id: string, status: 'Pendente' | 'Pago') {
  const { data, error } = await supabase
    .from('commissions')
    .update({ status, paid_at: status === 'Pago' ? new Date().toISOString() : null })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating commission:', error)
    throw error
  }
  return data ? data[0] : null
}

// --- Bank Statement Import ---

export async function getProcessedBankTransactionIds(ids: string[]) {
  if (!ids || ids.length === 0) return []

  // Pegar transações já importadas no financeiro
  const { data: finData, error: finError } = await supabase
    .from('financial_transactions')
    .select('bank_transaction_id')
    .in('bank_transaction_id', ids)

  // Pegar transações ignoradas
  const { data: ignData, error: ignError } = await supabase
    .from('ignored_bank_transactions')
    .select('bank_transaction_id')
    .in('bank_transaction_id', ids)

  const processedIds = new Set<string>()
  if (finData) finData.forEach(t => { if (t.bank_transaction_id) processedIds.add(t.bank_transaction_id) })
  if (ignData) ignData.forEach(t => processedIds.add(t.bank_transaction_id))

  return Array.from(processedIds)
}

export async function ignoreBankTransactions(ids: string[]) {
  if (!ids || ids.length === 0) return

  const payload = ids.map(id => ({ bank_transaction_id: id }))
  
  const { error } = await supabase
    .from('ignored_bank_transactions')
    .insert(payload)

  if (error) {
    console.error('Error ignoring bank transactions:', error)
    throw error
  }
}

export async function saveReconciledTransactions(transactions: Partial<FinancialTransaction>[]) {
  if (!transactions || transactions.length === 0) return []

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(transactions)
    .select()

  if (error) {
    console.error('Error saving reconciled transactions:', error)
    throw error
  }
  
  return data
}
