'use client'

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Order, getOrders, updateOrderStatus } from '@/lib/api/orders'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

const COLUMNS = [
  { id: 'Orçamento', title: 'Orçamentos', color: 'bg-gray-100 border-gray-300' },
  { id: 'Aprovado', title: 'Aprovados (Fila)', color: 'bg-blue-50 border-blue-200' },
  { id: 'Em Produção', title: 'Em Produção', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'Finalizado', title: 'Pronto / Finalizado', color: 'bg-green-50 border-green-200' },
  { id: 'Entregue', title: 'Entregues', color: 'bg-purple-50 border-purple-200' }
]

// --- Componente do Card (Draggable) ---
function SortableOrderCard({ order }: { order: Order }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { type: 'Order', order } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Verifica prazo
  let isLate = false
  let isWarning = false
  if (order.deadline && order.status !== 'Entregue') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(order.deadline)
    deadline.setHours(0, 0, 0, 0)
    
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) isLate = true
    else if (diffDays <= 2) isWarning = true
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative mb-3 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <Card className={`overflow-hidden border-l-4 ${isLate ? 'border-l-red-500 bg-red-50' : isWarning ? 'border-l-orange-400 bg-orange-50' : 'border-l-[#5C3D8F] bg-white'} shadow-sm hover:shadow-md transition-shadow`}>
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-500">#{order.order_number}</span>
            <div className="flex items-center gap-1">
               {isLate && <AlertCircle className="w-4 h-4 text-red-500" />}
               {isWarning && <AlertCircle className="w-4 h-4 text-orange-400" />}
            </div>
          </div>
          <p className="font-semibold text-sm leading-tight text-gray-800 line-clamp-2 mb-2">
            {order.clients?.full_name || order.companies?.business_name || 'Cliente'}
          </p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100/50">
            <Badge variant="outline" className="text-[10px] px-1 py-0 bg-white">
               R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Badge>
            {order.deadline && (
              <span className={`text-[10px] flex items-center ${isLate ? 'text-red-600 font-bold' : isWarning ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(order.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Componente da Coluna (Droppable) ---
function KanbanColumn({ column, orders }: { column: typeof COLUMNS[0], orders: Order[] }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'Column', column },
  })

  return (
    <div className={`flex flex-col flex-shrink-0 w-80 rounded-lg border ${column.color}`}>
      <div className="p-3 border-b border-gray-200/50 bg-white/50 rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold text-gray-700">{column.title}</h3>
        <Badge variant="secondary" className="bg-white">{orders.length}</Badge>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-2 min-h-[500px] overflow-y-auto">
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <SortableOrderCard key={order.id} order={order} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOrders()
        // Filtra Cancelados para não poluir o Kanban
        setOrders(data.filter(o => o.status !== 'Cancelado'))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const id = active.id as string
    const order = orders.find(o => o.id === id)
    if (order) setActiveOrder(order)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Encontra o pedido sendo movido
    const activeOrder = orders.find(o => o.id === activeId)
    if (!activeOrder) return

    const isActiveAOrder = active.data.current?.type === 'Order'
    const isOverAColumn = over.data.current?.type === 'Column'
    const isOverAOrder = over.data.current?.type === 'Order'

    if (!isActiveAOrder) return

    // Dropping a Order over another Order
    if (isActiveAOrder && isOverAOrder) {
      const overOrder = orders.find(o => o.id === overId)
      if (activeOrder.status !== overOrder?.status) {
        setOrders((prev) => {
          const activeIndex = prev.findIndex(t => t.id === activeId)
          const overIndex = prev.findIndex(t => t.id === overId)
          
          let newOrders = [...prev]
          newOrders[activeIndex].status = overOrder!.status
          return arrayMove(newOrders, activeIndex, overIndex)
        })
      }
    }

    // Dropping a Order over a Column
    if (isActiveAOrder && isOverAColumn) {
      if (activeOrder.status !== overId) {
        setOrders((prev) => {
          const activeIndex = prev.findIndex(t => t.id === activeId)
          let newOrders = [...prev]
          newOrders[activeIndex].status = overId
          return arrayMove(newOrders, activeIndex, activeIndex)
        })
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOrder(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const activeOrder = orders.find(o => o.id === activeId)
    
    // Check if status actually changed in DB compared to the current UI state
    // Actually we updated state in handleDragOver, so we just persist it.
    if (activeOrder) {
       try {
         await updateOrderStatus(activeOrder.id, activeOrder.status)
       } catch (err) {
         console.error('Failed to update status', err)
         alert('Erro ao atualizar o status no banco.')
       }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-8 w-8 animate-spin text-[#5C3D8F]" /></div>
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-160px)]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(col => (
          <KanbanColumn 
            key={col.id} 
            column={col} 
            orders={orders.filter(o => o.status === col.id)} 
          />
        ))}

        <DragOverlay>
          {activeOrder ? <SortableOrderCard order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
