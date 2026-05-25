'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownRight, ArrowUpRight, TrendingUp, Package } from 'lucide-react'
import { getMonthlyFinancialSummary, getPendingFinancials, getTopSellingProducts, getMostProfitableProducts } from '@/lib/api/analytics'

export function FinanceDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    monthly: { revenues: 0, expenses: 0, profit: 0 },
    pending: { receivable: 0, payable: 0 },
    topSelling: [] as any[],
    mostProfitable: [] as any[]
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [monthly, pending, top, profit] = await Promise.all([
          getMonthlyFinancialSummary(),
          getPendingFinancials(),
          getTopSellingProducts(),
          getMostProfitableProducts()
        ])
        
        setData({
          monthly,
          pending,
          topSelling: top,
          mostProfitable: profit
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {[1,2,3,4].map(i => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Top Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Realizado (Mês Atual)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.monthly.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {data.monthly.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas Pagas - Despesas Pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Pagas (Mês Atual)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {data.monthly.revenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber (Futuro)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {data.pending.receivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faturamentos pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar (Futuro)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {data.pending.payable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-[#5C3D8F]" /> 
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {data.topSelling.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
              ) : (
                data.topSelling.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{idx + 1}. {item.name}</span>
                    <span className="text-sm font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {item.quantity} un
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> 
              Produtos Mais Lucrativos (Estimativa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {data.mostProfitable.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
              ) : (
                data.mostProfitable.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{idx + 1}. {item.name}</span>
                    <span className="text-sm font-bold text-green-600">
                      R$ {item.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
