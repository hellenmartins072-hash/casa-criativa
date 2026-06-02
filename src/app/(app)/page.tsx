'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight, Award, Gift, Star, Repeat, Building, Target, AlertCircle, Clock } from "lucide-react"
import { getDashboardMetrics } from "@/lib/api/finance"
import { getSettings } from "@/lib/api/settings"
import { 
  getClientRankingByValue, 
  getB2BPartnerRanking, 
  getRecurringClients, 
  getBirthdayClients, 
  getVIPSeasonalClients,
  getInactiveClients,
  getPendingFollowUps,
  getResellerRanking,
  getPendingDeliveredOrders
} from "@/lib/api/analytics"
import { getCurrentProfile } from "@/lib/api/profiles"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>({
    clientRanking: [],
    b2bRanking: [],
    resellerRanking: [],
    recurring: [],
    birthdays: [],
    vips: [],
    inactive: [],
    followups: [],
    pendingDelivered: []
  })
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const [
          data, 
          clientRanking, 
          b2bRanking, 
          recurring, 
          birthdays, 
          vips,
          settingsData,
          inactive,
          resellerRankingData,
          followups,
          profile,
          pendingDelivered
        ] = await Promise.all([
          getDashboardMetrics(),
          getClientRankingByValue(),
          getB2BPartnerRanking(),
          getRecurringClients(),
          getBirthdayClients(),
          getVIPSeasonalClients(),
          getSettings(),
          getInactiveClients(60),
          getResellerRanking(),
          getPendingFollowUps(3),
          getCurrentProfile(),
          getPendingDeliveredOrders()
        ])
        
        if (profile?.role === 'reseller') {
          router.push('/reseller/dashboard')
          return
        }
        
        setMetrics(data)
        setAnalytics({ clientRanking, b2bRanking, resellerRanking: resellerRankingData, recurring, birthdays, vips, inactive, followups, pendingDelivered })
        setSettings(settingsData)
      } catch (error) {
        console.error('Failed to load metrics', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full mt-4" />
      </div>
    )
  }

  const { totalRevenue, orderCount, recentOrders, totalPaidRevenue, totalExpenses } = metrics || {}
  const realProfit = (totalPaidRevenue || 0) - (totalExpenses || 0)

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Visão Geral</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da Casa Criativa e inteligência de clientes.
          </p>
        </div>
      </div>

      {/* Meta Mensal Progress Bar */}
      {settings?.monthly_revenue_goal > 0 && (
        <Card className="shadow-sm border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
          <CardContent className="pt-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center text-blue-800">
                <Target className="h-5 w-5 mr-2" />
                <h3 className="font-semibold">Meta do Mês</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-900">
                  R$ {Number(totalPaidRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-blue-600 ml-1">
                  / R$ {Number(settings.monthly_revenue_goal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(((totalPaidRevenue || 0) / settings.monthly_revenue_goal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-2 text-right">
              {Math.min(((totalPaidRevenue || 0) / settings.monthly_revenue_goal) * 100, 100).toFixed(1)}% concluído
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Receita Real */}
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Caixa (Paga)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              R$ {Number(totalPaidRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dinheiro que já entrou
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Valor Total Vendido */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volume de Vendas</CardTitle>
            <Activity className="h-4 w-4 text-[#5C3D8F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5C3D8F]">
               R$ {Number(totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inclui pedidos não pagos
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Pedidos */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Orçamentos e Vendas
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Lucro Real */}
        <Card className="border-l-4 border-l-[#5C3D8F] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            {realProfit >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${realProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              R$ {Number(realProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas brutas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* ALERTA DE AÇÕES DIÁRIAS (CRM Ativo) */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-[#5C3D8F] mb-4">Ações Diárias (CRM Ativo)</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-2 bg-orange-50/50">
              <CardTitle className="flex items-center text-orange-700 text-base">
                <Clock className="h-5 w-5 mr-2" /> Follow-up Pendente
              </CardTitle>
              <CardDescription>Orçamentos sem resposta (&gt;{settings?.followup_days || 3} dias)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
              <div className="space-y-3">
                {analytics.followups?.length > 0 ? analytics.followups.map((f: any) => (
                  <div key={f.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-semibold">{f.clientName}</span>
                      <p className="text-xs text-muted-foreground">Pedido #{f.orderNumber}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">Há {f.daysPending} dias</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center">Nenhum orçamento pendente.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="pb-2 bg-red-50/50">
              <CardTitle className="flex items-center text-red-700 text-base">
                <AlertCircle className="h-5 w-5 mr-2" /> Clientes Inativos
              </CardTitle>
              <CardDescription>Sem compras há mais de {settings?.inactive_client_days || 60} dias</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
              <div className="space-y-3">
                {analytics.inactive?.length > 0 ? analytics.inactive.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-semibold">{c.full_name}</span>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-200">+{c.daysInactive} dias</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center">Nenhum cliente inativo.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-700">
            <CardHeader className="pb-2 bg-red-50/50">
              <CardTitle className="flex items-center text-red-800 text-base">
                <AlertCircle className="h-5 w-5 mr-2" /> Inadimplência
              </CardTitle>
              <CardDescription>Pedidos com pagamento pendente</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
              <div className="space-y-3">
                {analytics.pendingDelivered?.length > 0 ? analytics.pendingDelivered.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-semibold text-red-900">{p.clientName}</span>
                      <p className="text-xs text-muted-foreground">Pedido #{p.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-700">R$ {p.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 border-red-200 text-red-600 bg-red-50">{p.paymentStatus}</Badge>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center">Nenhuma inadimplência.</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      {/* SEÇÃO ANALÍTICA E CRM */}
      <h3 className="text-xl font-bold text-[#5C3D8F] mt-8 pt-4 border-t">Estatísticas de Vendas</h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Ranking de Clientes (Varejo) */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-transparent">
            <CardTitle className="flex items-center text-[#5C3D8F] text-lg">
              <Award className="h-5 w-5 mr-2" /> Top Compradores
            </CardTitle>
            <CardDescription>Ranking por volume financeiro (Aprovados)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="space-y-4">
              {analytics.clientRanking.length > 0 ? analytics.clientRanking.map((client: any, idx: number) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#5C3D8F]/10 text-[#5C3D8F] flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.orderCount} pedido(s)</p>
                    </div>
                  </div>
                  <div className="font-semibold text-sm">
                    R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sem dados suficientes.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Radar de Recorrentes e VIPs */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-50 to-transparent">
            <CardTitle className="flex items-center text-yellow-600 text-lg">
              <Star className="h-5 w-5 mr-2 fill-yellow-600" /> Radar VIP & Recorrentes
            </CardTitle>
            <CardDescription>Clientes fidelizados e frequentes</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="space-y-4">
              <div className="mb-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center mb-3">
                  <Repeat className="h-3 w-3 mr-1" /> Frequência Mensal (Ativos)
                </h4>
                {analytics.recurring.length > 0 ? analytics.recurring.slice(0, 3).map((client: any) => (
                  <div key={client.id} className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{client.name}</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {client.consecutiveMonths} meses
                    </Badge>
                  </div>
                )) : <p className="text-xs text-muted-foreground mb-4">Nenhum cliente com compras consecutivas.</p>}
              </div>
              
              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center mb-3">
                  <Gift className="h-3 w-3 mr-1" /> Compradores Sazonais (VIP)
                </h4>
                {analytics.vips.length > 0 ? analytics.vips.slice(0, 3).map((client: any) => (
                  <div key={client.id} className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{client.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {client.seasonalOrders} datas
                    </Badge>
                  </div>
                )) : <p className="text-xs text-muted-foreground">Nenhum histórico sazonal forte.</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aniversariantes e Parceiros B2B */}
        <div className="space-y-4 flex flex-col">
          {/* Aniversariantes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
              <CardTitle className="flex items-center text-blue-600 text-lg">
                <Gift className="h-5 w-5 mr-2" /> Aniversariantes do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 max-h-[160px] overflow-y-auto">
              <div className="space-y-3">
                {analytics.birthdays.length > 0 ? analytics.birthdays.map((b: any) => (
                  <div key={b.name + b.reasons} className="flex flex-col">
                    <span className="text-sm font-medium">{b.name}</span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mt-0.5">{b.reasons}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground py-2">Sem aniversariantes este mês.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ranking B2B */}
          <Card className="shadow-sm flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-gray-700 text-base">
                <Building className="h-4 w-4 mr-2" /> Top Empresas (B2B)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {analytics.b2bRanking.length > 0 ? analytics.b2bRanking.slice(0, 3).map((company: any, idx: number) => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[120px]" title={company.name}>{company.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{company.orderCount} ped</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Sem parceiros ativos.</p>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Ranking Revendedores */}
          <Card className="shadow-sm flex-1 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-gray-700 text-base">
                <Award className="h-4 w-4 mr-2 text-orange-500" /> Top Revendedores
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {analytics.resellerRanking?.length > 0 ? analytics.resellerRanking.slice(0, 3).map((reseller: any, idx: number) => (
                  <div key={reseller.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[120px]" title={reseller.name}>{reseller.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{reseller.orderCount} ped</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Sem revendedores ativos.</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      {/* SEÇÃO OPERACIONAL */}
      <div className="grid gap-4 md:grid-cols-2 mt-4 border-t pt-8">
        {/* Balanço Financeiro Base */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Balanço Financeiro</CardTitle>
            <CardDescription>Resumo de entradas e saídas consolidadas.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                 <div className="flex items-center"><ArrowUpRight className="text-green-600 mr-2" /> Entradas (Receitas)</div>
                 <div className="font-bold text-green-700">R$ {Number(totalPaidRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
               </div>
               <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-100">
                 <div className="flex items-center"><ArrowDownRight className="text-red-600 mr-2" /> Saídas (Despesas)</div>
                 <div className="font-bold text-red-600">R$ {Number(totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
               </div>
               <div className="flex justify-between items-center p-4 bg-[#5C3D8F]/10 rounded-lg border border-[#5C3D8F]/20">
                 <div className="font-bold text-[#5C3D8F]">Saldo Atual</div>
                 <div className="font-bold text-[#5C3D8F] text-xl">R$ {Number(realProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Últimos Pedidos */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
            <CardDescription>Acompanhe as propostas e vendas recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {order.clients?.full_name || order.companies?.business_name || order.resellers?.full_name || 'Cliente'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pedido #{order.order_number}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-medium text-[#5C3D8F] text-sm">
                        R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant={order.status === 'Orçamento' ? 'secondary' : 'default'} className="text-[10px] px-1 py-0 h-4">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                Nenhum pedido recente encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
