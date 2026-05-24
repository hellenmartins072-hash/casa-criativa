'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { 
  OutsourcedService, 
  getOrderOutsourcedServices, 
  createOutsourcedService, 
  updateOutsourcedService, 
  deleteOutsourcedService 
} from '@/lib/api/orders'
import { getSuppliers } from '@/lib/api/suppliers'

export function OutsourcedServicesList({ orderId }: { orderId: string }) {
  const [services, setServices] = useState<OutsourcedService[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State form for new/edit
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<OutsourcedService>>({
    description: '',
    cost: 0,
    status: 'Aguardando envio',
    supplier_id: 'none',
    sent_date: '',
    expected_return_date: ''
  })

  useEffect(() => {
    async function load() {
      try {
        const [servicesData, suppliersData] = await Promise.all([
          getOrderOutsourcedServices(orderId),
          getSuppliers()
        ])
        setServices(servicesData)
        setSuppliers(suppliersData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  const openNewForm = () => {
    setEditingId(null)
    setFormData({
      description: '',
      cost: 0,
      status: 'Aguardando envio',
      supplier_id: 'none',
      sent_date: '',
      expected_return_date: ''
    })
    setIsFormOpen(true)
  }

  const openEditForm = (service: OutsourcedService) => {
    setEditingId(service.id)
    setFormData({
      description: service.description,
      cost: service.cost,
      status: service.status,
      supplier_id: service.supplier_id || 'none',
      sent_date: service.sent_date || '',
      expected_return_date: service.expected_return_date || ''
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload = {
      ...formData,
      order_id: orderId,
      supplier_id: formData.supplier_id === 'none' ? null : formData.supplier_id,
      sent_date: formData.sent_date || null,
      expected_return_date: formData.expected_return_date || null
    }

    try {
      if (editingId) {
        await updateOutsourcedService(editingId, payload)
      } else {
        await createOutsourcedService(payload)
      }
      
      // Reload list
      const updatedList = await getOrderOutsourcedServices(orderId)
      setServices(updatedList)
      setIsFormOpen(false)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar serviço")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este serviço terceirizado?")) {
      try {
        await deleteOutsourcedService(id)
        setServices(services.filter(s => s.id !== id))
      } catch (err) {
        console.error(err)
        alert("Erro ao excluir serviço")
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Recebido': return 'bg-green-500'
      case 'Problema': return 'bg-red-500'
      case 'Aguardando envio': return 'bg-gray-400'
      default: return 'bg-blue-500'
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando serviços...</div>

  return (
    <Card className="max-w-4xl mx-auto mt-6 border-blue-100 shadow-sm">
      <CardHeader className="bg-blue-50/50 pb-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-blue-900">Serviços Terceirizados</CardTitle>
            <CardDescription>Gerencie gráficas, bordadeiras ou serviços externos vinculados a este pedido.</CardDescription>
          </div>
          {!isFormOpen && (
            <Button onClick={openNewForm} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Serviço
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 border rounded-lg space-y-4">
            <h4 className="font-semibold text-sm uppercase text-gray-500 mb-2">
              {editingId ? 'Editar Serviço' : 'Novo Serviço Externo'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descrição do Serviço *</Label>
                <Input 
                  required 
                  placeholder="Ex: Impressão Offset 1000un"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor / Parceiro</Label>
                <Select value={formData.supplier_id || 'none'} onValueChange={v => setFormData({...formData, supplier_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Sem fornecedor vinculado --</SelectItem>
                    {suppliers.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                    {formData.supplier_id && formData.supplier_id !== 'none' && !suppliers.find(s => s.id === formData.supplier_id) && (
                      <SelectItem value={formData.supplier_id}>Fornecedor Oculto/Excluído ({formData.supplier_id.substring(0,8)})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custo do Serviço (R$)</Label>
                <Input 
                  type="number" step="0.01" min="0"
                  value={formData.cost}
                  onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                />
                <p className="text-[10px] text-muted-foreground">O valor será lançado como Despesa ao marcar como "Recebido".</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aguardando envio">Aguardando envio</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Em produção parceiro">Em produção parceiro</SelectItem>
                    <SelectItem value="Recebido">Recebido</SelectItem>
                    <SelectItem value="Problema">Problema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Envio</Label>
                <Input 
                  type="date"
                  value={formData.sent_date || ''}
                  onChange={e => setFormData({...formData, sent_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Previsão de Retorno</Label>
                <Input 
                  type="date"
                  value={formData.expected_return_date || ''}
                  onChange={e => setFormData({...formData, expected_return_date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Serviço
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {services.length === 0 && !isFormOpen && (
             <p className="text-center text-sm text-muted-foreground py-6">Nenhum serviço terceirizado para este pedido.</p>
          )}
          {services.map(service => (
            <div key={service.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border rounded-lg hover:bg-gray-50">
              <div className="space-y-1">
                <p className="font-medium text-sm">{service.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {service.suppliers?.name && <span>Parceiro: {service.suppliers.name}</span>}
                  <span>Custo: R$ {Number(service.cost).toFixed(2)}</span>
                  {service.expected_return_date && <span>Retorno: {new Date(service.expected_return_date).toLocaleDateString('pt-BR')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 md:mt-0">
                <Badge className={`${getStatusColor(service.status)} hover:${getStatusColor(service.status)}`}>
                  {service.status}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(service)}>
                    <Edit className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
