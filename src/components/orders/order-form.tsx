'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Order, OrderItem, createOrder, updateOrder } from '@/lib/api/orders'
import { getClients, createClient } from '@/lib/api/clients'
import { getCompanies, createCompany } from '@/lib/api/companies'
import { getShippingPartners, type ShippingPartner } from '@/lib/api/shipping'
import { getOrderChecklist, createChecklistStep, toggleChecklistStep, deleteChecklistStep, getOrderReworks, registerRework, deleteRework, type OrderChecklist, type OrderRework } from '@/lib/api/operations'
import { generateWhatsAppBudgetScript, getCouponByCode } from '@/lib/api/marketing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Printer, MessageCircle, History, FileSignature, Copy } from 'lucide-react'
import { ClientTimeline } from '@/components/crm/client-timeline'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { ClientForm } from '@/components/clients/client-form'
import { CompanyForm } from '@/components/companies/company-form'

interface OrderFormProps {
  initialData?: Order
}

export function OrderForm({ initialData }: OrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [error, setError] = useState('')
  
  // Dados de suporte
  const [clients, setClients] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [shippingPartners, setShippingPartners] = useState<ShippingPartner[]>([])

  // Modal Novo Cliente
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)

  // Modal Nova Empresa
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false)

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
      credit_installments: 1,
      credit_fee: 0,
      entry_date: '',
      final_payment_date: '',
      delivery_date: '',
      shipping_partner_id: null,
      out_of_state_shipping: false,
      total_amount: 0,
      payment_notes: ''
    }
  )

  // Itens do Pedido
  const [items, setItems] = useState<OrderItem[]>(
    initialData?.items || []
  )

  // Operações (Checklist & Rework)
  const [checklist, setChecklist] = useState<OrderChecklist[]>([])
  const [newChecklistStep, setNewChecklistStep] = useState('')
  const [reworks, setReworks] = useState<OrderRework[]>([])
  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false)
  const [newRework, setNewRework] = useState({ reason: '', extra_cost: 0 })

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  useEffect(() => {
    async function loadSupportData() {
      try {
        const [cliData, compData, prodData, shipData] = await Promise.all([
          getClients(),
          getCompanies(),
          getActiveProducts(),
          getShippingPartners()
        ])
        setClients(cliData || [])
        setCompanies(compData || [])
        setProducts(prodData || [])
        setShippingPartners(shipData || [])
        if (initialData?.id) {
          const [checkData, reworkData] = await Promise.all([
            getOrderChecklist(initialData.id),
            getOrderReworks(initialData.id)
          ])
          setChecklist(checkData || [])
          setReworks(reworkData || [])
        }
      } catch (err) {
        console.error('Error loading support data', err)
      } finally {
        setLoadingData(false)
      }
    }
    loadSupportData()
  }, [initialData?.id])

  // Recalcula o total sempre que os itens ou os valores auxiliares mudarem
  useEffect(() => {
    const itemsTotal = items.reduce((acc, item) => acc + Number(item.total_price || 0), 0)
    const discount = Number(formData.discount_amount || 0)
    const shipping = Number(formData.shipping_cost || 0)
    const creditFee = Number(formData.credit_fee || 0)
    
    const grandTotal = itemsTotal - discount + shipping + creditFee
    setFormData(prev => ({ ...prev, total_amount: grandTotal > 0 ? grandTotal : 0 }))
  }, [items, formData.discount_amount, formData.shipping_cost, formData.credit_fee])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
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

  const handleSendWhatsApp = async () => {
    if (!initialData?.id) return
    
    // Find client phone
    let targetPhone = ''
    let clientName = ''
    if (formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id)
      if (client) {
        targetPhone = client.whatsapp || ''
        clientName = client.full_name || ''
      }
    } else if (formData.company_id) {
      const comp = companies.find(c => c.id === formData.company_id)
      if (comp) {
        targetPhone = comp.phone || ''
        clientName = comp.business_name || ''
      }
    }

    if (!targetPhone) {
      alert('Não foi possível encontrar um número de WhatsApp (ou Telefone) para o cliente/empresa selecionado.')
      return
    }

    if (confirm(`Deseja enviar uma notificação de status (${formData.status}) para o WhatsApp ${targetPhone}?`)) {
      setSendingWhatsApp(true)
      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: initialData.id,
            status: formData.status,
            targetPhone,
            clientName,
            orderNumber: initialData.order_number || ''
          })
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error + (data.details ? ` - ${JSON.stringify(data.details)}` : ''))
        }
        alert('Notificação enviada com sucesso!')
      } catch (err: any) {
        alert(`Erro ao enviar notificação: ${err.message}`)
      } finally {
        setSendingWhatsApp(false)
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

  // --- Checklist Handlers ---
  const handleAddChecklist = async () => {
    if (!initialData?.id || !newChecklistStep.trim()) return
    try {
      const step = await createChecklistStep({ order_id: initialData.id, step_name: newChecklistStep.trim() })
      if (step) {
        setChecklist([...checklist, step])
        setNewChecklistStep('')
      }
    } catch (err) {
      alert("Erro ao adicionar etapa.")
    }
  }

  const handleToggleChecklist = async (id: string, is_completed: boolean) => {
    try {
      await toggleChecklistStep(id, is_completed)
      setChecklist(checklist.map(c => c.id === id ? { ...c, is_completed } : c))
    } catch (err) {
      alert("Erro ao atualizar etapa.")
    }
  }

  const handleDeleteChecklist = async (id: string) => {
    try {
      await deleteChecklistStep(id)
      setChecklist(checklist.filter(c => c.id !== id))
    } catch (err) {
      alert("Erro ao excluir etapa.")
    }
  }

  // --- Rework Handlers ---
  const handleAddRework = async () => {
    if (!initialData?.id || !newRework.reason.trim()) return
    try {
      const rw = await registerRework({ 
        order_id: initialData.id, 
        reason: newRework.reason.trim(), 
        extra_cost: newRework.extra_cost 
      })
      if (rw) {
        setReworks([...reworks, rw])
        setNewRework({ reason: '', extra_cost: 0 })
        setIsReworkModalOpen(false)
      }
    } catch (err) {
      alert("Erro ao registrar retrabalho.")
    }
  }

  const handleDeleteRework = async (id: string) => {
    if (!confirm("Remover este registro de retrabalho?")) return
    try {
      await deleteRework(id)
      setReworks(reworks.filter(r => r.id !== id))
    } catch (err) {
      alert("Erro ao remover retrabalho.")
    }
  }

  // --- Coupon Handlers ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const coupon = await getCouponByCode(couponCode.trim())
      if (coupon) {
        setAppliedCoupon(coupon)
        
        // Calcular desconto
        const itemsTotal = items.reduce((acc, item) => acc + Number(item.total_price || 0), 0)
        const discountAmount = (itemsTotal * (coupon.discount_percent / 100))
        setFormData(prev => ({ ...prev, discount_amount: discountAmount }))
        
        alert(`Cupom aplicado! ${coupon.discount_percent}% de desconto.`)
      } else {
        alert('Cupom inválido, expirado ou inativo.')
        setAppliedCoupon(null)
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao verificar cupom.')
    }
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
      let finalFormData = { ...formData }
      if (finalFormData.client_id === '') finalFormData.client_id = null
      if (finalFormData.company_id === '') finalFormData.company_id = null

      if (initialData?.id) {
        await updateOrder(initialData.id, finalFormData, items)
      } else {
        await createOrder(finalFormData, items)
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
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Vínculo do Cliente</h3>
                {(formData.client_id || formData.company_id) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-8 text-[#5C3D8F] border-[#5C3D8F]">
                        <History className="h-4 w-4 mr-2" /> Histórico CRM
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Histórico de Conversas</DialogTitle>
                      </DialogHeader>
                      <ClientTimeline 
                        clientId={formData.client_id || undefined} 
                        companyId={formData.company_id || undefined} 
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="space-y-2">
                <Label>Cliente (Pessoa Física)</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.client_id || 'none'}
                    onChange={(e) => handleSelectChange('client_id', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="none">-- Nenhum --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewClientModalOpen(true)} title="Novo Cliente">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">- OU -</div>
              <div className="space-y-2">
                <Label>Empresa (B2B)</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.company_id || 'none'}
                    onChange={(e) => handleSelectChange('company_id', e.target.value)}
                    className="flex h-9 flex-1 rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="none">-- Nenhuma --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.business_name}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewCompanyModalOpen(true)} title="Nova Empresa">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="font-semibold text-lg">Detalhes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status do Pedido</Label>
                  <div className="flex gap-2">
                    <select
                      value={formData.status || 'Orçamento'}
                      onChange={(e) => handleSelectChange('status', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="Orçamento">Orçamento</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Em Produção">Em Produção</option>
                      <option value="Finalizado">Finalizado / Pronto</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                    {initialData?.id && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 shrink-0 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50"
                        title="Notificar Cliente via WhatsApp sobre o Status atual"
                        onClick={handleSendWhatsApp}
                        disabled={sendingWhatsApp}
                      >
                        {sendingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Prazo Previsto</Label>
                  <Input 
                    type="date" 
                    name="deadline" 
                    value={formData.deadline ? formData.deadline.substring(0, 10) : ''} 
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entrega Realizada</Label>
                  <Input 
                    type="date" 
                    name="delivery_date" 
                    value={formData.delivery_date ? formData.delivery_date.substring(0, 10) : ''} 
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
                <div className="space-y-2">
                  <Label>Data Entrada (Ex: 50%)</Label>
                  <Input 
                    type="date" 
                    name="entry_date" 
                    value={formData.entry_date ? formData.entry_date.substring(0, 10) : ''} 
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Pagto Final</Label>
                  <Input 
                    type="date" 
                    name="final_payment_date" 
                    value={formData.final_payment_date ? formData.final_payment_date.substring(0, 10) : ''} 
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Detalhes de Parcelamento / Pagamento</Label>
                  <Textarea 
                    name="payment_notes"
                    value={formData.payment_notes || ''}
                    onChange={handleChange}
                    placeholder="Ex: Entrada 50% via PIX em 10/10, mais R$ 200 em 15/10 e o restante na entrega."
                    className="bg-white min-h-[60px]"
                  />
                </div>
              </div>

              {formData.payment_method?.includes('Cartão') && (
                <div className="mt-4 p-3 border border-[#5C3D8F]/20 bg-[#5C3D8F]/5 rounded-md grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade de Parcelas</Label>
                    <Input 
                      type="number" min="1" max="24"
                      name="credit_installments"
                      value={formData.credit_installments || 1}
                      onChange={handleNumberChange}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa do Cartão (R$)</Label>
                    <Input 
                      type="number" step="0.01" min="0"
                      name="credit_fee"
                      value={formData.credit_fee || 0}
                      onChange={handleNumberChange}
                      className="bg-white"
                    />
                  </div>
                </div>
              )}
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

          {/* Qualidade e Produção (Apenas para pedidos já salvos) */}
          {initialData?.id && (
            <div className="space-y-4 pt-4 border-t border-dashed">
              <h3 className="font-semibold text-lg text-[#5C3D8F]">Qualidade e Produção</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Checklist */}
                <div className="border rounded-md p-4 bg-gray-50/50">
                  <h4 className="font-medium mb-3 text-sm flex items-center">
                    Checklist de Produção
                  </h4>
                  <div className="space-y-2 mb-4">
                    {checklist.map(step => (
                      <div key={step.id} className="flex items-center justify-between p-2 bg-white border rounded">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={step.is_completed}
                            onChange={(e) => handleToggleChecklist(step.id, e.target.checked)}
                            className="rounded border-gray-300 w-4 h-4 text-[#5C3D8F]"
                          />
                          <span className={`text-sm ${step.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {step.step_name}
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteChecklist(step.id)}>
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    ))}
                    {checklist.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada.</p>}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nova etapa..." 
                      value={newChecklistStep} 
                      onChange={e => setNewChecklistStep(e.target.value)}
                      className="h-8 text-sm bg-white"
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          e.preventDefault()
                          handleAddChecklist()
                        }
                      }}
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddChecklist}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Retrabalhos */}
                <div className="border rounded-md p-4 bg-red-50/30">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm flex items-center text-red-700">
                      Registro de Retrabalhos
                    </h4>
                    <Dialog open={isReworkModalOpen} onOpenChange={setIsReworkModalOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
                          <Plus className="mr-1 h-3 w-3" /> Registrar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Retrabalho</DialogTitle>
                          <DialogDescription>
                            Anote o motivo e o custo extra envolvido (se houver). Isso não afeta o valor cobrado do cliente, apenas os seus custos internos.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Motivo do Retrabalho</Label>
                            <Input 
                              placeholder="Ex: Peça arranhou no polimento"
                              value={newRework.reason}
                              onChange={e => setNewRework({...newRework, reason: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Custo Extra Estimado (R$)</Label>
                            <Input 
                              type="number" step="0.01" min="0"
                              value={newRework.extra_cost}
                              onChange={e => setNewRework({...newRework, extra_cost: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <Button type="button" className="w-full bg-red-600 hover:bg-red-700" onClick={handleAddRework}>
                            Salvar Retrabalho
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2">
                    {reworks.map(r => (
                      <div key={r.id} className="p-2 bg-white border border-red-100 rounded text-sm relative group">
                        <div className="font-medium text-red-800">{r.reason}</div>
                        <div className="text-xs text-muted-foreground flex justify-between mt-1">
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          {Number(r.extra_cost) > 0 && <span className="text-red-600 font-semibold">Custo: R$ {r.extra_cost}</span>}
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100" 
                          onClick={() => handleDeleteRework(r.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    ))}
                    {reworks.length === 0 && <p className="text-xs text-muted-foreground">Nenhum retrabalho registrado.</p>}
                  </div>
                </div>

              </div>
            </div>
          )}

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
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span>Cupom de Indicação:</span>
                <div className="flex gap-1 w-48">
                  <Input 
                    placeholder="Ex: MARIA10" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)}
                    className="h-8 text-xs uppercase"
                  />
                  <Button type="button" size="sm" variant="secondary" className="h-8" onClick={handleApplyCoupon}>Aplicar</Button>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Subtotal Itens:</span>
                <span>R$ {items.reduce((acc, item) => acc + Number(item.total_price || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Descontos (-):</span>
                <div className="flex items-center gap-2">
                  {appliedCoupon && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 text-[10px]">CUPOM: {appliedCoupon.code}</Badge>}
                  <Input 
                    type="number" name="discount_amount" step="0.01"
                    value={formData.discount_amount} onChange={handleNumberChange}
                    className="w-24 h-8 text-right bg-white"
                  />
                </div>
              </div>

              <div className="border-t pt-3 pb-2 mt-2 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Configurações de Frete</div>
                <div className="flex gap-2 items-center">
                  <select
                    value={formData.shipping_partner_id || 'none'}
                    onChange={(e) => handleSelectChange('shipping_partner_id', e.target.value)}
                    className="flex h-8 flex-1 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="none">Retirada / Sem frete especial</option>
                    {shippingPartners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      name="out_of_state_shipping" 
                      id="out_of_state"
                      checked={formData.out_of_state_shipping || false} 
                      onChange={handleChange}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="out_of_state" className="text-xs cursor-pointer">Outro estado/cidade</Label>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Valor do Frete (+):</span>
                  <Input 
                    type="number" name="shipping_cost" step="0.01"
                    value={formData.shipping_cost} onChange={handleNumberChange}
                    className="w-24 h-8 text-right bg-white"
                  />
                </div>
              </div>

              {Number(formData.credit_fee) > 0 && (
                <div className="flex justify-between items-center text-sm text-red-600">
                  <span>Taxas Cartão (+):</span>
                  <span>R$ {Number(formData.credit_fee || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t flex justify-between items-center font-bold text-xl text-[#5C3D8F]">
                <span>TOTAL:</span>
                <span>R$ {Number(formData.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col md:flex-row justify-between p-4 md:p-6 bg-gray-50 border-t mt-6 gap-4">
          <div className="flex flex-wrap gap-2">
            {initialData?.id && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => {
                    const url = `${window.location.origin}/contract/${initialData.id}`
                    navigator.clipboard.writeText(url)
                    alert('Link do Contrato copiado para a área de transferência!')
                  }}
                >
                  <FileSignature className="mr-2 h-4 w-4" /> Link do Contrato
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => {
                    // Montar um "mock" temporário com as infos carregadas pra passar pro gerador
                    const mockOrder = {
                      ...formData,
                      id: initialData.id,
                      items,
                      clients: clients.find(c => c.id === formData.client_id),
                      companies: companies.find(c => c.id === formData.company_id)
                    }
                    const text = generateWhatsAppBudgetScript(mockOrder)
                    navigator.clipboard.writeText(text)
                    alert('Texto do orçamento copiado! Agora é só colar no WhatsApp.')
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copiar Orçamento p/ WhatsApp
                </Button>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
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
              Salvar
            </Button>
          </div>
        </CardFooter>
      </form>

      {/* Modal de Novo Cliente */}
      <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm 
            isModal 
            onSuccess={(client) => {
              setClients(prev => [client, ...prev])
              setFormData(prev => ({ ...prev, client_id: client.id, company_id: null }))
              setIsNewClientModalOpen(false)
            }} 
            onCancel={() => setIsNewClientModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Empresa */}
      <Dialog open={isNewCompanyModalOpen} onOpenChange={setIsNewCompanyModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>
          <CompanyForm 
            isModal 
            onSuccess={(company) => {
              setCompanies(prev => [company, ...prev])
              setFormData(prev => ({ ...prev, company_id: company.id, client_id: null }))
              setIsNewCompanyModalOpen(false)
            }} 
            onCancel={() => setIsNewCompanyModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
