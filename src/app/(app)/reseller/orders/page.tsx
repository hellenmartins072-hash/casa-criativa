import { redirect } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentProfile } from "@/lib/api/profiles"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { FileText, Eye } from 'lucide-react'

export default async function ResellerOrders() {
  const profile = await getCurrentProfile()
  
  if (!profile || profile.role !== 'reseller') {
    redirect('/')
  }

  // Fetch reseller's orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .or(`company_id.eq.${profile.company_id},client_id.eq.${profile.client_id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Meus Pedidos</h2>
          <p className="text-muted-foreground">
            Acompanhe o status de todas as suas solicitações.
          </p>
        </div>
        <Button asChild className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
          <Link href="/reseller/quote">Novo Pedido</Link>
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Pedido / Data</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Previsão</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">#{order.order_number}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      order.status === 'Entregue' ? 'default' :
                      order.status === 'Orçamento' ? 'secondary' :
                      order.status === 'Cancelado' ? 'destructive' :
                      'outline'
                    } className={
                      order.status === 'Entregue' ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                    }>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : 'Não definida'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#5C3D8F]">
                    R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button variant="ghost" size="icon" asChild title="Ver Detalhes">
                       <Link href={`/orders/${order.id}/pdf`} target="_blank">
                         <FileText className="h-4 w-4 text-gray-500 hover:text-[#5C3D8F]" />
                       </Link>
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
