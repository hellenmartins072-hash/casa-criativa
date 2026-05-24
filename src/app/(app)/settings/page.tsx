'use client'

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Building, Percent, Edit, Trash2, Download, DatabaseBackup, Store, Palette, MessageCircle } from "lucide-react"
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
import { StoresList } from "@/components/stores-list"

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
    address: '',
    wa_access_token: '',
    wa_phone_number_id: '',
    wa_template_approved: '',
    wa_template_production: '',
    wa_template_ready: '',
    wa_template_delivered: '',
    monthly_revenue_goal: 0
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
        const formattedData = data.map(c => ({
          'ID': c.id,
          'Nome': c.full_name,
          'Documento': c.document || '',
          'Telefone / WhatsApp': c.whatsapp || '',
          'Instagram': c.instagram || '',
          'E-mail': c.email || '',
          'Endereço': c.address || '',
          'Data Nascimento': c.birth_date ? new Date(c.birth_date).toLocaleDateString('pt-BR') : '',
          'LTV (Valor Gasto)': c.ltv || 0,
          'Total Pedidos': c.orders_count || 0,
          'Data Cadastro': c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''
        }))
        downloadCSV(formattedData, 'backup-clientes')
      } else if (type === 'orders') {
        const data = await getOrders()
        const formattedData = data.map(o => ({
          'ID Pedido': o.id,
          'Nº Pedido': o.order_number,
          'Cliente': o.clients?.full_name || '',
          'Empresa': o.companies?.business_name || '',
          'Status': o.status,
          'Data Entrega': o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('pt-BR') : '',
          'Total Bruto (R$)': o.total_amount,
          'Desconto (R$)': o.discount_amount || 0,
          'Total Líquido (R$)': o.final_amount,
          'Custo Total (R$)': o.total_cost || 0,
          'Lucro (R$)': o.profit_amount || 0,
          'Margem (%)': o.profit_margin || 0,
          'Método Pagamento': o.payment_method || '',
          'Taxa Cartão (R$)': o.credit_fee || 0,
          'Parceiro Frete': o.shipping_partners?.name || '',
          'Valor Frete (R$)': o.shipping_cost || 0,
          'Data Criação': o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : ''
        }))
        downloadCSV(formattedData, 'backup-pedidos')
      } else if (type === 'finance') {
        const data = await getTransactions()
        const formattedData = data.map((t: any) => ({
          'ID Transação': t.id,
          'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
          'Descrição': t.description,
          'Valor (R$)': t.amount,
          'Categoria': t.category,
          'Data': t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '',
          'Status': t.status,
          'Conta/Banco': t.bank_account || '',
          'Nº Pedido Associado': t.orders?.order_number || '',
          'Fornecedor Associado': t.suppliers?.name || ''
        }))
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
        <TabsList className="mb-4 flex flex-wrap h-auto bg-transparent border-b rounded-none w-full justify-start p-0 gap-4">
          <TabsTrigger value="company" className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">
            <Building className="h-4 w-4" /> Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">
            <Palette className="h-4 w-4" /> Design e Aparência
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">
            <Store className="h-4 w-4" /> Lojas e Perfis
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">
            <MessageCircle className="h-4 w-4" /> WhatsApp Oficial
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">
            <Percent className="h-4 w-4" /> Taxas e Plataformas
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">
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

                <h3 className="font-bold text-gray-800 border-b pb-2 mt-6 mb-4">Metas e Faturamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_revenue_goal">Meta Mensal de Faturamento (R$)</Label>
                    <Input 
                      id="monthly_revenue_goal" 
                      type="number"
                      step="0.01"
                      value={settings.monthly_revenue_goal || 0} 
                      onChange={e => setSettingsData({...settings, monthly_revenue_goal: parseFloat(e.target.value) || 0})} 
                      placeholder="Ex: 50000.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Defina sua meta para acompanhar o progresso no Dashboard principal.</p>
                  </div>
                </div>
                
                <h3 className="font-bold text-gray-800 border-b pb-2 mt-6 mb-4">Dados Bancários (Aparecem nos Orçamentos)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Banco</Label>
                    <Input 
                      id="bank_name" 
                      value={settings.bank_name || ''} 
                      onChange={e => setSettingsData({...settings, bank_name: e.target.value})} 
                      placeholder="Ex: Nubank, Inter..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_name">Titular / Favorecido</Label>
                    <Input 
                      id="bank_account_name" 
                      value={settings.bank_account_name || ''} 
                      onChange={e => setSettingsData({...settings, bank_account_name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_pix">Chave PIX</Label>
                    <Input 
                      id="bank_pix" 
                      value={settings.bank_pix || ''} 
                      onChange={e => setSettingsData({...settings, bank_pix: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2 flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="bank_agency">Agência</Label>
                      <Input 
                        id="bank_agency" 
                        value={settings.bank_agency || ''} 
                        onChange={e => setSettingsData({...settings, bank_agency: e.target.value})} 
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="bank_account">Conta</Label>
                      <Input 
                        id="bank_account" 
                        value={settings.bank_account || ''} 
                        onChange={e => setSettingsData({...settings, bank_account: e.target.value})} 
                      />
                    </div>
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

        {/* TAB DESIGN E APARÊNCIA */}
        <TabsContent value="design">
          <Card>
            <CardHeader>
              <CardTitle>Design e Aparência</CardTitle>
              <CardDescription>
                Personalize as cores do sistema e o logotipo que aparecerá no cabeçalho e nos PDFs gerados.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logotipo (Link da Imagem)</Label>
                    <Input 
                      id="logo_url" 
                      value={settings.logo_url || ''} 
                      onChange={e => setSettingsData({...settings, logo_url: e.target.value})} 
                      placeholder="Ex: https://meusite.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">O logotipo aparecerá na impressão do Orçamento e Pedido.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Cor Primária (Hexadecimal)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="primary_color_picker" 
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer"
                        value={settings.primary_color || '#5C3D8F'} 
                        onChange={e => setSettingsData({...settings, primary_color: e.target.value})} 
                      />
                      <Input 
                        id="primary_color" 
                        value={settings.primary_color || '#5C3D8F'} 
                        onChange={e => setSettingsData({...settings, primary_color: e.target.value})} 
                        className="flex-1 uppercase font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Essa cor altera botões principais e o cabeçalho do PDF.</p>
                  </div>
                </div>

                {settings.logo_url && (
                  <div className="mt-4 border p-4 rounded-md">
                    <Label className="mb-2 block">Pré-visualização do Logotipo:</Label>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.logo_url} alt="Logo Preview" className="max-h-24 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" style={{ backgroundColor: settings.primary_color || '#5C3D8F' }} disabled={savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Design
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB LOJAS E PERFIS */}
        <TabsContent value="stores">
          <Card>
            <CardContent className="pt-6">
              <StoresList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB WHATSAPP API */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>Integração Oficial do WhatsApp (Meta)</CardTitle>
              <CardDescription>
                Configure as credenciais da Meta Cloud API e os nomes dos Templates Aprovados para disparos automáticos.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm mb-4">
                  <strong>Aviso:</strong> A API Oficial da Meta exige que mensagens iniciadas pela empresa (fora da janela de 24h) sejam enviadas como <strong>Templates Pré-Aprovados</strong> pelo painel do Facebook Developer. Informe o nome exato do template aprovado (ex: <code>pedido_aprovado_v1</code>). <br/><br/>O sistema preencherá as variáveis assim: <br/> <code>{'{{1}}'}</code> = Primeiro Nome do Cliente <br/> <code>{'{{2}}'}</code> = Número do Pedido.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa_access_token">Token de Acesso Permanente</Label>
                    <Input 
                      id="wa_access_token" 
                      type="password"
                      value={settings.wa_access_token || ''} 
                      onChange={e => setSettingsData({...settings, wa_access_token: e.target.value})} 
                      placeholder="EAA..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa_phone_number_id">ID do Número de Telefone (Phone Number ID)</Label>
                    <Input 
                      id="wa_phone_number_id" 
                      value={settings.wa_phone_number_id || ''} 
                      onChange={e => setSettingsData({...settings, wa_phone_number_id: e.target.value})} 
                      placeholder="Ex: 123456789012345"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 border-b pb-2 mt-6 mb-4">Nomes dos Templates Aprovados</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa_template_approved">Template: Pedido Aprovado</Label>
                    <Input 
                      id="wa_template_approved" 
                      value={settings.wa_template_approved || ''} 
                      onChange={e => setSettingsData({...settings, wa_template_approved: e.target.value})} 
                      placeholder="Ex: status_aprovado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa_template_production">Template: Em Produção</Label>
                    <Input 
                      id="wa_template_production" 
                      value={settings.wa_template_production || ''} 
                      onChange={e => setSettingsData({...settings, wa_template_production: e.target.value})} 
                      placeholder="Ex: status_producao"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa_template_ready">Template: Pronto para Entrega/Retirada</Label>
                    <Input 
                      id="wa_template_ready" 
                      value={settings.wa_template_ready || ''} 
                      onChange={e => setSettingsData({...settings, wa_template_ready: e.target.value})} 
                      placeholder="Ex: status_pronto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa_template_delivered">Template: Entregue</Label>
                    <Input 
                      id="wa_template_delivered" 
                      value={settings.wa_template_delivered || ''} 
                      onChange={e => setSettingsData({...settings, wa_template_delivered: e.target.value})} 
                      placeholder="Ex: status_entregue"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" disabled={savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configurações
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
