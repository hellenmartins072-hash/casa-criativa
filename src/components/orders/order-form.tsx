'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Order, OrderItem, createOrder, updateOrder } from '@/lib/api/orders'
import { getClients } from '@/lib/api/clients'
import { getCompanies } from '@/lib/api/companies'
import { getActiveProducts, type Product } from '@/lib/api/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Printer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface OrderFormProps {
  initialData?: Order
}

export function OrderForm({ initialData }: OrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  
  // Dados de suporte
  const [clients, setClients] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Formulário Principal
  const [formData, setFormData] = useState<Partial<Order>>(
    initialData || {
      status: 'Orçamento',
      client_id: '',
      company_id: '',
      payment_method: null,
      payment_status: 'Pendente',
      notes: '',
      deadline: '',
      discount_amount: 0,
      shipping_cost: 0,
      total_amount: 0
    }
  )

  // Itens do Pedido
  const [items, setItems] = useState<OrderItem[]>(
    initialData?.items || []
  )

  useEffect(() => {
    async function loadSupportData() {
      try {
        const [cliData, compData, prodData] = await Promise.all([
          getClients(),
          getCompanies(),
          getActiveProducts()
        ])
        setClients(cliData || [])
        setCompanies(compData || [])
        setProducts(prodData || [])
      } catch (err) {
        console.error('Error loading support data', err)
      } finally {
        setLoadingData(false)
      }
    }
    loadSupportData()
  }, [])

  // Recalcula o total sempre que os itens ou os valores auxiliares mudarem
  useEffect(() => {
    const itemsTotal = items.reduce((acc, item) => acc + Number(item.total_price || 0), 0)
    const discount = Number(formData.discount_amount || 0)
    const shipping = Number(formData.shipping_cost || 0)
    
    const grandTotal = itemsTotal - discount + shipping
    setFormData(prev => ({ ...prev, total_amount: grandTotal > 0 ? grandTotal : 0 }))
  }, [items, formData.discount_amount, formData.shipping_cost])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setFormData({ ...formData, [e.target.name]: isNaN(val) ? 0 : val })
  }

  const handleSelectChange = (name: string, value: string) => {
    if (value === 'none') {
      setFormData({ ...formData, [name]: null })
    } else {
      // Se selecionar um cliente, apaga a empresa, e vice-versa
      if (name === 'client_id') {
        setFormData({ ...formData, client_id: value, company_id: null })
      } else if (name === 'company_id') {
        setFormData({ ...formData, company_id: value, client_id: null })
      } else {
        setFormData({ ...formData, [name]: value })
      }
    }
  }

  // --- Funções de Itens ---
  const addItem = () => {
    setItems([...items, { product_id: null, product_name: '', quantity: 1, unit_price: 0, total_price: 0, notes: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    let item = { ...newItems[index], [field]: value }

    // Se o produto for alterado, puxa o nome e o preço base (Varejo por padrão)
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value)
      if (selectedProduct) {
        item.product_name = selectedProduct.name
        // Logica simples: se for cliente PF usa preço Varejo, se for empresa usa preço Revenda
        const suggestedPrice = formData.company_id ? selectedProduct.price_resale : selectedProduct.price_retail
        item.unit_price = suggestedPrice || 0
      }
    }

    // Recalcula o total da linha
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
      item.total_price = Number(item.quantity) * Number(item.unit_price)
    }

    newItems[index] = item
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validations
    if (!formData.client_id && !formData.company_id) {
      setError('Selecione um Cliente ou Empresa.')
      setLoading(false)
      return
    }

    if (items.length === 0) {
      setError('Adicione pelo menos um item ao pedido.')
      setLoading(false)
      return
    }

    for (const item of items) {
      if (!item.product_name) {
        setError('Existem itens com o nome/produto vazio.')
        setLoading(false)
        return
      }
    }

    try {
      if (initialData?.id) {
        await updateOrder(initialData.id, formData, items)
      } else {
        await createOrder(formData, items)
      }
      router.push('/orders')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      const errorMsg = err?.message || err?.details || err?.hint || JSON.stringify(err)
      setError(`Erro do Banco: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <Card className="max-w-5xl mx-auto shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
        <div>
          <CardTitle className="text-2xl text-[#5C3D8F]">
            {initialData ? `Pedido #${initialData.order_number}` : 'Novo Orçamento'}
          </CardTitle>
          <CardDescription>
            {initialData ? 'Edite os dados e acompanhe o status.' : 'Preencha os dados do cliente e os itens.'}
          </CardDescription>
        </div>
        {initialData && (
          <div className="flex items-center gap-2">
             <Button variant="outline" onClick={() => window.open(`/orders/${initialData.id}/pdf`, '_blank')}>
                <Printer className="mr-2 h-4 w-4" /> PDF
             </Button>
             <Badge className="text-lg py-1 px-4">{formData.status}</Badge>
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          {error && <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>}

          {/* Seção do Cliente e Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-lg">Vínculo do Cliente</h3>
              <div className="space-y-2">
                <Label>Cliente (Pessoa Física)</Label>
                <select
                  value={formData.client_id || 'none'}
                  onChange={(e) => handleSelectChange('client_id', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="none">-- Nenhum --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="text-center text-sm text-muted-foreground">- OU -</div>
              <div className="space-y-2">
                <Label>Empresa (B2B)</Label>
                <select
                  value={formData.company_id || 'none'}
                  onChange={(e) => handleSelectChange('company_id', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="none">-- Nenhuma --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-lg">Detalhes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status do Pedido</Label>
                  <select
                    value={formData.status || 'Orçamento'}
                    onChange={(e) => handleSelectChange('status', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="Orçamento">Orçamento</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Em Produção">Em Produção</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo / Entrega</Label>
                  <Input 
                    type="date" 
                    name="deadline" 
                    value={formData.deadline ? formData.deadline.substring(0, 10) : ''} 
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pagamento</Label>
                  <select
                    value={formData.payment_method || 'none'}
                    onChange={(e) => handleSelectChange('payment_method', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="none">-- Não definido --</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de crédito">Cartão de crédito</option>
                    <option value="Cartão de débito">Cartão de débito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status Pgto</Label>
                  <select
                    value={formData.payment_status || 'Pendente'}
                    onChange={(e) => handleSelectChange('payment_status', e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago Parcial">Pago Parcial</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Itens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Itens do Pedido</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground text-left">
                  <tr>
                    <th className="p-3 font-medium w-[40%]">Produto</th>
                    <th className="p-3 font-medium w-[15%]">Qtd</th>
                    <th className="p-3 font-medium w-[20%]">Preço Un. (R$)</th>
                    <th className="p-3 font-medium w-[20%]">Total (R$)</th>
                    <th className="p-3 font-medium w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum item adicionado.</td></tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index} className="bg-white">
                        <td className="p-2 align-top">
                          <select
                            value={item.product_id || 'custom'}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value === 'custom' ? null : e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mb-2"
                          >
                            <option value="custom">-- Item Customizado --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <Input 
                            placeholder="Nome / Descrição do item"
                            value={item.product_name || ''}
                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                            required
                          />
                          <Input 
                            placeholder="Obs. (Ex: Nome João)"
                            className="mt-2 text-xs"
                            value={item.notes || ''}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <Input 
                            type="number" min="1" step="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <Input 
                            type="number" min="0" step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <Input 
                            type="number" readOnly
                            value={item.total_price}
                            className="bg-gray-50 font-semibold"
                          />
                        </td>
                        <td className="p-2 align-top text-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fechamento / Totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Observações Gerais do Pedido</Label>
              <Textarea 
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
                placeholder="Anotações internas ou regras da entrega..."
              />
            </div>
            
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center text-sm">
                <span>Subtotal Itens:</span>
                <span>R$ {items.reduce((acc, item) => acc + Number(item.total_price || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Descontos (-):</span>
                <Input 
                  type="number" name="discount_amount" step="0.01"
                  value={formData.discount_amount} onChange={handleNumberChange}
                  className="w-24 h-8 text-right bg-white"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Frete (+):</span>
                <Input 
                  type="number" name="shipping_cost" step="0.01"
                  value={formData.shipping_cost} onChange={handleNumberChange}
                  className="w-24 h-8 text-right bg-white"
                />
              </div>
              <div className="pt-3 border-t flex justify-between items-center font-bold text-xl text-[#5C3D8F]">
                <span>TOTAL:</span>
                <span>R$ {Number(formData.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/orders')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Pedido
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
