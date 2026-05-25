'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format } from 'date-fns'
import { parse } from 'date-fns'
import { startOfWeek } from 'date-fns'
import { getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Order, getOrders } from '@/lib/api/orders'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import './calendar-overrides.css' // We will create this for Tailwind styling fixes

const locales = {
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export function DeliveryCalendar() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getOrders()
        // Filtrar pedidos que possuem delivery_date ou deadline
        setOrders(data.filter(o => o.delivery_date || o.deadline))
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-8 w-8 animate-spin text-[#5C3D8F]" /></div>
  }

  // Transformar Orders em Events do Calendar
  const events = orders.map(order => {
    // Dá prioridade para a data de entrega combinada real (delivery_date) ou o prazo (deadline)
    const targetDateStr = order.delivery_date || order.deadline
    const dateObj = new Date(targetDateStr!)
    // Compensa UTC se necessário
    dateObj.setHours(12, 0, 0, 0)

    let title = `#${order.order_number} - ${order.clients?.full_name || order.companies?.business_name || 'Cliente'}`

    let color = '#3b82f6' // Azul padrão (Em Produção/Aprovado)
    if (order.status === 'Entregue') color = '#a855f7' // Roxo
    if (order.status === 'Finalizado') color = '#22c55e' // Verde
    if (order.status === 'Orçamento') color = '#94a3b8' // Cinza
    if (order.status === 'Cancelado') color = '#ef4444' // Vermelho

    return {
      id: order.id,
      title,
      start: dateObj,
      end: dateObj, // Evento de dia inteiro
      allDay: true,
      resource: order,
      color
    }
  })

  const eventStyleGetter = (event: any) => {
    const style = {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '0.75rem',
      padding: '2px 4px'
    }
    return { style }
  }

  return (
    <div className="h-[calc(100vh-180px)] bg-white p-4 rounded-lg shadow-sm border">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        culture="pt-BR"
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Pedido",
          noEventsInRange: "Nenhuma entrega para este período."
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => router.push(`/orders/${event.id}`)}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
      />
    </div>
  )
}
