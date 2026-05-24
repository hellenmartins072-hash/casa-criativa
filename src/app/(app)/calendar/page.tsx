import { DeliveryCalendar } from '@/components/calendar/delivery-calendar'
import { Calendar as CalendarIcon } from 'lucide-react'

export const metadata = {
  title: 'Agenda de Entregas | Casa Criativa',
  description: 'Calendário de produção e entregas',
}

export default function CalendarPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F] flex items-center">
            <CalendarIcon className="mr-3 h-8 w-8" /> 
            Agenda de Entregas
          </h2>
          <p className="text-muted-foreground">
            Acompanhe visualmente os prazos (deadline) e datas de entrega (delivery date) dos pedidos.
          </p>
        </div>
      </div>
      
      <DeliveryCalendar />
    </div>
  )
}
