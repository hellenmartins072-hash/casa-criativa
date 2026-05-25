'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Product, createProduct, updateProduct, getProductMaterials, saveProductMaterials, ProductMaterial } from '@/lib/api/products'
import { getMaterials, Material } from '@/lib/api/materials'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Image as ImageIcon, UploadCloud, X, Plus, Trash2 } from 'lucide-react'

interface ProductFormProps {
  initialData?: Product
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estoque / Ficha Técnica
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [composition, setComposition] = useState<Partial<ProductMaterial>[]>([])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('null')
  const [materialQuantity, setMaterialQuantity] = useState<number>(1)

  const [formData, setFormData] = useState<Partial<Product>>(
    initialData || {
      name: '',
      description: '',
      category: 'Geral',
      image_url: '',
      price_retail: 0,
      price_resale: 0,
      price_ecommerce: 0,
      is_active: true,
      store_id: null,
    }
  )

  useEffect(() => {
    async function loadData() {
      try {
        const mats = await getMaterials()
        setAvailableMaterials(mats || [])

        if (initialData?.id) {
          const comp = await getProductMaterials(initialData.id)
          setComposition(comp || [])
        }
      } catch (err) {
        console.error('Error loading materials/composition:', err)
      }
    }
    loadData()
  }, [initialData?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setFormData({ ...formData, [e.target.name]: isNaN(val) ? 0 : val })
  }

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, is_active: checked })
  }

  const handleAddMaterialToComposition = () => {
    if (selectedMaterialId === 'null') return
    
    // Check if already in composition
    if (composition.find(c => c.material_id === selectedMaterialId)) {
      alert('Este material já está na ficha técnica. Edite a quantidade na lista abaixo.')
      return
    }

    const materialDetails = availableMaterials.find(m => m.id === selectedMaterialId)
    
    if (materialDetails) {
      setComposition([...composition, {
        material_id: materialDetails.id,
        quantity: materialQuantity,
        material: {
          id: materialDetails.id,
          name: materialDetails.name,
          unit_measure: materialDetails.unit_measure || 'un',
          unit_cost: materialDetails.unit_cost || 0
        }
      }])
    }
    
    setSelectedMaterialId('null')
    setMaterialQuantity(1)
  }

  const handleRemoveMaterialFromComposition = (material_id: string) => {
    setComposition(composition.filter(c => c.material_id !== material_id))
  }

  const handleCompositionQuantityChange = (material_id: string, newQuantity: number) => {
    setComposition(composition.map(c => 
      c.material_id === material_id ? { ...c, quantity: newQuantity } : c
    ))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }
      setUploading(true)
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Pegar URL pública
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrlData.publicUrl })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message || 'Erro ao fazer upload da imagem.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let productId = initialData?.id
      
      if (productId) {
        await updateProduct(productId, formData)
      } else {
        const newProduct = await createProduct(formData)
        productId = newProduct.id
      }
      
      if (productId) {
        // Save composition
        await saveProductMaterials(productId, composition)
      }
      
      router.push('/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o produto.')
    } finally {
      setLoading(false)
    }
  }

  const calculatedCost = composition.reduce((total, comp) => {
    return total + (comp.quantity || 0) * (comp.material?.unit_cost || 0)
  }, 0)

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Produto' : 'Novo Produto'}</CardTitle>
        <CardDescription>
          Preencha os detalhes do produto e a ficha técnica de materiais utilizados.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Coluna da Imagem */}
            <div className="w-full md:w-1/3 flex flex-col gap-2">
              <Label>Foto Principal</Label>
              <div 
                className={`relative w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden ${
                  formData.image_url ? 'border-transparent bg-muted/30' : 'border-muted-foreground/20 hover:bg-muted/50 transition-colors'
                }`}
              >
                {formData.image_url ? (
                  <>
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <span className="text-sm font-medium">Clique para enviar imagem</span>
                        <span className="text-xs mt-1">PNG, JPG até 5MB</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {formData.image_url && (
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Trocar Imagem
                </Button>
              )}
            </div>

            {/* Coluna de Dados */}
            <div className="w-full md:w-2/3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Caneca Mágica Personalizada"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
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
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Descrição Pública (Loja Virtual)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="min-h-[100px]"
                    placeholder="Descreva os detalhes do produto, tamanho, material, etc."
                  />
                </div>

                {/* Bloco de Preços */}
                <div className="space-y-2 md:col-span-2 pt-4 border-t">
                  <h3 className="font-semibold text-lg text-[#5C3D8F]">Tabela de Preços</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estes valores serão usados na hora de montar pedidos e catálogos.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                      <Label htmlFor="price_retail" className="text-sm">Preço Cliente Final (R$)</Label>
                      <Input
                        id="price_retail"
                        name="price_retail"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_retail === undefined ? '' : formData.price_retail}
                        onChange={handleNumberChange}
                        className="font-semibold text-[#5C3D8F]"
                      />
                    </div>
                    
                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                      <Label htmlFor="price_resale" className="text-sm">Preço Revenda (R$)</Label>
                      <Input
                        id="price_resale"
                        name="price_resale"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_resale === undefined ? '' : formData.price_resale}
                        onChange={handleNumberChange}
                      />
                    </div>
                    
                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                      <Label htmlFor="price_ecommerce" className="text-sm">Preço Plataformas (R$)</Label>
                      <Input
                        id="price_ecommerce"
                        name="price_ecommerce"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price_ecommerce === undefined ? '' : formData.price_ecommerce}
                        onChange={handleNumberChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ficha Técnica / Receita */}
          <div className="space-y-4 pt-6 border-t">
            <div>
              <h3 className="font-semibold text-lg text-[#5C3D8F]">Ficha Técnica (Composição)</h3>
              <p className="text-sm text-muted-foreground">
                Defina os materiais que compõem 1 unidade deste produto. O estoque será deduzido automaticamente quando um pedido for Aprovado.
              </p>
            </div>
            
            <div className="bg-muted/20 border rounded-lg p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Material</Label>
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material do estoque..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Selecione...</SelectItem>
                      {availableMaterials.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-32 space-y-2">
                  <Label>Quantidade</Label>
                  <Input 
                    type="number" 
                    step="0.0001" 
                    min="0" 
                    value={materialQuantity} 
                    onChange={e => setMaterialQuantity(parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <Button type="button" variant="secondary" onClick={handleAddMaterialToComposition} disabled={selectedMaterialId === 'null'}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>

              {composition.length > 0 ? (
                <div className="mt-4 border rounded-md divide-y">
                  {composition.map(comp => (
                    <div key={comp.material_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 bg-white">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{comp.material?.name}</span>
                        <div className="text-xs text-muted-foreground">
                          Custo unitário: R$ {comp.material?.unit_cost?.toFixed(2)} / {comp.material?.unit_measure}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="0.0001"
                          min="0"
                          className="w-24 h-8 text-sm" 
                          value={comp.quantity} 
                          onChange={(e) => handleCompositionQuantityChange(comp.material_id, parseFloat(e.target.value) || 0)} 
                        />
                        <span className="text-xs text-muted-foreground w-8">{comp.material?.unit_measure}</span>
                        <div className="w-24 text-right text-sm font-medium">
                          R$ {((comp.quantity || 0) * (comp.material?.unit_cost || 0)).toFixed(2)}
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                          onClick={() => handleRemoveMaterialFromComposition(comp.material_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-muted/10 flex justify-between items-center text-sm">
                    <span className="font-semibold">Custo Total de Produção Estimado:</span>
                    <span className="font-bold text-[#5C3D8F] text-base">R$ {calculatedCost.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-md text-muted-foreground text-sm">
                  Nenhum material adicionado à ficha técnica deste produto.
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="is_active" 
                checked={formData.is_active || false}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_active" className="font-medium cursor-pointer">
                Produto Ativo (Disponível para venda na loja pública e pedidos)
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/products')}
            disabled={loading || uploading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={loading || uploading}>
            {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Produto
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
