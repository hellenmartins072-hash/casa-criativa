'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, FileText, MoreHorizontal } from 'lucide-react'
import { getOrders, deleteOrder, type Order } from '@/lib/api/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders()
        setOrders(data || [])
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getOrders()
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente EXCLUIR este pedido? Esta ação não pode ser desfeita e pode afetar o caixa e o estoque.")) {
      try {
        await deleteOrder(id)
        loadOrders()
      } catch (err) {
        alert("Erro ao excluir pedido.")
        console.error(err)
      }
    }
  }

  const filteredOrders = orders.filter(order => {
    const clientName = order.clients?.full_name || ''
    const companyName = order.companies?.trading_name || order.companies?.business_name || ''
    const resellerName = order.resellers?.full_name || ''
    const orderStr = order.order_number?.toString() || ''
    const search = searchQuery.toLowerCase()
    
    return clientName.toLowerCase().includes(search) || 
           companyName.toLowerCase().includes(search) ||
           resellerName.toLowerCase().includes(search) ||
           orderStr.includes(search)
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Orçamento': return 'bg-gray-100 text-gray-800'
      case 'Aprovado': return 'bg-blue-100 text-blue-800'
      case 'Em Produção': return 'bg-yellow-100 text-yellow-800'
      case 'Finalizado': return 'bg-purple-100 text-purple-800'
      case 'Entregue': return 'bg-green-100 text-green-800'
      case 'Cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Pedidos e Orçamentos</h2>
          <p className="text-muted-foreground">
            Gerencie propostas, controle a produção e as entregas.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/orders/new">
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Pedido
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>
            Acompanhe o andamento de todos os orçamentos e pedidos.
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por número ou cliente..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente / Empresa</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum pedido encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.order_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {order.clients?.full_name || order.companies?.trading_name || order.companies?.business_name || order.resellers?.full_name || 'Cliente Removido'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-semibold text-[#5C3D8F]">
                          R$ {Number(order.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                                Editar / Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`/orders/${order.id}/pdf`, '_blank')}>
                                Gerar PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700" onClick={() => handleDelete(order.id)}>
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
