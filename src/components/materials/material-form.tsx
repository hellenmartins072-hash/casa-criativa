'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Material, createMaterial, updateMaterial } from '@/lib/api/materials'
import { getSuppliers, type Supplier } from '@/lib/api/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface MaterialFormProps {
  initialData?: Material
}

export function MaterialForm({ initialData }: MaterialFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<Partial<Material>>(
    initialData || {
      name: '',
      category: 'Geral',
      supplier_id: null,
      unit_cost: 0,
      unit_measure: 'Unidade',
      current_stock: 0,
      minimum_stock: 0,
    }
  )

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await getSuppliers()
        // Filter only those who provide materials (optional, but good practice)
        setSuppliers(data || [])
      } catch (err) {
        console.error('Error loading suppliers', err)
      } finally {
        setLoadingSuppliers(false)
      }
    }
    loadSuppliers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setFormData({ ...formData, [e.target.name]: isNaN(val) ? 0 : val })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value === 'null' ? null : value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Removing populated relational object before sending to Supabase
      const payload = { ...formData }
      delete payload.suppliers

      if (initialData?.id) {
        await updateMaterial(initialData.id, payload)
      } else {
        await createMaterial(payload)
      }
      router.push('/materials')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o material.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Material' : 'Novo Material'}</CardTitle>
        <CardDescription>
          Preencha os dados do material para controle de estoque e custos.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome do Material *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(val) => handleSelectChange('category', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caneca">Caneca</SelectItem>
                  <SelectItem value="Camiseta">Camiseta</SelectItem>
                  <SelectItem value="Topo de bolo">Topo de bolo</SelectItem>
                  <SelectItem value="Corte laser">Corte laser</SelectItem>
                  <SelectItem value="Brinde">Brinde</SelectItem>
                  <SelectItem value="Embalagem">Embalagem</SelectItem>
                  <SelectItem value="Gráfica">Gráfica</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Fornecedor Vinculado</Label>
              {loadingSuppliers ? (
                <div className="h-10 border rounded-md px-3 py-2 text-sm text-muted-foreground flex items-center bg-muted/50">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando fornecedores...
                </div>
              ) : (
                <Select
                  value={formData.supplier_id || 'null'}
                  onValueChange={(val) => handleSelectChange('supplier_id', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum fornecedor vinculado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Nenhum</SelectItem>
                    {suppliers.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                    {/* Fallback caso o ID salvo não esteja mais na lista de fornecedores ativos */}
                    {formData.supplier_id && formData.supplier_id !== 'null' && !suppliers.find(s => s.id === formData.supplier_id) && (
                      <SelectItem value={formData.supplier_id}>Fornecedor Oculto/Excluído ({formData.supplier_id.substring(0,8)})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
              <Input
                id="unit_cost"
                name="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost === undefined ? '' : formData.unit_cost}
                onChange={handleNumberChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_measure">Unidade de Medida</Label>
              <Select
                value={formData.unit_measure || ''}
                onValueChange={(val) => handleSelectChange('unit_measure', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unidade">Unidade (un)</SelectItem>
                  <SelectItem value="Metro">Metro (m)</SelectItem>
                  <SelectItem value="Kg">Quilograma (kg)</SelectItem>
                  <SelectItem value="Litro">Litro (L)</SelectItem>
                  <SelectItem value="Pacote">Pacote (pct)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_stock">Estoque Atual</Label>
              <Input
                id="current_stock"
                name="current_stock"
                type="number"
                step="0.01"
                value={formData.current_stock === undefined ? '' : formData.current_stock}
                onChange={handleNumberChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_stock">Estoque Mínimo (Alerta)</Label>
              <Input
                id="minimum_stock"
                name="minimum_stock"
                type="number"
                step="0.01"
                value={formData.minimum_stock === undefined ? '' : formData.minimum_stock}
                onChange={handleNumberChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/materials')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
