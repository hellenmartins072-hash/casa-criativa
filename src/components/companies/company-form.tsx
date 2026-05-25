'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Company, createCompany, updateCompany, deleteCompany, createCompanyContact, updateCompanyContact, deleteCompanyContact, type CompanyContact } from '@/lib/api/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { ClientTimeline } from '@/components/crm/client-timeline'
import { Checkbox } from '@/components/ui/checkbox'

interface CompanyFormProps {
  initialData?: Company
  isModal?: boolean
  onSuccess?: (company: Company) => void
  onCancel?: () => void
}

export function CompanyForm({ initialData, isModal, onSuccess, onCancel }: CompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [contacts, setContacts] = useState<Partial<CompanyContact>[]>(initialData?.contacts || [])
  const [deletedContacts, setDeletedContacts] = useState<string[]>([])

  const [formData, setFormData] = useState<Partial<Company>>(
    initialData || {
      business_name: '',
      trading_name: '',
      cnpj: '',
      phone: '',
      address: '',
      status: 'Ativo',
      payment_methods: [],
      boleto_only: false,
      boleto_days: 30
    }
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, boleto_only: checked })
  }

  const handleAddContact = () => {
    setContacts([...contacts, { name: '', phone: '', email: '', role: '' }])
  }

  const handleContactChange = (index: number, field: keyof CompanyContact, value: string) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    setContacts(newContacts)
  }

  const handleRemoveContact = (index: number) => {
    const contact = contacts[index]
    if (contact.id) {
      setDeletedContacts([...deletedContacts, contact.id])
    }
    const newContacts = [...contacts]
    newContacts.splice(index, 1)
    setContacts(newContacts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let companyId = initialData?.id
      // 1. Salvar Empresa (Removendo o array de contacts para não dar erro no Supabase na hora de salvar só a empresa)
      const payloadToSave = { ...formData }
      delete payloadToSave.contacts

      if (companyId) {
        await updateCompany(companyId, payloadToSave)
      } else {
        const newCompany = await createCompany(payloadToSave)
        companyId = newCompany.id
      }

      if (!companyId) throw new Error("Falha ao obter ID da empresa.")

      // 2. Apagar Contatos Removidos
      for (const id of deletedContacts) {
        await deleteCompanyContact(id)
      }

      // 3. Salvar / Atualizar Contatos
      for (const contact of contacts) {
        if (!contact.name) continue // ignora contatos vazios

        if (contact.id) {
          await updateCompanyContact(contact.id, contact)
        } else {
          await createCompanyContact({ ...contact, company_id: companyId })
        }
      }
      if (isModal && onSuccess) {
        // Fetch the full company to pass back if needed, or just pass the payload
        // Since we need the ID, and we have it:
        onSuccess({ ...payloadToSave, id: companyId } as Company)
      } else {
        router.push('/companies')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar a empresa.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!initialData?.id) return;
    if (window.confirm('Tem certeza que deseja excluir permanentemente esta empresa? Todos os contatos vinculados serão apagados.')) {
      try {
        setLoading(true)
        await deleteCompany(initialData.id)
        router.push('/companies')
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Erro ao excluir a empresa.')
        setLoading(false)
      }
    }
  }

  return (
    <>
    <Card className={isModal ? "border-0 shadow-none w-full" : "max-w-3xl mx-auto"}>
      {!isModal && (
        <CardHeader>
          <CardTitle>{initialData ? 'Editar Empresa' : 'Nova Empresa'}</CardTitle>
          <CardDescription>
            Preencha os dados da empresa (B2B) abaixo. Os campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
      )}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="business_name">Razão Social *</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trading_name">Nome Fantasia</Label>
              <Input
                id="trading_name"
                name="trading_name"
                value={formData.trading_name || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                value={formData.cnpj || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleChange}
                placeholder="@empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || ''}
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
  <Label>Formas de Pagamento Aceitas</Label>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
    {['PIX', 'Cartão de crédito', 'Cartão de débito', 'Transferência', 'Boleto', 'Dinheiro'].map(method => (
      <div key={method} className="flex items-center space-x-2 bg-muted/20 p-2 rounded-md border">
        <Checkbox
          id={`pay-${method}`}
          checked={(formData.payment_methods || []).includes(method)}
          onCheckedChange={(checked) => {
            const current = formData.payment_methods || [];
            const updated = checked ? [...current, method] : current.filter(m => m !== method);
            setFormData({ ...formData, payment_methods: updated });
          }}
        />
        <Label htmlFor={`pay-${method}`} className="text-sm cursor-pointer">{method}</Label>
      </div>
    ))}
  </div>
</div>
            
            <div className="space-y-2">
              <Label htmlFor="boleto_days">Prazo do Boleto (Dias)</Label>
              <Input
                id="boleto_days"
                name="boleto_days"
                type="number"
                value={formData.boleto_days || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex items-center space-x-2 md:col-span-2 mt-4 pt-2 border-t">
              <Checkbox 
                id="boleto_only" 
                checked={formData.boleto_only || false}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="boleto_only" className="font-normal cursor-pointer">
                Paga somente no boleto
              </Label>
            </div>
            
            {/* CONTATOS DA EMPRESA */}
            <div className="md:col-span-2 pt-4 border-t mt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg font-bold text-[#5C3D8F]">Contatos da Empresa</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Contato
                </Button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center p-4 border border-dashed rounded-md">
                  Nenhum contato cadastrado. Clique em "Adicionar Contato".
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={contact.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-gray-50 border rounded-md relative group">
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs">Nome *</Label>
                        <Input 
                          required 
                          value={contact.name || ''} 
                          onChange={e => handleContactChange(index, 'name', e.target.value)}
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs">Cargo / Setor</Label>
                        <Input 
                          value={contact.role || ''} 
                          onChange={e => handleContactChange(index, 'role', e.target.value)}
                          placeholder="Ex: Compras"
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs">Telefone</Label>
                        <Input 
                          value={contact.phone || ''} 
                          onChange={e => handleContactChange(index, 'phone', e.target.value)}
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">E-mail</Label>
                        <Input 
                          type="email"
                          value={contact.email || ''} 
                          onChange={e => handleContactChange(index, 'email', e.target.value)}
                          className="h-8 text-sm bg-white"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveContact(index)}
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
        <CardFooter className="flex justify-between items-center">
          <div>
            {initialData?.id && !isModal && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteCompany}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Excluir Empresa
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => isModal && onCancel ? onCancel() : router.push('/companies')}
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

    {/* HISTÓRICO DE CRM */}
    {initialData?.id && (
      <div className="mt-8">
        <ClientTimeline companyId={initialData.id} />
      </div>
    )}
    </>
  )
}
