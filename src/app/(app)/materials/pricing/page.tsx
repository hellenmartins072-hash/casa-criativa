'use client'

import { useState, useEffect } from 'react'
import { PricingRule, getPricingRules, updatePricingRule, createPricingRule } from '@/lib/api/pricing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Categorias padrão caso a tabela esteja vazia
  const defaultCategories = ['Caneca', 'Topo de bolo', 'Corte laser', 'Brinde', 'Embalagem', 'Camiseta', 'Outro']

  useEffect(() => {
    async function loadRules() {
      try {
        let data = await getPricingRules()
        
        // Se estiver vazio, vamos instanciar regras vazias baseadas no default para facilitar a UI
        if (!data || data.length === 0) {
          data = defaultCategories.map(cat => ({
            id: '',
            category: cat,
            markup_retail: 0,
            markup_resale: 0,
            markup_corporate: 0,
            markup_shopee: 0,
            markup_mercado_livre: 0,
            markup_elo7: 0,
            markup_instagram: 0,
            markup_tiktok: 0,
            markup_google: 0,
          }))
        } else {
          // Garante que pelo menos as padrões existam na UI
          defaultCategories.forEach(cat => {
            if (!data.find(r => r.category === cat)) {
              data.push({
                id: '',
                category: cat,
                markup_retail: 0,
                markup_resale: 0,
                markup_corporate: 0,
                markup_shopee: 0,
                markup_mercado_livre: 0,
                markup_elo7: 0,
                markup_instagram: 0,
                markup_tiktok: 0,
                markup_google: 0,
              })
            }
          })
        }
        
        setRules(data)
      } catch (err) {
        console.error('Error loading rules:', err)
        setError('Falha ao carregar as regras de preço.')
      } finally {
        setLoading(false)
      }
    }
    loadRules()
  }, [])

  const handleValueChange = (index: number, field: keyof PricingRule, value: string) => {
    const newRules = [...rules]
    const parsed = parseFloat(value)
    
    newRules[index] = {
      ...newRules[index],
      [field]: isNaN(parsed) ? 0 : parsed
    }
    setRules(newRules)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Salva cada regra individualmente
      for (const rule of rules) {
        if (rule.id) {
          // Atualiza existente
          await updatePricingRule(rule.id, rule)
        } else {
          // Cria nova
          const newRule = await createPricingRule(rule)
          if (newRule) {
            rule.id = newRule.id
          }
        }
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao salvar regras. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Regras de Precificação</h2>
            <p className="text-muted-foreground">
              Defina as margens de lucro (markup em %) por categoria e por canal de venda.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white" disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Markups</CardTitle>
          <CardDescription>
            Os valores abaixo representam a porcentagem (%) adicionada sobre o custo do produto em cada canal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">Regras salvas com sucesso!</div>}
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[150px] sticky left-0 bg-muted/95 z-10 font-semibold">Categoria</TableHead>
                    <TableHead className="text-center">Varejo (%)</TableHead>
                    <TableHead className="text-center">Revenda (%)</TableHead>
                    <TableHead className="text-center">B2B (%)</TableHead>
                    <TableHead className="text-center">Shopee (%)</TableHead>
                    <TableHead className="text-center">M. Livre (%)</TableHead>
                    <TableHead className="text-center">Elo7 (%)</TableHead>
                    <TableHead className="text-center">Instagram (%)</TableHead>
                    <TableHead className="text-center">TikTok (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule, index) => (
                    <TableRow key={rule.category || index}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                        {rule.category}
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_retail || 0}
                          onChange={(e) => handleValueChange(index, 'markup_retail', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_resale || 0}
                          onChange={(e) => handleValueChange(index, 'markup_resale', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_corporate || 0}
                          onChange={(e) => handleValueChange(index, 'markup_corporate', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_shopee || 0}
                          onChange={(e) => handleValueChange(index, 'markup_shopee', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_mercado_livre || 0}
                          onChange={(e) => handleValueChange(index, 'markup_mercado_livre', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_elo7 || 0}
                          onChange={(e) => handleValueChange(index, 'markup_elo7', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_instagram || 0}
                          onChange={(e) => handleValueChange(index, 'markup_instagram', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 text-center" 
                          value={rule.markup_tiktok || 0}
                          onChange={(e) => handleValueChange(index, 'markup_tiktok', e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
