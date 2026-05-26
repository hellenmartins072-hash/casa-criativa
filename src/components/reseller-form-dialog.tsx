'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createReseller, updateReseller, type Reseller } from "@/lib/api/resellers"
import { Loader2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ResellerFormDialog({ 
  initialData, 
  onSave, 
  triggerButton 
}: { 
  initialData?: Reseller, 
  onSave?: () => void,
  triggerButton?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<Partial<Reseller>>({
    full_name: "",
    document_number: "",
    phone: "",
    whatsapp: "",
    social_media: "",
    address: "",
    bank_details: "",
    notes: "",
    status: "Ativo",
    discount_percentage: 0,
    birth_date: "",
  })

  useEffect(() => {
    if (initialData && open) {
      setFormData(initialData)
    } else if (!open && !initialData) {
      setFormData({
        full_name: "",
        document_number: "",
        phone: "",
        whatsapp: "",
        social_media: "",
        address: "",
        bank_details: "",
        notes: "",
        status: "Ativo",
        discount_percentage: 0,
        birth_date: "",
      })
    }
  }, [initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (initialData?.id) {
        await updateReseller(initialData.id, formData)
      } else {
        await createReseller(formData)
      }
      setOpen(false)
      if (onSave) onSave()
    } catch (err) {
      setError("Erro ao salvar revendedor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {triggerButton || (
          <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Revendedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Editar Revendedor' : 'Cadastrar Revendedor'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do parceiro e configure a comissão (desconto) padrão dele.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo / Empresa</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number">CPF / CNPJ</Label>
                <Input
                  id="document_number"
                  value={formData.document_number || ''}
                  onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Principal</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_media">Instagram / Redes</Label>
                <Input
                  id="social_media"
                  value={formData.social_media || ''}
                  onChange={(e) => setFormData({...formData, social_media: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento / Fundação</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="discount_percentage" className="text-[#5C3D8F] font-bold">Desconto Padrão (%)</Label>
                <Input
                  id="discount_percentage"
                  type="number"
                  step="0.01"
                  value={formData.discount_percentage || 0}
                  onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value)})}
                />
                <p className="text-[10px] text-muted-foreground">Este % será abatido do preço de varejo no catálogo.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status do Acesso</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4 mt-2">
              <Label htmlFor="bank_details">Dados Bancários (Para repasses/comissões)</Label>
              <Textarea
                id="bank_details"
                placeholder="Ex: Banco Itaú, Ag: 1234, Cc: 56789-0, Chave PIX: celular"
                value={formData.bank_details || ''}
                onChange={(e) => setFormData({...formData, bank_details: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações Internas</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Revendedor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
