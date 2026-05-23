'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, BookOpen, ExternalLink, Printer } from 'lucide-react'
import { getCatalogs, type Catalog } from '@/lib/api/catalogs'
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

export default function CatalogsPage() {
  const router = useRouter()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const data = await getCatalogs()
        setCatalogs(data || [])
      } catch (error) {
        console.error('Error loading catalogs:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCatalogs()
  }, [])

  const filteredCatalogs = catalogs.filter(catalog => 
    catalog.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/c/${id}`
    navigator.clipboard.writeText(url)
    alert('Link copiado para a área de transferência!')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Catálogos Virtuais</h2>
          <p className="text-muted-foreground">
            Crie seleções de produtos para enviar aos clientes ou imprimir em PDF.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/catalogs/new">
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Catálogo
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Catálogos</CardTitle>
          <CardDescription>
            Gerencie os catálogos ativos e gere links de compartilhamento.
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por título..."
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
                    <TableHead>Título</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCatalogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum catálogo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCatalogs.map((catalog) => (
                      <TableRow key={catalog.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {catalog.title}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {catalog.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={catalog.is_public ? 'default' : 'secondary'}>
                            {catalog.is_public ? 'Público' : 'Privado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              title="Copiar Link Público"
                              onClick={() => handleCopyLink(catalog.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Link href={`/c/${catalog.id}?print=true`} target="_blank">
                              <Button variant="outline" size="icon" title="Gerar PDF (Imprimir)">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Opções</DropdownMenuLabel>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/catalogs/${catalog.id}`)}>
                                  Editar Catálogo
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`/c/${catalog.id}`, '_blank')}>
                                  Visualizar Online
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
