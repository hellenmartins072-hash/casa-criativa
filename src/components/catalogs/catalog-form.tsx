'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Catalog, createCatalog, updateCatalog } from '@/lib/api/catalogs'
import { getActiveProducts, type Product } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface CatalogFormProps {
  initialData?: Catalog
}

export function CatalogForm({ initialData }: CatalogFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')
  
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const [formData, setFormData] = useState<Partial<Catalog>>(
    initialData || {
      title: '',
      description: '',
      is_public: true,
      store_id: null,
    }
  )

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getActiveProducts()
        setAllProducts(data || [])
        
        // If editing, extract product IDs from the nested products array
        if (initialData?.products) {
          setSelectedProductIds(initialData.products.map(p => p.id))
        }
      } catch (err) {
        console.error('Error loading products', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, is_public: checked })
  }

  const handleProductToggle = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, productId])
    } else {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = { ...formData }
      delete payload.products // Remove virtual field before sending to DB

      if (initialData?.id) {
        await updateCatalog(initialData.id, payload, selectedProductIds)
      } else {
        await createCatalog(payload, selectedProductIds)
      }
      router.push('/catalogs')
      router.refresh()
    } catch (err: any) {
      console.error('Submit Catalog Error:', err)
      const errorMsg = err?.message || err?.details || err?.hint || JSON.stringify(err)
      setError(`Erro do Banco: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Catálogo' : 'Novo Catálogo'}</CardTitle>
        <CardDescription>
          Monte uma seleção de produtos para enviar para seus clientes ou revendedores.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Catálogo *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                placeholder="Ex: Catálogo Dia das Mães - Varejo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição / Mensagem Inicial</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="min-h-[80px]"
                placeholder="Aparecerá no topo da página do catálogo para o cliente."
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="is_public" 
                checked={formData.is_public || false}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_public" className="font-medium cursor-pointer">
                Catálogo Público (Qualquer um com o link pode acessar)
              </Label>
            </div>

            <div className="pt-6 border-t mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#5C3D8F]">Seleção de Produtos</h3>
                <Badge variant="secondary">{selectedProductIds.length} selecionados</Badge>
              </div>
              
              {loadingProducts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allProducts.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">Nenhum produto ativo encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2 border rounded-lg bg-muted/10">
                  {allProducts.map(product => (
                    <div 
                      key={product.id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedProductIds.includes(product.id) ? 'bg-primary/5 border-primary/30' : 'bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => handleProductToggle(product.id, !selectedProductIds.includes(product.id))}
                    >
                      <Checkbox 
                        id={`prod-${product.id}`}
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={(checked) => handleProductToggle(product.id, checked === true)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()} // Evita duplo clique
                      />
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor={`prod-${product.id}`} className="font-medium cursor-pointer leading-tight">
                          {product.name}
                        </Label>
                        <div className="flex justify-between items-center w-full mt-1">
                          <Badge variant="outline" className="text-[10px] px-1">{product.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            R$ {(product.price_retail || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/catalogs')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Catálogo
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
