'use client'
import { useState, useEffect } from 'react'
import { getCommissions, updateCommissionStatus, type Commission } from '@/lib/api/finance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getCommissions()
      setCommissions(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleStatus = async (c: any) => {
    const newStatus = c.status === 'Pago' ? 'Pendente' : 'Pago'
    await updateCommissionStatus(c.id, newStatus)
    loadData()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Comissões B2B</h2>
          <p className="text-muted-foreground">
            Acompanhe o repasse de comissões para parceiros revendedores.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico e Pendências</CardTitle>
          <CardDescription>Comissões geradas pelos pedidos aprovados.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Empresa Parceira</TableHead>
                    <TableHead>Pedido Vinculado</TableHead>
                    <TableHead>Valor Pedido</TableHead>
                    <TableHead className="font-bold">Comissão (R$)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhuma comissão registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{c.companies?.business_name || '-'}</TableCell>
                        <TableCell>#{c.orders?.order_number || '-'}</TableCell>
                        <TableCell>R$ {Number(c.orders?.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-bold text-[#5C3D8F]">
                          R$ {Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatus(c)}
                            className={`h-6 px-2 text-xs font-semibold rounded-full ${c.status === 'Pago' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                          >
                            {c.status}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
