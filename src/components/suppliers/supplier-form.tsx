'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Supplier, createSupplier, updateSupplier, createSupplierProduct, updateSupplierProduct, deleteSupplierProduct, deleteSupplier, type SupplierProduct } from '@/lib/api/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SupplierFormProps {
  initialData?: Supplier
  isModal?: boolean
  onSuccess?: (supplier: Supplier) => void
  onCancel?: () => void
}

type UIProduct = Partial<SupplierProduct> & {
  purchase_date?: string
  quantity?: number
  payment_method?: string
}

function parseNotesToUIProduct(prod: SupplierProduct): UIProduct {
  let purchase_date = ''
  let quantity = 1
  let payment_method = ''
  let notes = prod.notes || ''
  
  try {
    const parsed = JSON.parse(prod.notes || '{}')
    if (parsed.is_json_v1) {
      purchase_date = parsed.purchase_date || ''
      quantity = parsed.quantity || 1
      payment_method = parsed.payment_method || ''
      notes = parsed.text || ''
    }
  } catch (e) {
    // Keep as normal string if not valid JSON
  }

  return { ...prod, purchase_date, quantity, payment_method, notes }
}

export function SupplierForm({ initialData, isModal, onSuccess, onCancel }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [products, setProducts] = useState<UIProduct[]>(
    (initialData?.products || []).map(parseNotesToUIProduct)
  )
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

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleAddProduct = () => {
    setProducts([...products, { product_name: '', price: 0, notes: '', purchase_date: '', quantity: 1, payment_method: '' }])
  }

  const handleProductChange = (index: number, field: keyof UIProduct, value: any) => {
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

  const handleDeleteSupplier = async () => {
    if (!initialData?.id) return
    
    if (confirm("ATENÇÃO: Deseja realmente EXCLUIR este fornecedor? Esta ação não pode ser desfeita e pode afetar produtos vinculados a ele.")) {
      setLoading(true)
      try {
        await deleteSupplier(initialData.id)
        router.push('/suppliers')
        router.refresh()
      } catch (err: any) {
        console.error("ERRO AO EXCLUIR FORNECEDOR:", err)
        alert("Erro ao excluir fornecedor. Verifique se ele possui vínculos.")
        setLoading(false)
      }
    }
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

      // Salvar/Atualizar produtos e registrar dados extras no formato JSON nas observações
      for (const prod of products) {
        if (!prod.product_name) continue

        const jsonNotes = JSON.stringify({
          is_json_v1: true,
          purchase_date: prod.purchase_date || '',
          quantity: prod.quantity || 1,
          payment_method: prod.payment_method || '',
          text: prod.notes || ''
        })

        const payload = {
          id: prod.id,
          product_name: prod.product_name,
          price: prod.price || 0,
          notes: jsonNotes
        }

        if (prod.id) {
          await updateSupplierProduct(prod.id, payload)
        } else {
          await createSupplierProduct({ ...payload, supplier_id: supplierId })
        }
      }
      if (isModal && onSuccess) {
        onSuccess(payloadToSave as Supplier)
      } else {
        router.push('/suppliers')
        router.refresh()
      }
    } catch (err: any) {
      console.error("ERRO AO SALVAR:", err)
      const errorMsg = err.message || err.details || JSON.stringify(err)
      setError(`Erro: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={isModal ? "border-0 shadow-none w-full" : "max-w-4xl mx-auto"}>
      {!isModal && (
        <CardHeader>
          <CardTitle>{initialData ? 'Editar Fornecedor/Parceiro' : 'Novo Fornecedor/Parceiro'}</CardTitle>
          <CardDescription>
            Preencha os dados abaixo. Os campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
      )}
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="dados" className="w-full">
          <div className="px-6 pt-4 border-b bg-gray-50/50 rounded-t-lg">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dados">Dados do Fornecedor</TabsTrigger>
              <TabsTrigger value="historico">Histórico de Compras</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dados" className="m-0">
            <CardContent className="space-y-6 pt-6">
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
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="historico" className="m-0">
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Label className="text-lg font-bold text-[#5C3D8F]">Histórico de Compras</Label>
                  <p className="text-sm text-muted-foreground">Registre os produtos comprados, quantidades, valores, datas e forma de pagamento.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddProduct}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Compra
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center p-8 border border-dashed rounded-md bg-gray-50/50">
                  Nenhum registro de compra. Clique em "Adicionar Compra" para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((prod, index) => (
                    <div key={prod.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 border rounded-md relative group">
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Produto/Insumo *</Label>
                        <Input 
                          required 
                          value={prod.product_name || ''} 
                          onChange={e => handleProductChange(index, 'product_name', e.target.value)}
                          className="h-9 text-sm bg-white"
                          placeholder="Ex: Acrílico 2mm"
                        />
                      </div>
                      
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Quantidade</Label>
                        <Input 
                          type="number"
                          min="1"
                          value={prod.quantity || ''} 
                          onChange={e => handleProductChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="h-9 text-sm bg-white"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Valor Unit/Total (R$)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={prod.price || ''} 
                          onChange={e => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                          className="h-9 text-sm bg-white"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Data da Compra</Label>
                        <Input 
                          type="date"
                          value={prod.purchase_date || ''} 
                          onChange={e => handleProductChange(index, 'purchase_date', e.target.value)}
                          className="h-9 text-sm bg-white"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Forma Pagto</Label>
                        <Select 
                          value={prod.payment_method || ''} 
                          onValueChange={val => handleProductChange(index, 'payment_method', val)}
                        >
                          <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                            <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-11 space-y-1 mt-1">
                        <Label className="text-xs font-semibold text-gray-700">Observações adicionais</Label>
                        <Input 
                          value={prod.notes || ''} 
                          onChange={e => handleProductChange(index, 'notes', e.target.value)}
                          className="h-9 text-sm bg-white"
                          placeholder="Detalhes sobre cores, qualidade, prazo acordado..."
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end justify-center pb-0.5 mt-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveProduct(index)}
                          title="Remover Compra"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-between border-t p-6 mt-4">
          <div>
            {initialData?.id && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteSupplier}
                disabled={loading}
              >
                Excluir Fornecedor
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => isModal && onCancel ? onCancel() : router.push('/suppliers')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
