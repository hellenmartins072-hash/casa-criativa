import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { DollarSign, ShoppingCart, Activity, FileText } from "lucide-react"

export default async function ResellerDetails({ params }: { params: { id: string } }) {
  // 1. Get Reseller Details
  const { data: reseller } = await supabase
    .from('resellers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!reseller) return notFound()

  // 2. Get User Profile to find mapped clients/companies (if any)
  // For admin view, we want to see orders linked to this reseller's user account.
  // Wait, orders are linked to client_id or company_id. Let's find which client_id is associated.
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('reseller_id', reseller.id)
    .single()

  let orders: any[] = []
  if (profile) {
    const query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (profile.client_id) query.eq('client_id', profile.client_id)
    else if (profile.company_id) query.eq('company_id', profile.company_id)
    
    const { data } = await query
    if (data) orders = data
  }

  const orderCount = orders.length
  const totalVolume = orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0)
  const openOrders = orders.filter(o => !['Finalizado', 'Entregue', 'Cancelado'].includes(o.status))

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">{reseller.full_name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={reseller.status === 'Ativo' ? 'default' : 'secondary'}>{reseller.status}</Badge>
            <span className="text-sm text-muted-foreground">Comissão / Desconto: {Number(reseller.discount_percentage)}%</span>
            <span className="text-sm text-muted-foreground border-l pl-2 ml-2">Contato: {reseller.whatsapp || reseller.phone}</span>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/resellers">Voltar para Lista</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-[#5C3D8F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5C3D8F]">
               R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Realizados</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos em Aberto</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Histórico de Pedidos */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
            <CardDescription>Todos os pedidos gerados por este parceiro.</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium">Pedido #{order.order_number}</div>
                      <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <div className="font-bold text-[#5C3D8F]">
                      R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/orders/${order.id}`}><FileText className="h-4 w-4 text-gray-500" /></Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum pedido encontrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Dados Cadastrais */}
        <Card>
          <CardHeader>
            <CardTitle>Ficha do Parceiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs font-bold uppercase">Documento</span>
              <span>{reseller.document_number || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-bold uppercase">Endereço</span>
              <span>{reseller.address || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-bold uppercase">Redes Sociais</span>
              <span>{reseller.social_media || '-'}</span>
            </div>
            <div className="pt-4 border-t">
              <span className="text-muted-foreground block text-xs font-bold uppercase mb-1">Dados Bancários para Repasse</span>
              <p className="whitespace-pre-wrap bg-gray-50 p-2 rounded border text-xs">{reseller.bank_details || 'Não informado.'}</p>
            </div>
            <div className="pt-4 border-t">
              <span className="text-muted-foreground block text-xs font-bold uppercase mb-1">Observações Internas</span>
              <p className="whitespace-pre-wrap text-xs">{reseller.notes || 'Sem observações.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
