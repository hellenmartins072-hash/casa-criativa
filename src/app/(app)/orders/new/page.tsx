import { OrderForm } from '@/components/orders/order-form'

export default function NewOrderPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-50/30 min-h-screen">
      <OrderForm />
    </div>
  )
}
