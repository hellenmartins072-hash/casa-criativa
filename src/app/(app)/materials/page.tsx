'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, AlertTriangle, Box, Settings2, TrendingDown } from 'lucide-react'
import { getMaterials, getMaterialConsumption, type Material } from '@/lib/api/materials'
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

type MaterialWithStats = Material & { consumption30d?: number; depletionDays?: number }

export default function MaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<MaterialWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadMaterials() {
      try {
        const data = await getMaterials()
        
        // Fetch consumption for each material
        const dataWithStats = await Promise.all(
          (data || []).map(async (mat) => {
            const consumption = await getMaterialConsumption(mat.id, 30)
            const dailyAvg = consumption / 30
            const depletionDays = dailyAvg > 0 ? Math.floor((mat.current_stock || 0) / dailyAvg) : Infinity
            
            return { ...mat, consumption30d: consumption, depletionDays }
          })
        )
        
        setMaterials(dataWithStats)
      } catch (error) {
        console.error('Error loading materials:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMaterials()
  }, [])

  const filteredMaterials = materials.filter(material => 
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Estoque Integrado</h2>
          <p className="text-muted-foreground">
            Controle de insumos e inteligência de consumo por receita de produto.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/materials/pricing">
            <Button variant="outline" className="text-[#5C3D8F] border-[#5C3D8F] hover:bg-[#5C3D8F]/10">
              <Settings2 className="mr-2 h-4 w-4" /> Regras de Preço (Markup)
            </Button>
          </Link>
          <Link href="/materials/new">
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Material
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posição de Estoque</CardTitle>
          <CardDescription>
            Acompanhe o saldo atual e a previsão de esgotamento baseada nos pedidos recentes.
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome ou categoria..."
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
                    <TableHead>Material</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Custo Unit.</TableHead>
                    <TableHead>Consumo (30d)</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Previsão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Nenhum material encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((material) => {
                      const isLowStock = (material.current_stock || 0) <= (material.minimum_stock || 0);
                      const isCriticalDepletion = material.depletionDays !== Infinity && material.depletionDays <= 7;
                      
                      return (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {isLowStock && <AlertTriangle className="h-4 w-4 text-amber-500" title="Estoque Mínimo Atingido" />}
                              <div className="flex flex-col">
                                <span>{material.name}</span>
                                <span className="text-xs text-muted-foreground">{material.category || 'Geral'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {material.suppliers?.name || <span className="text-muted-foreground text-sm">Não vinculado</span>}
                          </TableCell>
                          <TableCell>
                            R$ {(material.unit_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-muted-foreground">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {material.consumption30d || 0} {material.unit_measure || 'un'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={isLowStock ? "text-amber-600 font-bold" : "font-medium"}>
                                {material.current_stock || 0} {material.unit_measure || 'un'}
                              </span>
                              {material.minimum_stock && (
                                <span className="text-xs text-muted-foreground">Mín: {material.minimum_stock}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {material.depletionDays === Infinity || material.depletionDays === undefined ? (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">Sem previsão</Badge>
                            ) : (
                              <Badge variant={isCriticalDepletion ? "destructive" : "outline"} className={isCriticalDepletion ? "bg-red-500" : ""}>
                                Esgota em {material.depletionDays} dia{material.depletionDays !== 1 && 's'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/materials/${material.id}`)}>
                                  Editar / Movimentar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
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
