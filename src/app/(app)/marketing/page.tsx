'use client'

import { useState, useEffect } from 'react'
import { getReferralCoupons, createReferralCoupon, toggleCouponStatus, deleteReferralCoupon } from '@/lib/api/marketing'
import { getClients } from '@/lib/api/clients'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Power, PowerOff, Gift } from 'lucide-react'

export default function MarketingPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    client_id: '',
    discount_percent: 10,
    credit_reward: 15
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [couponsData, clientsData] = await Promise.all([
        getReferralCoupons(),
        getClients()
      ])
      setCoupons(couponsData || [])
      setClients(clientsData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCoupon.code.trim() || !newCoupon.client_id) {
      alert("Preencha o código e selecione o cliente indicador.")
      return
    }

    try {
      await createReferralCoupon({
        code: newCoupon.code.trim().toUpperCase(),
        client_id: newCoupon.client_id,
        discount_percent: newCoupon.discount_percent,
        credit_reward: newCoupon.credit_reward
      })
      setNewCoupon({ code: '', client_id: '', discount_percent: 10, credit_reward: 15 })
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      alert("Erro ao criar cupom. O código já existe?")
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCouponStatus(id, !currentStatus)
      loadData()
    } catch (err) {
      alert("Erro ao atualizar status.")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Deseja apagar este cupom permanentemente?")) {
      await deleteReferralCoupon(id)
      loadData()
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Vendas e Marketing</h2>
          <p className="text-muted-foreground">
            Programa de Indicação e gerenciamento de cupons.
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Cupom de Indicação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input 
                  placeholder="Ex: MARIA10"
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente Indicador (Quem ganha o crédito)</Label>
                <select
                  value={newCoupon.client_id}
                  onChange={e => setNewCoupon({...newCoupon, client_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desconto pro Amigo (%)</Label>
                  <Input 
                    type="number" min="0" step="1"
                    value={newCoupon.discount_percent}
                    onChange={e => setNewCoupon({...newCoupon, discount_percent: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crédito p/ Indicador (R$)</Label>
                  <Input 
                    type="number" min="0" step="0.01"
                    value={newCoupon.credit_reward}
                    onChange={e => setNewCoupon({...newCoupon, credit_reward: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] mt-4">
                Salvar Cupom
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cupons de Indicação (Referral)</CardTitle>
          <CardDescription>Gerencie quem está indicando novos clientes para a Casa Criativa.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente Indicador</TableHead>
                    <TableHead>Regra (Amigo / Indicador)</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum cupom cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-bold text-[#5C3D8F]">{c.code}</TableCell>
                        <TableCell>
                          <div className="font-medium">{c.clients?.full_name}</div>
                          <div className="text-xs text-green-600 flex items-center">
                            <Gift className="w-3 h-3 mr-1" /> Saldo atual: R$ {c.clients?.referral_credit || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>Amigo ganha: {c.discount_percent}% off</div>
                          <div>Indicador ganha: R$ {c.credit_reward}</div>
                        </TableCell>
                        <TableCell>{c.uses_count} vezes</TableCell>
                        <TableCell>
                          {c.is_active ? (
                            <span className="text-green-600 font-semibold text-sm">Ativo</span>
                          ) : (
                            <span className="text-red-500 font-semibold text-sm">Inativo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggle(c.id, c.is_active)}
                            title={c.is_active ? "Desativar" : "Ativar"}
                          >
                            {c.is_active ? <PowerOff className="h-4 w-4 text-gray-500" /> : <Power className="h-4 w-4 text-green-500" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
