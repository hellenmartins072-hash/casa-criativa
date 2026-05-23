import { supabase } from '../supabase'

// 1. Ranking de Clientes por Valor Total de Compras
export async function getClientRankingByValue() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('client_id, total_amount, clients(full_name, client_type)')
    .eq('status', 'Aprovado') // Considerar Em Produção / Entregue também? Vamos focar em Aprovado para simplificar, ou não filtrar

  if (error || !orders) return []

  const ranking: Record<string, { id: string, name: string, type: string, total: number, orderCount: number }> = {}

  for (const order of orders) {
    if (!order.client_id) continue
    
    if (!ranking[order.client_id]) {
      ranking[order.client_id] = {
        id: order.client_id,
        name: (order.clients as any)?.full_name || 'Desconhecido',
        type: (order.clients as any)?.client_type || 'Varejo',
        total: 0,
        orderCount: 0
      }
    }
    
    ranking[order.client_id].total += (order.total_amount || 0)
    ranking[order.client_id].orderCount += 1
  }

  return Object.values(ranking)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10) // Top 10
}

// 2. Ranking de Parceiros B2B por Volume de Pedidos
export async function getB2BPartnerRanking() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('company_id, total_amount, companies(business_name)')
    
  if (error || !orders) return []

  const ranking: Record<string, { id: string, name: string, total: number, orderCount: number }> = {}

  for (const order of orders) {
    if (!order.company_id) continue
    
    if (!ranking[order.company_id]) {
      ranking[order.company_id] = {
        id: order.company_id,
        name: (order.companies as any)?.business_name || 'Desconhecido',
        total: 0,
        orderCount: 0
      }
    }
    
    ranking[order.company_id].total += (order.total_amount || 0)
    ranking[order.company_id].orderCount += 1
  }

  return Object.values(ranking)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10)
}

// 3. Clientes com Pedidos Recorrentes (Últimos 3 meses)
export async function getRecurringClients() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: orders, error } = await supabase
    .from('orders')
    .select('client_id, created_at, clients(full_name)')
    .gte('created_at', threeMonthsAgo.toISOString())

  if (error || !orders) return []

  const activity: Record<string, { id: string, name: string, monthsActive: Set<number> }> = {}

  for (const order of orders) {
    if (!order.client_id) continue
    
    const month = new Date(order.created_at).getMonth()
    
    if (!activity[order.client_id]) {
      activity[order.client_id] = {
        id: order.client_id,
        name: (order.clients as any)?.full_name || 'Desconhecido',
        monthsActive: new Set()
      }
    }
    
    activity[order.client_id].monthsActive.add(month)
  }

  return Object.values(activity)
    .filter(client => client.monthsActive.size >= 2) // Pelo menos 2 meses distintos nos últimos 3
    .map(client => ({
      id: client.id,
      name: client.name,
      consecutiveMonths: client.monthsActive.size
    }))
    .sort((a, b) => b.consecutiveMonths - a.consecutiveMonths)
}

// 4. Clientes com Aniversário no Mês Atual
export async function getBirthdayClients() {
  const currentMonth = new Date().getMonth() + 1 // 1 a 12
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, full_name, birth_date, children_birthdays')

  if (error || !clients) return []

  const birthdayClients = []

  for (const client of clients) {
    let isBirthday = false
    let reasons = []

    // Próprio aniversário
    if (client.birth_date) {
      const bMonth = parseInt(client.birth_date.split('-')[1], 10)
      if (bMonth === currentMonth) {
        isBirthday = true
        reasons.push('Aniversário Próprio')
      }
    }

    // Aniversário dos filhos
    if (client.children_birthdays && Array.isArray(client.children_birthdays)) {
      for (const child of client.children_birthdays as any[]) {
        if (child.date) {
          const cMonth = parseInt(child.date.split('-')[1], 10)
          if (cMonth === currentMonth) {
            isBirthday = true
            reasons.push(`Filho(a): ${child.name}`)
          }
        }
      }
    }

    if (isBirthday) {
      birthdayClients.push({
        id: client.id,
        name: client.full_name,
        reasons: reasons.join(', ')
      })
    }
  }

  return birthdayClients
}

// 5. Radar de VIPs (Pedidos Sazonais)
// Identifica clientes que compraram nos meses 5, 8, 12, ou 4.
export async function getVIPSeasonalClients() {
  const seasonalMonths = [4, 5, 8, 12] // Mães, Pais, Natal, Páscoa
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('client_id, created_at, clients(full_name, is_vip)')

  if (error || !orders) return []

  const stats: Record<string, { id: string, name: string, is_vip: boolean, seasonalOrders: number }> = {}

  for (const order of orders) {
    if (!order.client_id) continue
    
    const month = new Date(order.created_at).getMonth() + 1
    
    if (seasonalMonths.includes(month)) {
      if (!stats[order.client_id]) {
        stats[order.client_id] = {
          id: order.client_id,
          name: (order.clients as any)?.full_name || 'Desconhecido',
          is_vip: (order.clients as any)?.is_vip || false,
          seasonalOrders: 0
        }
      }
      stats[order.client_id].seasonalOrders += 1
    }
  }

  return Object.values(stats)
    .filter(client => client.seasonalOrders >= 2) // Pelo menos 2 compras sazonais no histórico
    .sort((a, b) => b.seasonalOrders - a.seasonalOrders)
    .slice(0, 10)
}

// 6. Resumo Financeiro do Mês Atual (Receitas Pagas, Despesas Pagas, Lucro)
export async function getMonthlyFinancialSummary() {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

  const { data: txs } = await supabase
    .from('financial_transactions')
    .select('amount, type')
    .eq('status', 'Pago')
    .gte('payment_date', firstDay)
    .lte('payment_date', lastDay);

  let revenues = 0;
  let expenses = 0;

  if (txs) {
    txs.forEach(tx => {
      if (tx.type === 'Receita') revenues += (Number(tx.amount) || 0);
      else if (tx.type === 'Despesa') expenses += (Number(tx.amount) || 0);
    });
  }

  return { revenues, expenses, profit: revenues - expenses };
}

// 7. A Receber vs A Pagar (Geral)
export async function getPendingFinancials() {
  const { data: receivables } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('type', 'Receita')
    .eq('status', 'Pendente');

  const { data: payables } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('type', 'Despesa')
    .eq('status', 'Pendente');

  const totalReceivable = (receivables || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalPayable = (payables || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  return { receivable: totalReceivable, payable: totalPayable };
}

// 8. Produtos Mais Vendidos
export async function getTopSellingProducts() {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_name, quantity')

  if (error || !items) return []

  const ranking: Record<string, number> = {}

  for (const item of items) {
    const name = item.product_name || 'Avulso/Diversos'
    ranking[name] = (ranking[name] || 0) + (item.quantity || 1)
  }

  return Object.entries(ranking)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
}

// 9. Produtos Mais Lucrativos
export async function getMostProfitableProducts() {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_name, unit_price, quantity, product_id')

  if (error || !items) return []

  const ranking: Record<string, { name: string, totalProfit: number }> = {}

  for (const item of items) {
    if (!item.product_id) continue 

    const name = item.product_name || 'Desconhecido'
    const price = item.unit_price || 0
    const estimatedCost = price * 0.4 
    const profitPerUnit = price - estimatedCost
    const totalProfit = profitPerUnit * (item.quantity || 1)

    if (!ranking[name]) {
      ranking[name] = { name, totalProfit: 0 }
    }
    ranking[name].totalProfit += totalProfit
  }

  return Object.values(ranking)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, 5)
}
