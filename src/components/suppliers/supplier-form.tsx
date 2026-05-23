'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Supplier, createSupplier, updateSupplier, createSupplierProduct, updateSupplierProduct, deleteSupplierProduct, type SupplierProduct } from '@/lib/api/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface SupplierFormProps {
  initialData?: Supplier
}

export function SupplierForm({ initialData }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [products, setProducts] = useState<Partial<SupplierProduct>[]>(initialData?.products || [])
  const [deletedProducts, setDeletedProducts] = useState<string[]>([])

  const [formData, setFormData] = useState<Partial<Supplier>>(
    initialData || {
      name: '',
      document: '',
      phone: '',
      email: '',
      type: 'Fornecedor de material',
      provided_items: '',
      average_delivery_days: 0,
      payment_conditions: '',
      notes: '',
    }
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: parseInt(e.target.value) || 0 })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleAddProduct = () => {
    setProducts([...products, { product_name: '', price: 0, notes: '' }])
  }

  const handleProductChange = (index: number, field: keyof SupplierProduct, value: any) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setProducts(newProducts)
  }

  const handleRemoveProduct = (index: number) => {
    const prod = products[index]
    if (prod.id) {
      setDeletedProducts([...deletedProducts, prod.id])
    }
    const newProducts = [...products]
    newProducts.splice(index, 1)
    setProducts(newProducts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let supplierId = initialData?.id
      const payloadToSave = { ...formData }
      delete payloadToSave.products

      if (supplierId) {
        await updateSupplier(supplierId, payloadToSave)
      } else {
        const newSupplier = await createSupplier(payloadToSave)
        supplierId = newSupplier.id
      }

      if (!supplierId) throw new Error("Falha ao obter ID do fornecedor.")

      // Apagar produtos removidos
      for (const id of deletedProducts) {
        await deleteSupplierProduct(id)
      }

      // Salvar/Atualizar produtos
      for (const prod of products) {
        if (!prod.product_name) continue

        if (prod.id) {
          await updateSupplierProduct(prod.id, prod)
        } else {
          await createSupplierProduct({ ...prod, supplier_id: supplierId })
        }
      }
      router.push('/suppliers')
      router.refresh()
    } catch (err: any) {
      console.error("ERRO AO SALVAR:", err)
      const errorMsg = err.message || err.details || JSON.stringify(err)
      setError(`Erro: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Fornecedor/Parceiro' : 'Novo Fornecedor/Parceiro'}</CardTitle>
        <CardDescription>
          Preencha os dados abaixo. Os campos marcados com * são obrigatórios.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome / Razão Social *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CNPJ / CPF</Label>
              <Input
                id="document"
                name="document"
                value={formData.document || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Parceiro</Label>
              <Select
                value={formData.type || ''}
                onValueChange={(val) => handleSelectChange('type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fornecedor de material">Fornecedor de material</SelectItem>
                  <SelectItem value="Serviço terceirizado">Serviço terceirizado</SelectItem>
                  <SelectItem value="Parceiro de revenda">Parceiro de revenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleChange}
                placeholder="@fornecedor"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="provided_items">Materiais/Serviços fornecidos</Label>
              <Input
                id="provided_items"
                name="provided_items"
                value={formData.provided_items || ''}
                onChange={handleChange}
                placeholder="Ex: Chapas de acrílico, impressão UV, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_delivery_days">Prazo Médio de Entrega (Dias)</Label>
              <Input
                id="average_delivery_days"
                name="average_delivery_days"
                type="number"
                value={formData.average_delivery_days || ''}
                onChange={handleNumberChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_conditions">Condições de Pagamento</Label>
              <Input
                id="payment_conditions"
                name="payment_conditions"
                value={formData.payment_conditions || ''}
                onChange={handleChange}
                placeholder="Ex: 50% entrada, 50% na retirada"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Observações Internas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </div>

            {/* TABELA DE PRODUTOS / INSUMOS DO FORNECEDOR */}
            <div className="md:col-span-2 pt-4 border-t mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Label className="text-lg font-bold text-[#5C3D8F]">Produtos / Insumos deste Fornecedor</Label>
                  <p className="text-sm text-muted-foreground">Cadastre aqui os preços e produtos que você costuma comprar com este parceiro.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center p-4 border border-dashed rounded-md">
                  Nenhum produto cadastrado. Clique em "Adicionar Produto".
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((prod, index) => (
                    <div key={prod.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 border rounded-md relative group">
                      <div className="md:col-span-4 space-y-1">
                        <Label className="text-xs">Nome do Produto/Insumo *</Label>
                        <Input 
                          required 
                          value={prod.product_name || ''} 
                          onChange={e => handleProductChange(index, 'product_name', e.target.value)}
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs">Preço (R$)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={prod.price || 0} 
                          onChange={e => handleProductChange(index, 'price', parseFloat(e.target.value))}
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <Label className="text-xs">Observações (Qtd mín, Cores, etc)</Label>
                        <Input 
                          value={prod.notes || ''} 
                          onChange={e => handleProductChange(index, 'notes', e.target.value)}
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/suppliers')}
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
