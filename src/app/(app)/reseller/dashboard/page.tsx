import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Activity } from "lucide-react"
import { getCurrentProfile } from "@/lib/api/profiles"
import { supabase } from "@/lib/supabase"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ResellerDashboard() {
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

  const orderCount = orders?.length || 0
  const totalVolume = orders?.reduce((acc, o) => acc + Number(o.total_amount || 0), 0) || 0
  const openOrders = orders?.filter(o => !['Finalizado', 'Entregue', 'Cancelado'].includes(o.status)) || []

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Painel do Parceiro</h2>
          <p className="text-muted-foreground">
            Acompanhe seus pedidos, faturamento e solicitações em aberto.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
            <Link href="/reseller/quote">Solicitar Novo Orçamento</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volume Comprado</CardTitle>
            <DollarSign className="h-4 w-4 text-[#5C3D8F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5C3D8F]">
               R$ {Number(totalVolume).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total histórico
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pedidos realizados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos em Aberto</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{openOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em produção ou aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-[#5C3D8F] mb-4">Pedidos Recentes</h3>
        <Card>
          <CardContent className="p-0">
            {orders && orders.length > 0 ? (
              <div className="divide-y">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">Pedido #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#5C3D8F]">R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <div className="mt-1 text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700 inline-block">
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Você ainda não realizou nenhum pedido.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
