'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, TrendingDown, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
import { Badge } from '@/components/ui/badge'

type BestPriceItem = {
  product_name: string
  supplier_name: string
  supplier_id: string
  price: number
  notes: string | null
}

export default function BestPricesPage() {
  const [items, setItems] = useState<BestPriceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchBestPrices() {
      try {
        // Busca todos os produtos junto com o nome do fornecedor
        const { data, error } = await supabase
          .from('supplier_products')
          .select(`
            product_name,
            price,
            notes,
            supplier_id,
            suppliers ( name )
          `)
          .order('price', { ascending: true })

        if (error) throw error

        if (data) {
          const formatted: BestPriceItem[] = data.map((d: any) => ({
            product_name: d.product_name,
            supplier_name: d.suppliers?.name || 'Fornecedor Desconhecido',
            supplier_id: d.supplier_id,
            price: Number(d.price),
            notes: d.notes
          }))
          
          setItems(formatted)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBestPrices()
  }, [])

  // Agrupa e pega o menor preço por produto
  const groupedProducts = items.reduce((acc: Record<string, BestPriceItem[]>, item) => {
    const key = item.product_name.trim().toLowerCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  // Filtra por busca e pega apenas os menores preços para o resumo
  const bestPricesSummary = Object.keys(groupedProducts).map(key => {
    const prodList = groupedProducts[key]
    // Já vem ordenado pelo banco (ascending), mas garantimos pegando o primeiro
    prodList.sort((a, b) => a.price - b.price)
    return {
      product_name: prodList[0].product_name, // Nome original capitalizado do melhor fornecedor
      bestPrice: prodList[0],
      allOptions: prodList
    }
  }).filter(item => item.product_name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <Link href="/suppliers" className="hover:text-primary transition-colors flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para Fornecedores
        </Link>
      </div>
      
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F] flex items-center gap-2">
            <TrendingDown className="h-8 w-8 text-green-600" />
            Relatório: Produto Mais em Conta
          </h2>
          <p className="text-muted-foreground">
            Compare os preços dos insumos cadastrados nos seus fornecedores e veja a opção mais barata.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Melhores Preços Atuais</CardTitle>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar insumo/produto..."
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
                    <TableHead>Produto / Insumo</TableHead>
                    <TableHead>Fornecedor (Mais Barato)</TableHead>
                    <TableHead>Melhor Preço</TableHead>
                    <TableHead>Outras Opções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestPricesSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum produto cadastrado nos fornecedores.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bestPricesSummary.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold text-gray-800">
                          {item.product_name}
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                             <Store className="h-3 w-3 mr-1" />
                             {item.bestPrice.supplier_name}
                           </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-[#5C3D8F]">
                          R$ {item.bestPrice.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {item.allOptions.length > 1 ? (
                            <div className="text-xs text-muted-foreground space-y-1">
                              {item.allOptions.slice(1).map((opt, idx) => (
                                <div key={idx} className="flex justify-between border-b pb-1 last:border-0 w-48">
                                  <span>{opt.supplier_name}</span>
                                  <span className="text-red-500">R$ {opt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Exclusivo (1 fornecedor)</span>
                          )}
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
