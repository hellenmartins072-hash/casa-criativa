'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, Building2, UserX } from 'lucide-react'
import { getCompanies, deleteCompany, type Company } from '@/lib/api/companies'
import { getStores, type Store } from '@/lib/api/stores'
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

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadCompanies() {
      try {
        const [data, storesData] = await Promise.all([
          getCompanies(),
          getStores()
        ])
        if (storesData) setStores(storesData)
        if (data) {
          const sortedByDate = [...data].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
          const withCodes = sortedByDate.map((c, index) => ({
            ...c,
            company_code: `B2B-${String(index + 1).padStart(3, '0')}`
          }))
          const sortedAlphabetically = withCodes.sort((a, b) => a.business_name.localeCompare(b.business_name))
          setCompanies(sortedAlphabetically as any)
        } else {
          setCompanies([])
        }
      } catch (error) {
        console.error('Error loading companies:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCompanies()
  }, [])

  const filteredCompanies = companies.filter(company => 
    company.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.cnpj?.includes(searchQuery) ||
    company.trading_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company as any).company_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e pode afetar pedidos vinculados.')) {
      try {
        await deleteCompany(id)
        setCompanies(prev => prev.filter(c => c.id !== id))
      } catch (error) {
        console.error('Error deleting company:', error)
        alert('Erro ao excluir a empresa.')
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Empresas B2B</h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de clientes corporativos e parceiros.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/companies/new">
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Nova Empresa
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Empresas</CardTitle>
          <CardDescription>
            Lista de todas as empresas cadastradas no sistema.
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código, razão social, fantasia ou CNPJ..."
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhuma empresa encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {(company as any).company_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{company.business_name}</span>
                            {company.trading_name && (
                              <span className="text-xs text-muted-foreground">{company.trading_name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{company.cnpj || '-'}</TableCell>
                        <TableCell>{company.phone || '-'}</TableCell>
                        <TableCell>
                          {company.store_ids && company.store_ids.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {company.store_ids.map(id => {
                                const store = stores.find(s => s.id === id)
                                return store ? <Badge key={id} variant="secondary" className="text-[10px]">{store.name}</Badge> : null
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.status === 'Despedido' ? 'destructive' : 'default'} className={company.status === 'Ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {company.status === 'Ativo' ? <Building2 className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
                            {company.status || 'Ativo'}
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
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/companies/${company.id}`)}>
                                Editar / Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive cursor-pointer" 
                                onSelect={() => {
                                  setTimeout(() => {
                                    handleDelete(company.id);
                                  }, 100);
                                }}
                              >
                                Excluir Empresa
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
