import { supabase } from '../supabase'

export type AlertType = 'birthday' | 'deadline' | 'quote_pending' | 'low_stock' | 'system'

export type Alert = {
  id: string
  type: AlertType
  title: string
  message: string
  actionUrl?: string
  date: string
  urgent?: boolean
}

export async function getDashboardAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = []
  
  // 1. Alertas de Estoque Baixo
  try {
    const { data: materials } = await supabase
      .from('materials')
      .select('id, name, current_stock, minimum_stock')
      .not('minimum_stock', 'is', null)

    if (materials) {
      for (const mat of materials) {
        if (mat.current_stock !== null && mat.minimum_stock !== null && mat.current_stock <= mat.minimum_stock) {
          alerts.push({
            id: `stock-${mat.id}`,
            type: 'low_stock',
            title: 'Estoque Mínimo Atingido',
            message: `O material "${mat.name}" atingiu o estoque mínimo (${mat.current_stock}).`,
            actionUrl: '/materials',
            date: new Date().toISOString(),
            urgent: mat.current_stock === 0
          })
        }
      }
    }
  } catch (err) {
    console.error('Error fetching stock alerts', err)
  }

  // 2. Alertas de Prazos (Entregas hoje ou atrasadas)
  try {
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)

    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, deadline, clients(full_name)')
      .in('status', ['Aprovado', 'Em Produção', 'Pronto para entrega'])
      .not('deadline', 'is', null)

    if (orders) {
      for (const order of orders) {
        if (!order.deadline) continue
        
        const deadlineDate = new Date(order.deadline)
        // Adjust timezone issue
        deadlineDate.setMinutes(deadlineDate.getMinutes() + deadlineDate.getTimezoneOffset())

        const timeDiff = deadlineDate.getTime() - today.getTime()
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

        if (daysDiff < 0) {
          alerts.push({
            id: `deadline-late-${order.id}`,
            type: 'deadline',
            title: 'Pedido Atrasado!',
            message: `O pedido #${order.order_number} de ${(order.clients as any)?.full_name} deveria ter sido entregue.`,
            actionUrl: `/orders/${order.id}`,
            date: new Date().toISOString(),
            urgent: true
          })
        } else if (daysDiff <= 2) {
           alerts.push({
            id: `deadline-soon-${order.id}`,
            type: 'deadline',
            title: daysDiff === 0 ? 'Entrega Hoje!' : `Entrega em ${daysDiff} dia(s)`,
            message: `O pedido #${order.order_number} de ${(order.clients as any)?.full_name} vence em breve.`,
            actionUrl: `/orders/${order.id}`,
            date: new Date().toISOString(),
            urgent: daysDiff === 0
          })
        }
      }
    }
  } catch (err) {
    console.error('Error fetching deadline alerts', err)
  }

  // 3. Orçamentos sem resposta (Mais de 3 dias)
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: quotes } = await supabase
      .from('orders')
      .select('id, order_number, created_at, clients(full_name)')
      .eq('status', 'Orçamento')
      .lte('created_at', threeDaysAgo.toISOString())

    if (quotes) {
      for (const quote of quotes) {
        alerts.push({
          id: `quote-${quote.id}`,
          type: 'quote_pending',
          title: 'Orçamento sem Resposta',
          message: `O orçamento #${quote.order_number} de ${(quote.clients as any)?.full_name} está parado há mais de 3 dias.`,
          actionUrl: `/orders/${quote.id}`,
          date: quote.created_at,
          urgent: false
        })
      }
    }
  } catch (err) {
    console.error('Error fetching quote alerts', err)
  }

  // 4. Aniversariantes (Próximos 3 dias)
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, full_name, birth_date, children_birthdays')

    if (clients) {
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      const currentDay = today.getDate()

      for (const client of clients) {
        // Checa aniversário próprio
        if (client.birth_date) {
          const [y, m, d] = client.birth_date.split('-')
          const month = parseInt(m, 10)
          const day = parseInt(d, 10)

          if (month === currentMonth) {
            const diff = day - currentDay
            if (diff >= 0 && diff <= 3) {
              alerts.push({
                id: `bday-${client.id}`,
                type: 'birthday',
                title: diff === 0 ? 'Aniversário Hoje!' : `Aniversário em ${diff} dia(s)`,
                message: `${client.full_name} está fazendo aniversário ${diff === 0 ? 'hoje' : 'em breve'}!`,
                actionUrl: `/clients/${client.id}`,
                date: new Date().toISOString(),
                urgent: false
              })
            }
          }
        }

        // Checa filhos
        if (client.children_birthdays && Array.isArray(client.children_birthdays)) {
          for (const child of client.children_birthdays as any[]) {
            if (child.date) {
              const [y, m, d] = child.date.split('-')
              const month = parseInt(m, 10)
              const day = parseInt(d, 10)

              if (month === currentMonth) {
                const diff = day - currentDay
                if (diff >= 0 && diff <= 3) {
                   alerts.push({
                    id: `bday-child-${client.id}-${child.name}`,
                    type: 'birthday',
                    title: `Aniversário: Filho(a) de ${client.full_name}`,
                    message: `${child.name} fará aniversário ${diff === 0 ? 'hoje' : `em ${diff} dia(s)`}!`,
                    actionUrl: `/clients/${client.id}`,
                    date: new Date().toISOString(),
                    urgent: false
                  })
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching birthday alerts', err)
  }

  // Sort: Urgent first
  return alerts.sort((a, b) => {
    if (a.urgent && !b.urgent) return -1
    if (!a.urgent && b.urgent) return 1
    return 0
  })
}
