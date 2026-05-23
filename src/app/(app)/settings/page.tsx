'use client'

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Building, Percent, Edit, Trash2, Download, DatabaseBackup } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  PaymentFee, 
  getSettings, 
  updateSettings, 
  getFees, 
  createFee, 
  updateFee, 
  deleteFee 
} from "@/lib/api/settings"
import { getClients } from "@/lib/api/clients"
import { getOrders } from "@/lib/api/orders"
import { getTransactions } from "@/lib/api/finance"
import { downloadCSV } from "@/lib/utils/export"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingFee, setSavingFee] = useState(false)
  const [exportingType, setExportingType] = useState<string | null>(null)
  
  const [settings, setSettingsData] = useState<Partial<Settings>>({
    business_name: '',
    document_number: '',
    phone: '',
    email: '',
    address: ''
  })
  
  const [fees, setFees] = useState<PaymentFee[]>([])
  
  // Fee Dialog State
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<Partial<PaymentFee> | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [settingsData, feesData] = await Promise.all([
        getSettings(),
        getFees()
      ])
      if (settingsData) setSettingsData(settingsData)
      if (feesData) setFees(feesData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await updateSettings(settings)
      alert("Dados da empresa salvos com sucesso!")
    } catch (err) {
      alert("Erro ao salvar dados da empresa.")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingFee(true)
    try {
      if (editingFee?.id) {
        await updateFee(editingFee.id, editingFee)
      } else {
        await createFee(editingFee as Partial<PaymentFee>)
      }
      setIsFeeDialogOpen(false)
      loadData()
    } catch (err) {
      alert("Erro ao salvar taxa.")
    } finally {
      setSavingFee(false)
    }
  }

  const handleDeleteFee = async (id: string) => {
    if (confirm("Deseja realmente apagar esta taxa?")) {
      await deleteFee(id)
      loadData()
    }
  }

  const openNewFeeDialog = () => {
    setEditingFee({
      name: '',
      type: 'Plataforma',
      percentage_fee: 0,
      fixed_fee: 0,
      is_active: true
    })
    setIsFeeDialogOpen(true)
  }

  const handleExport = async (type: 'clients' | 'orders' | 'finance') => {
    setExportingType(type)
    try {
      if (type === 'clients') {
        const data = await getClients()
        downloadCSV(data, 'backup-clientes')
      } else if (type === 'orders') {
        const data = await getOrders()
        // Format orders for CSV export (flattening relationships)
        const formattedData = data.map(order => ({
          ...order,
          client_name: order.clients?.full_name || '',
          company_name: order.companies?.business_name || ''
        }))
        // Remove nested objects before export
        formattedData.forEach(d => {
          delete d.clients
          delete d.companies
        })
        downloadCSV(formattedData, 'backup-pedidos')
      } else if (type === 'finance') {
        const data = await getTransactions()
        const formattedData = data.map((t: any) => ({
          ...t,
          order_number: t.orders?.order_number || '',
          supplier_name: t.suppliers?.name || ''
        }))
        formattedData.forEach((d: any) => {
          delete d.orders
          delete d.suppliers
        })
        downloadCSV(formattedData, 'backup-financeiro')
      }
    } catch (err) {
      alert("Erro ao exportar dados.")
      console.error(err)
    } finally {
      setExportingType(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie os dados da sua empresa e as taxas de pagamentos.
          </p>
        </div>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" /> Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <Percent className="h-4 w-4" /> Taxas e Plataformas
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <DatabaseBackup className="h-4 w-4" /> Backup e Exportação
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DADOS DA EMPRESA */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Estes dados serão utilizados no cabeçalho dos orçamentos e recibos gerados pelo sistema.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nome da Empresa</Label>
                    <Input 
                      id="business_name" 
                      value={settings.business_name || ''} 
                      onChange={e => setSettingsData({...settings, business_name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document_number">CNPJ ou CPF</Label>
                    <Input 
                      id="document_number" 
                      value={settings.document_number || ''} 
                      onChange={e => setSettingsData({...settings, document_number: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input 
                      id="phone" 
                      value={settings.phone || ''} 
                      onChange={e => setSettingsData({...settings, phone: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Comercial</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={settings.email || ''} 
                      onChange={e => setSettingsData({...settings, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input 
                      id="address" 
                      value={settings.address || ''} 
                      onChange={e => setSettingsData({...settings, address: e.target.value})} 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Dados
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 2: TAXAS E PLATAFORMAS */}
        <TabsContent value="fees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Taxas de Pagamento e Plataformas</CardTitle>
                <CardDescription className="mt-1">
                  Gerencie as taxas descontadas em cada venda. Ex: Maquininhas, Shopee, Mercado Livre, etc.
                </CardDescription>
              </div>
              <Button onClick={openNewFeeDialog} className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
                <Plus className="h-4 w-4 mr-2" /> Nova Taxa
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Plataforma/Taxa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Taxa (%)</TableHead>
                    <TableHead>Taxa Fixa (R$)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        Nenhuma taxa cadastrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fees.map(fee => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        <TableCell>{fee.type}</TableCell>
                        <TableCell className="font-bold text-red-600">
                          {Number(fee.percentage_fee) > 0 ? `${Number(fee.percentage_fee).toFixed(2)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {Number(fee.fixed_fee) > 0 ? `+ R$ ${Number(fee.fixed_fee).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingFee(fee)
                            setIsFeeDialogOpen(true)
                          }}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFee(fee.id)}>
                            <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BACKUP E EXPORTAÇÃO */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup de Dados (CSV)</CardTitle>
              <CardDescription>
                Faça o download de relatórios completos do sistema em formato Excel/CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Clientes</CardTitle>
                    <CardDescription>Base completa de pessoas físicas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleExport('clients')} 
                      disabled={exportingType === 'clients'}
                      className="w-full bg-[#5C3D8F] hover:bg-[#4a3173]"
                    >
                      {exportingType === 'clients' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Exportar Clientes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Pedidos</CardTitle>
                    <CardDescription>Histórico de todos os pedidos criados.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleExport('orders')} 
                      disabled={exportingType === 'orders'}
                      className="w-full bg-[#5C3D8F] hover:bg-[#4a3173]"
                    >
                      {exportingType === 'orders' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Exportar Pedidos
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Financeiro</CardTitle>
                    <CardDescription>Todas as receitas e despesas registradas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleExport('finance')} 
                      disabled={exportingType === 'finance'}
                      className="w-full bg-[#5C3D8F] hover:bg-[#4a3173]"
                    >
                      {exportingType === 'finance' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Exportar Financeiro
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG DE CRIAR/EDITAR TAXA */}
      <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveFee}>
            <DialogHeader>
              <DialogTitle>{editingFee?.id ? 'Editar Taxa' : 'Cadastrar Nova Taxa'}</DialogTitle>
              <DialogDescription>
                Defina o desconto que a plataforma/maquininha aplica na sua venda.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fee_name">Nome (Ex: Shopee, Crédito 1x Ton)</Label>
                <Input 
                  id="fee_name" 
                  value={editingFee?.name || ''} 
                  onChange={e => setEditingFee({...editingFee, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_type">Tipo</Label>
                <Select 
                  value={editingFee?.type || 'Outros'} 
                  onValueChange={(val: any) => setEditingFee({...editingFee, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maquininha">Maquininha</SelectItem>
                    <SelectItem value="Plataforma">Plataforma (Shopee, ML)</SelectItem>
                    <SelectItem value="Link de Pagamento">Link de Pagamento</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee_percentage">Porcentagem (%)</Label>
                  <Input 
                    id="fee_percentage" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={editingFee?.percentage_fee || 0} 
                    onChange={e => setEditingFee({...editingFee, percentage_fee: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee_fixed">Taxa Fixa (R$)</Label>
                  <Input 
                    id="fee_fixed" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={editingFee?.fixed_fee || 0} 
                    onChange={e => setEditingFee({...editingFee, fixed_fee: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Se a plataforma cobra 18% + 3 reais por venda, preencha 18 no primeiro campo e 3 no segundo.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFeeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingFee}>
                {savingFee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Taxa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
