'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, Truck, Box, TrendingDown } from 'lucide-react'
import { getSuppliers, deleteSupplier, type Supplier } from '@/lib/api/suppliers'
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

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await getSuppliers()
        setSuppliers(data || [])
      } catch (error) {
        console.error('Error loading suppliers:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSuppliers()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente EXCLUIR este fornecedor? Esta ação não pode ser desfeita e pode afetar produtos vinculados a ele.")) {
      try {
        await deleteSupplier(id)
        setSuppliers(prev => prev.filter(s => s.id !== id))
      } catch (error) {
        console.error("Erro ao excluir fornecedor", error)
        alert("Erro ao excluir fornecedor. Verifique se ele não possui vínculos ativos.")
      }
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.document?.includes(searchQuery) ||
    supplier.type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Fornecedores e Parceiros</h2>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores de materiais, prestadores de serviço e parceiros.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/suppliers/best-prices">
            <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
              <TrendingDown className="mr-2 h-4 w-4" /> Produto Mais Barato
            </Button>
          </Link>
          <Link href="/suppliers/new">
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Fornecedores</CardTitle>
          <CardDescription>
            Lista de todos os parceiros de negócios cadastrados no sistema.
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, documento ou tipo..."
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
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone / Contato</TableHead>
                    <TableHead>Prazo Médio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum fornecedor encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{supplier.name}</span>
                            {supplier.document && (
                              <span className="text-xs text-muted-foreground">Doc: {supplier.document}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                            {supplier.type === 'Fornecedor de material' ? <Box className="mr-1 h-3 w-3" /> : <Truck className="mr-1 h-3 w-3" />}
                            {supplier.type || 'Não definido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{supplier.phone || '-'}</span>
                            {supplier.email && (
                              <span className="text-xs text-muted-foreground">{supplier.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.average_delivery_days ? `${supplier.average_delivery_days} dias` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/suppliers/${supplier.id}`)}>
                                Editar / Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50" 
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setTimeout(() => handleDelete(supplier.id), 100)
                                }}
                              >
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
