'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, MapPin, Edit, Trash2 } from 'lucide-react'
import { getShippingPartners, createShippingPartner, updateShippingPartner, deleteShippingPartner, type ShippingPartner } from '@/lib/api/shipping'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function ShippingPage() {
  const [partners, setPartners] = useState<ShippingPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partial<ShippingPartner> | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getShippingPartners()
      setPartners(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPartner?.id) {
        await updateShippingPartner(editingPartner.id, editingPartner)
      } else {
        await createShippingPartner(editingPartner as Partial<ShippingPartner>)
      }
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      alert("Erro ao salvar parceiro.")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente apagar este parceiro?")) {
      try {
        await deleteShippingPartner(id)
        loadData()
      } catch (err) {
        alert("Erro ao apagar. Pode estar atrelado a um pedido.")
      }
    }
  }

  const openNewModal = () => {
    setEditingPartner({
      name: '',
      phone: '',
      base_fee: 0,
      notes: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (partner: ShippingPartner) => {
    setEditingPartner(partner)
    setIsModalOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Fretes e Entregas</h2>
          <p className="text-muted-foreground">
            Gerencie motoboys, transportadoras e taxas padrão de entrega.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewModal} className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
                <Plus className="mr-2 h-4 w-4" /> Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPartner?.id ? 'Editar Parceiro' : 'Novo Parceiro de Entrega'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome / Empresa</Label>
                  <Input required value={editingPartner?.name || ''} onChange={e => setEditingPartner({...editingPartner, name: e.target.value})} placeholder="Ex: Motoboy João" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input value={editingPartner?.phone || ''} onChange={e => setEditingPartner({...editingPartner, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa Padrão (R$)</Label>
                    <Input required type="number" step="0.01" min="0" value={editingPartner?.base_fee || 0} onChange={e => setEditingPartner({...editingPartner, base_fee: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações (Cidades atendidas, horários)</Label>
                  <Input value={editingPartner?.notes || ''} onChange={e => setEditingPartner({...editingPartner, notes: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] text-white mt-4">Salvar Parceiro</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parceiros Cadastrados</CardTitle>
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar parceiro..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Taxa Base</TableHead>
                    <TableHead>Cidades / Obs</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum parceiro de frete cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                           <MapPin className="h-4 w-4 text-[#5C3D8F]" /> {p.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.phone || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-700">
                          R$ {Number(p.base_fee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(p)}>
                             <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                             <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
