'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Company, createCompany, updateCompany } from '@/lib/api/companies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface CompanyFormProps {
  initialData?: Company
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<Partial<Company>>(
    initialData || {
      business_name: '',
      trading_name: '',
      cnpj: '',
      phone: '',
      address: '',
      status: 'Ativo',
      payment_method: 'Boleto',
      boleto_only: false,
      boleto_days: 30,
    }
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, boleto_only: checked })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (initialData?.id) {
        await updateCompany(initialData.id, formData)
      } else {
        await createCompany(formData)
      }
      router.push('/companies')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar a empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Editar Empresa' : 'Nova Empresa'}</CardTitle>
        <CardDescription>
          Preencha os dados da empresa (B2B) abaixo. Os campos marcados com * são obrigatórios.
        </CardDescription>
      </CardHeader>
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
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select
                value={formData.payment_method || ''}
                onValueChange={(val) => handleSelectChange('payment_method', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex items-center space-x-2 md:col-span-2 mt-2">
              <Checkbox 
                id="boleto_only" 
                checked={formData.boleto_only || false}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="boleto_only" className="font-normal cursor-pointer">
                Paga somente no boleto
              </Label>
            </div>
            
            {/* Contatos poderiam ser Selects puxando da tabela de Clientes, mas por simplicidade não faremos isso neste formulário inicial sem uma API de busca com debounce */}

          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/companies')}
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
