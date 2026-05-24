import { KanbanBoard } from '@/components/kanban/kanban-board'
import { KanbanSquare } from 'lucide-react'

export const metadata = {
  title: 'Gestão de Produção | Casa Criativa',
  description: 'Acompanhe a fila de produção dos pedidos',
}

export default function ProductionPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gray-50/50 h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F] flex items-center">
            <KanbanSquare className="mr-3 h-8 w-8" /> 
            Fila de Produção (Kanban)
          </h2>
          <p className="text-muted-foreground">
            Arraste e solte os pedidos para atualizar seus status de produção.
          </p>
        </div>
      </div>
      
      <KanbanBoard />
    </div>
  )
}
