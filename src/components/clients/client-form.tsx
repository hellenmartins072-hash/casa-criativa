'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Client, createClient, updateClient } from '@/lib/api/clients'
import { getStores, Store } from '@/lib/api/stores'
import { getCompanies, Company } from '@/lib/api/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useEffect } from 'react'

interface ClientFormProps {
  initialData?: Client
  isModal?: boolean
  onSuccess?: (client: Client) => void
  onCancel?: () => void
}

export function ClientForm({ initialData, isModal, onSuccess, onCancel }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [companies, setCompanies] = useState<Company[]>([])

  const [formData, setFormData] = useState<Partial<Client>>(
    initialData || {
      full_name: '',
      whatsapp: '',
      email: '',
      cpf: '',
      address: '',
      client_type: 'Varejo',
      status: 'Ativo',
      preferred_payment: 'PIX',
      store_ids: [],
      internal_alert: '',
    }
  )

  useEffect(() => {
    async function loadData() {
      try {
        const [storesData, companiesData] = await Promise.all([
          getStores(),
          getCompanies()
        ])
        setStores(storesData || [])
        setCompanies(companiesData || [])
      } catch (err) {
        console.error('Error loading data:', err)
      }
    }
    loadData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleStoreToggle = (storeId: string) => {
    const currentStores = formData.store_ids || []
    if (currentStores.includes(storeId)) {
      setFormData({ ...formData, store_ids: currentStores.filter(id => id !== storeId) })
    } else {
      setFormData({ ...formData, store_ids: [...currentStores, storeId] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let savedClient;
      if (initialData?.id) {
        savedClient = await updateClient(initialData.id, formData)
      } else {
        savedClient = await createClient(formData)
      }
      
      if (isModal && onSuccess) {
        onSuccess(savedClient || formData as Client)
      } else {
        router.push('/clients')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o cliente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={isModal ? "border-0 shadow-none w-full" : "max-w-3xl mx-auto"}>
      {!isModal && (
        <CardHeader>
          <CardTitle>{initialData ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
          <CardDescription>
            Preencha os dados do cliente abaixo. Os campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
      )}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          {formData.internal_alert && formData.internal_alert.trim() !== '' && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900">Alerta Interno</h4>
                <p className="text-sm">{formData.internal_alert}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleChange}
                required
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
                placeholder="@usuario"
                value={formData.instagram || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf || ''}
                onChange={handleChange}
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

            <div className="space-y-2">
              <Label htmlFor="client_type">Tipo de Cliente</Label>
              <Select
                value={formData.client_type}
                onValueChange={(val) => handleSelectChange('client_type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Varejo">Varejo</SelectItem>
                  <SelectItem value="Revenda">Revenda</SelectItem>
                  <SelectItem value="Corporativo">Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_id">Empresa B2B Vinculada (Opcional)</Label>
              <Select
                value={formData.company_id || 'none'}
                onValueChange={(val) => handleSelectChange('company_id', val === 'none' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Nenhuma --</SelectItem>
                  {companies.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>{comp.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2 pt-2 pb-2">
              <Label className="text-base font-semibold">Lojas / Nichos Vinculados da Casa Criativa</Label>
              {stores.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Nenhuma loja cadastrada. Vá em "Lojas e Perfis" no menu para cadastrar suas empresas.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {stores.map(store => (
                    <div key={store.id} className="flex items-center space-x-2 bg-muted/20 p-2 rounded-md border">
                      <Checkbox
                        id={`store-${store.id}`}
                        checked={(formData.store_ids || []).includes(store.id)}
                        onCheckedChange={() => handleStoreToggle(store.id)}
                      />
                      <Label 
                        htmlFor={`store-${store.id}`} 
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {store.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleSelectChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Despedido">Despedido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_payment">Forma de Pagamento Preferida</Label>
              <Select
                value={formData.preferred_payment || ''}
                onValueChange={(val) => handleSelectChange('preferred_payment', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                  <SelectItem value="Cartão de débito">Cartão de débito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Aniversário</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="internal_alert" className="text-red-600 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Aviso Interno (Invisível ao Cliente)
              </Label>
              <Input
                id="internal_alert"
                name="internal_alert"
                value={formData.internal_alert || ''}
                onChange={handleChange}
                className="border-red-200 focus-visible:ring-red-500 placeholder:text-red-300"
                placeholder="Ex: Cliente problemático, inadimplente. Ficará em destaque no topo da ficha."
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => isModal && onCancel ? onCancel() : router.push('/clients')}
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
