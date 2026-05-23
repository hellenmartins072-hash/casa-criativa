'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Supplier, createSupplier, updateSupplier } from '@/lib/api/suppliers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface SupplierFormProps {
  initialData?: Supplier
}

export function SupplierForm({ initialData }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (initialData?.id) {
        await updateSupplier(initialData.id, formData)
      } else {
        await createSupplier(formData)
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
