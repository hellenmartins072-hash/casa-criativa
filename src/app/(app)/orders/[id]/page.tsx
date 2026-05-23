'use client'

import { useEffect, useState, use } from 'react'
import { getOrder, type Order } from '@/lib/api/orders'
import { OrderForm } from '@/components/orders/order-form'
import { OutsourcedServicesList } from '@/components/orders/outsourced-services-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        const data = await getOrder(resolvedParams.id)
        setOrder(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-[250px] mb-4" />
        <Skeleton className="h-[600px] w-full max-w-4xl mx-auto" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex-1 p-8 text-center mt-20">
        <h2 className="text-2xl font-bold text-red-600">Pedido não encontrado</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-50/30 min-h-screen">
      <OrderForm initialData={order} />
      <OutsourcedServicesList orderId={order.id} />
    </div>
  )
}
