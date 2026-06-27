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

// 10. Taxa de Conversão de Orçamentos
export async function getConversionRate() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status')
  
  if (error || !orders) return { rate: 0, total: 0, converted: 0 }

  const total = orders.length
  if (total === 0) return { rate: 0, total: 0, converted: 0 }

  const converted = orders.filter(o => ['Aprovado', 'Em Produção', 'Finalizado', 'Entregue'].includes(o.status)).length
  const rate = (converted / total) * 100

  return { rate: parseFloat(rate.toFixed(2)), total, converted }
}

// 11. Ticket Médio
export async function getAverageTicket() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, status')
    .in('status', ['Aprovado', 'Em Produção', 'Finalizado', 'Entregue'])

  if (error || !orders || orders.length === 0) return 0

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  return totalRevenue / orders.length
}

// 12. Clientes Inativos (Alerta)
export async function getInactiveClients(daysInactive = 60) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, full_name, whatsapp')

  const { data: orders } = await supabase
    .from('orders')
    .select('client_id, created_at')
    .order('created_at', { ascending: false })

  if (error || !clients) return []

  const inactiveList = []
  for (const client of clients) {
    const clientOrders = orders?.filter(o => o.client_id === client.id) || []
    if (clientOrders.length === 0) continue 

    const lastOrderDate = new Date(clientOrders[0].created_at)
    if (lastOrderDate < cutoffDate) {
      inactiveList.push({
        ...client,
        lastOrderDate: lastOrderDate.toISOString(),
        daysInactive: Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24))
      })
    }
  }

  return inactiveList.sort((a, b) => b.daysInactive - a.daysInactive)
}

// 13. Orçamentos sem Resposta (Follow-up)
export async function getPendingFollowUps(daysPending = 3) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysPending)

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, created_at, clients(id, full_name, whatsapp), companies(id, business_name, phone)')
    .eq('status', 'Orçamento')
    .lte('created_at', cutoffDate.toISOString())

  if (error || !orders) return []

  return orders.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    date: o.created_at,
    clientName: (o.clients as any)?.full_name || (o.companies as any)?.business_name || 'Desconhecido',
    phone: (o.clients as any)?.whatsapp || (o.companies as any)?.phone || '',
    daysPending: Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 3600 * 24))
  })).sort((a, b) => b.daysPending - a.daysPending)
}

// 14. Relatório Sazonal (Comparação de Datas Comemorativas)
export async function getSeasonalRevenue(year?: number) {
  const targetYear = year || new Date().getFullYear()

  // Retorna total faturado no mês de Mães(5), Pais(8), Natal(12), etc., no ano solicitado.
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .in('status', ['Aprovado', 'Em Produção', 'Finalizado', 'Entregue'])
    .gte('created_at', `${targetYear}-01-01T00:00:00Z`)
    .lte('created_at', `${targetYear}-12-31T23:59:59Z`)

  if (error || !orders) return []

  const seasonal: Record<number, { name: string, total: number, count: number }> = {
    4: { name: 'Páscoa', total: 0, count: 0 },
    5: { name: 'Mães', total: 0, count: 0 },
    6: { name: 'Namorados', total: 0, count: 0 },
    8: { name: 'Pais', total: 0, count: 0 },
    10: { name: 'Crianças/Professores', total: 0, count: 0 },
    12: { name: 'Natal', total: 0, count: 0 },
  }

  for (const order of orders) {
    const month = new Date(order.created_at).getMonth() + 1
    if (seasonal[month]) {
      seasonal[month].total += (Number(order.total_amount) || 0)
      seasonal[month].count += 1
    }
  }

  return Object.values(seasonal).filter(s => s.count > 0)
}

// Ranking de Revendedores por Volume
export async function getResellerRanking() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('reseller_id, total_amount, resellers(full_name)')
    .not('reseller_id', 'is', null)
    
  if (error || !orders) return []

  const ranking: Record<string, { id: string, name: string, total: number, orderCount: number }> = {}

  for (const order of orders) {
    if (!order.reseller_id) continue
    
    if (!ranking[order.reseller_id]) {
      ranking[order.reseller_id] = {
        id: order.reseller_id,
        name: (order.resellers as any)?.full_name || 'Desconhecido',
        total: 0,
        orderCount: 0
      }
    }
    
    ranking[order.reseller_id].total += Number(order.total_amount || 0)
    ranking[order.reseller_id].orderCount += 1
  }

  return Object.values(ranking).sort((a, b) => b.total - a.total)
}

// Pedidos Entregues mas com Pagamento Pendente ou Parcial
export async function getPendingDeliveredOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, total_amount, amount_paid, status, payment_status, created_at, clients(full_name, whatsapp), companies(business_name, phone), resellers(full_name, phone), final_payment_date')
    .in('payment_status', ['Pendente', 'Pago Parcial'])
    .is('final_payment_date', null)
    .order('created_at', { ascending: false })

  if (error || !orders) return []

  return orders.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    total: o.total_amount,
    paid: o.amount_paid || 0,
    pending: o.total_amount - (o.amount_paid || 0),
    paymentStatus: o.payment_status,
    date: o.created_at,
    clientName: (o.clients as any)?.full_name || (o.companies as any)?.business_name || (o.resellers as any)?.full_name || 'Desconhecido',
    phone: (o.clients as any)?.whatsapp || (o.companies as any)?.phone || (o.resellers as any)?.phone || ''
  }))
}

export async function getUpcomingReturns() {
  const { data, error } = await supabase
    .from('client_interactions')
    .select(`
      *,
      clients(full_name, whatsapp),
      companies(business_name, phone)
    `)
    .eq('interaction_type', 'Retorno Programado')
    .order('interaction_date', { ascending: true })
    .limit(10)

  if (error) return []
  return data
}


