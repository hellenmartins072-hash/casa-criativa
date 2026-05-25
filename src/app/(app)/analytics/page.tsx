'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getConversionRate, getAverageTicket, getTopSellingProducts, getSeasonalRevenue } from '@/lib/api/analytics'
import { Loader2, TrendingUp, DollarSign, Target, Package } from 'lucide-react'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [conversion, setConversion] = useState({ rate: 0, total: 0, converted: 0 })
  const [ticket, setTicket] = useState(0)
  const [topProducts, setTopProducts] = useState<{name: string, quantity: number}[]>([])
  const [seasonal, setSeasonal] = useState<{name: string, total: number, count: number}[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [conv, avg, top, seas] = await Promise.all([
          getConversionRate(),
          getAverageTicket(),
          getTopSellingProducts(),
          getSeasonalRevenue(new Date().getFullYear())
        ])
        setConversion(conv)
        setTicket(avg)
        setTopProducts(top)
        setSeasonal(seas)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#5C3D8F]" /></div>
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Indicadores de Desempenho (KPIs)</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversion.rate}%</div>
            <p className="text-xs text-muted-foreground">
              {conversion.converted} aprovados de {conversion.total} orçamentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Valor médio por pedido fechado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 produtos no histórico geral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center">
                  <Package className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="ml-2 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{p.name}</p>
                  </div>
                  <div className="font-bold">{p.quantity} un.</div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-sm text-gray-500">Sem dados suficientes.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receita Sazonal ({new Date().getFullYear()})</CardTitle>
            <CardDescription>Faturamento em meses comemorativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seasonal.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.count} pedidos</p>
                  </div>
                  <div className="font-bold text-green-600">
                    R$ {s.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {seasonal.length === 0 && <p className="text-sm text-gray-500">Nenhum dado sazonal registrado neste ano.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
