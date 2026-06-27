'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Star } from 'lucide-react'
import { getClients, deleteClient, type Client } from '@/lib/api/clients'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReturnsPage from '@/app/(app)/returns/page'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClientForOrders, setSelectedClientForOrders] = useState<Client | null>(null)

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await getClients()
        if (data) {
          const sortedByDate = [...data].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
          const withCodes = sortedByDate.map((c, index) => ({
            ...c,
            client_code: `CLI-${String(index + 1).padStart(3, '0')}`
          }))
          const sortedAlphabetically = withCodes.sort((a, b) => a.full_name.localeCompare(b.full_name))
          setClients(sortedAlphabetically as any)
        } else {
          setClients([])
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente EXCLUIR este cliente permanentemente?")) {
      try {
        await deleteClient(id)
        setClients(clients.filter(c => c.id !== id))
      } catch (err) {
        alert("Erro ao excluir. O cliente pode ter pedidos vinculados.")
      }
    }
  }

  const filteredClients = clients.filter(client => 
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.whatsapp.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client as any).client_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Clientes</h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de clientes físicos.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/clients/new">
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Todos os Clientes</TabsTrigger>
          <TabsTrigger value="returns">Retornos Programados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="m-0">
          <Card>
        <CardHeader>
          <CardTitle>Todos os Clientes</CardTitle>
          <CardDescription>
            Lista de todos os clientes cadastrados no sistema.
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código, nome, email ou WhatsApp..."
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
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {(client as any).client_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {client.full_name}
                            {client.is_vip && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{client.whatsapp}</span>
                            <span className="text-xs text-muted-foreground">{client.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.client_type === 'Revenda' ? 'secondary' : 'outline'}>
                            {client.client_type || 'Varejo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.orders && client.orders.length > 0 ? (
                            <div className="flex flex-col text-xs text-muted-foreground gap-1">
                              <div>
                                <span className="font-medium text-foreground mr-1">Primeiro:</span>
                                {new Date(Math.min(...client.orders.map(o => new Date(o.created_at).getTime()))).toLocaleDateString('pt-BR')}
                              </div>
                              <div>
                                <span className="font-medium text-foreground mr-1">Último:</span>
                                {new Date(Math.max(...client.orders.map(o => new Date(o.created_at).getTime()))).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem pedidos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.status === 'Despedido' ? 'destructive' : 'default'} className={client.status === 'Ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {client.status === 'Ativo' ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
                            {client.status || 'Ativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                                Editar / Visualizar
                              </DropdownMenuItem>
                              {client.orders && client.orders.length > 0 && (
                                <DropdownMenuItem className="cursor-pointer" onClick={() => setSelectedClientForOrders(client)}>
                                  Ver Pedidos Detalhados
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(client.id)}>
                                Excluir Cliente
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
      </TabsContent>
      
      <TabsContent value="returns" className="m-0 -mx-4 md:-mx-8 -mt-8">
        <ReturnsPage />
      </TabsContent>
    </Tabs>

      <Dialog open={!!selectedClientForOrders} onOpenChange={(open) => !open && setSelectedClientForOrders(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Pedidos - {selectedClientForOrders?.full_name}</DialogTitle>
            <DialogDescription>
              Lista completa de pedidos do cliente com valores e status.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClientForOrders?.orders
                  ?.slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.order_number}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
