'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react'
import { getTransactions, createTransaction, deleteTransaction, updateTransaction, getBankAccounts, createBankAccount, deleteBankAccount, type FinancialTransaction, type BankAccount } from '@/lib/api/finance'
import { getSuppliers, type Supplier } from '@/lib/api/suppliers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FinanceDashboard } from '@/components/finance/finance-dashboard'
import { BankImportModal } from '@/components/finance/bank-import-modal'
import { AlertCircle } from 'lucide-react'
import { SupplierForm } from '@/components/suppliers/supplier-form'

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    type: 'Despesa',
    category: 'Fornecedor',
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'Pago',
    payment_method: 'PIX',
    bank_account_id: '',
    is_recurring: false,
    current_installment: 1,
    total_installments: 1,
    recurrence_period: 'Mensal',
    recurrence_end_date: ''
  })

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [newAccountData, setNewAccountData] = useState({ name: '', type: 'PJ', balance: '0' })

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [data, accs, supps] = await Promise.all([
        getTransactions(),
        getBankAccounts(),
        getSuppliers()
      ])
      setTransactions(data || [])
      setAccounts(accs || [])
      setSuppliers(supps || [])

      // Auto-select first account if exists
      if (accs && accs.length > 0 && !formData.bank_account_id) {
        setFormData(prev => ({ ...prev, bank_account_id: accs[0].id }))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const contasAPagar = transactions.filter(t => t.type === 'Despesa' && t.status === 'Pendente')
  const contasAReceber = transactions.filter(t => t.type === 'Receita' && t.status === 'Pendente')

  // --- FLUXO REAL ---
  const [fluxoAccountId, setFluxoAccountId] = useState<string>('all')
  const [fluxoMonth, setFluxoMonth] = useState<string>(new Date().toISOString().slice(0, 7))

  const calculateFluxoReal = () => {
    let flowTxs = transactions.filter(t => t.status === 'Pago')
    if (fluxoAccountId !== 'all') {
      flowTxs = flowTxs.filter(t => t.bank_account_id === fluxoAccountId)
    }
    // Sort chronologically
    flowTxs = flowTxs.sort((a, b) => new Date(a.payment_date || a.due_date || '').getTime() - new Date(b.payment_date || b.due_date || '').getTime())

    let runningBalance = 0;
    if (fluxoAccountId !== 'all') {
      const acc = accounts.find(a => a.id === fluxoAccountId);
      if (acc && acc.balance) runningBalance = Number(acc.balance);
    }

    return flowTxs.map(t => {
      if (t.type === 'Receita') runningBalance += Number(t.amount);
      else runningBalance -= Number(t.amount);

      return {
        ...t,
        runningBalance
      }
    })
  }
  const fluxoReal = calculateFluxoReal()

  const filteredFluxoReal = fluxoMonth === 'all' 
    ? fluxoReal 
    : fluxoReal.filter(t => (t.payment_date || t.due_date || '').startsWith(fluxoMonth))

  const fluxoTotals = filteredFluxoReal.reduce((acc, tx) => {
    if (tx.type === 'Receita') acc.entradas += Number(tx.amount)
    else acc.saidas += Number(tx.amount)
    return acc
  }, { entradas: 0, saidas: 0 })

  const fluxoSaldoLiquido = fluxoTotals.entradas - fluxoTotals.saidas
  const fluxoSaldoFinal = filteredFluxoReal.length > 0 ? filteredFluxoReal[filteredFluxoReal.length - 1].runningBalance : 0

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransaction({
        type: formData.type as 'Receita' | 'Despesa',
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount.replace(',', '.')),
        due_date: formData.due_date,
        payment_date: formData.status === 'Pago' ? formData.due_date : null,
        status: formData.status as 'Pendente' | 'Pago',
        payment_method: formData.payment_method,
        bank_account_id: formData.bank_account_id || null,
        is_recurring: formData.is_recurring,
        current_installment: formData.current_installment,
        total_installments: formData.total_installments,
        recurrence_period: formData.recurrence_period,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null
      })
      setIsModalOpen(false)
      loadData()
      // reset form
      setFormData({
        type: 'Despesa', category: 'Fornecedor', description: '', amount: '', due_date: new Date().toISOString().split('T')[0], status: 'Pago', payment_method: 'PIX', bank_account_id: accounts.length > 0 ? accounts[0].id : '', is_recurring: false, current_installment: 1, total_installments: 1, recurrence_period: 'Mensal', recurrence_end_date: ''
      })
    } catch (err) {
      alert("Erro ao salvar transação.")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente apagar esta transação?")) {
      await deleteTransaction(id)
      loadData()
    }
  }

  const toggleStatus = async (t: FinancialTransaction) => {
    const newStatus = t.status === 'Pago' ? 'Pendente' : 'Pago'
    const newPaymentDate = newStatus === 'Pago' ? new Date().toISOString().split('T')[0] : null
    
    if (newStatus === 'Pago' && t.is_recurring) {
      const currentDue = new Date(t.due_date || new Date())
      const nextDue = new Date(currentDue)
      
      if (t.recurrence_period === 'Anual') {
        nextDue.setFullYear(nextDue.getFullYear() + 1)
      } else {
        nextDue.setMonth(nextDue.getMonth() + 1)
      }
      
      const nextDueStr = nextDue.toISOString().split('T')[0]
      
      let shouldClone = true
      if (t.recurrence_end_date && nextDueStr > t.recurrence_end_date) {
        shouldClone = false
      }
      
      if (shouldClone) {
        await createTransaction({
          type: t.type,
          category: t.category,
          description: t.description,
          amount: t.amount,
          payment_method: t.payment_method,
          bank_account_id: t.bank_account_id,
          is_recurring: true,
          recurrence_period: t.recurrence_period,
          recurrence_end_date: t.recurrence_end_date,
          status: 'Pendente',
          payment_date: null,
          due_date: nextDueStr
        })
      }
      // Set current to false so it doesn't clone again if untoggled
      await updateTransaction(t.id, { status: newStatus, payment_date: newPaymentDate, is_recurring: false })
    } else {
      await updateTransaction(t.id, { status: newStatus, payment_date: newPaymentDate })
    }
    loadData()
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBankAccount({
        name: newAccountData.name,
        type: newAccountData.type as 'PF' | 'PJ',
        balance: parseFloat(newAccountData.balance.replace(',', '.')) || 0
      })
      setNewAccountData({ name: '', type: 'PJ', balance: '0' })
      loadData()
    } catch (err) {
      alert("Erro ao criar conta bancária.")
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (confirm("Apagar conta bancária? Isso não apagará transações vinculadas, mas as deixará sem conta.")) {
      await deleteBankAccount(id)
      loadData()
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Controle Financeiro</h2>
          <p className="text-muted-foreground">
            Gerencie o fluxo de caixa, contas a pagar e receber.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Link Comissões */}
          <Link href="/finance/commissions">
            <Button variant="outline" className="border-indigo-500 text-indigo-700 hover:bg-indigo-50">
              Comissões B2B
            </Button>
          </Link>

          {/* Importar Extrato */}
          <BankImportModal />

          {/* Gerenciar Contas */}
          <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#5C3D8F] text-[#5C3D8F]">
                Contas Bancárias
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Contas Bancárias (PF/PJ)</DialogTitle>
                <DialogDescription>Gerencie de onde o dinheiro entra e sai.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <span className="font-semibold text-sm">{acc.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{acc.type}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(acc.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {accounts.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhuma conta cadastrada.</p>}
                </div>

                <form onSubmit={handleSaveAccount} className="pt-4 border-t space-y-4">
                  <h4 className="text-sm font-semibold">Nova Conta</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome da Conta</Label>
                      <Input required value={newAccountData.name} onChange={e => setNewAccountData({ ...newAccountData, name: e.target.value })} placeholder="Ex: Inter PJ" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={newAccountData.type} onChange={e => setNewAccountData({ ...newAccountData, type: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm text-sm"
                      >
                        <option value="PJ">Pessoa Jurídica (PJ)</option>
                        <option value="PF">Pessoa Física (PF)</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] text-white h-8 text-xs">Adicionar Conta</Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lançamento */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
                <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Lançamento Financeiro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                    >
                      <option value="Despesa">Saída (Despesa)</option>
                      <option value="Receita">Entrada (Receita)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria (Fornecedor/Destino)</Label>
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                      >
                        <option value="">-- Selecione --</option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.name}>{sup.name}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewSupplierModalOpen(true)} title="Novo Fornecedor">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Ou digite outra categoria..."
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="mt-2 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Compra de Resina" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input required type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pagamento</Label>
                    <select
                      value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <select
                    value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                  >
                    <option value="">Sem conta especificada</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="recurring" 
                    checked={formData.is_recurring} 
                    onCheckedChange={(c) => setFormData({ ...formData, is_recurring: c === true })} 
                  />
                  <Label htmlFor="recurring" className="text-sm font-medium">Repetir Lançamento</Label>
                </div>
                {formData.is_recurring && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <select
                        value={formData.recurrence_period} onChange={e => setFormData({ ...formData, recurrence_period: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                      >
                        <option value="Mensal">Mensalmente</option>
                        <option value="Anual">Anualmente</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Final (Opcional)</Label>
                      <Input type="date" value={formData.recurrence_end_date} onChange={e => setFormData({ ...formData, recurrence_end_date: e.target.value })} title="Deixe em branco para repetir sem data limite" />
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] text-white mt-4">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="resumo">Resumo Financeiro</TabsTrigger>
          <TabsTrigger value="extrato">Extrato Geral</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo Real (Conciliação)</TabsTrigger>
          <TabsTrigger value="contas-a-pagar" className="relative">
            Contas a Pagar
            {contasAPagar.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {contasAPagar.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="contas-a-receber" className="relative">
            Contas a Receber
            {contasAReceber.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {contasAReceber.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <FinanceDashboard transactions={transactions} bankAccounts={accounts} />
        </TabsContent>

        <TabsContent value="extrato">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Todas as entradas e saídas registradas.</CardDescription>
              <div className="flex items-center pt-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar lançamento..."
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
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            Nenhum lançamento encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {tx.type === 'Receita' ? <ArrowUpRight className="text-green-500 w-4 h-4" /> : <ArrowDownRight className="text-red-500 w-4 h-4" />}
                                {tx.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {tx.category || '-'}
                            </TableCell>
                            <TableCell>
                              {new Date(tx.due_date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className={`font-semibold ${tx.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'Despesa' && '- '}R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {(tx as any).bank_accounts?.name || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(tx)}
                                className={`h-6 px-2 text-xs font-semibold rounded-full ${tx.status === 'Pago' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                              >
                                {tx.status}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}>
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
        </TabsContent>

        <TabsContent value="contas-a-receber">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>Acompanhe pagamentos de clientes que estão pendentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasAReceber.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          Nenhuma conta a receber pendente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      contasAReceber.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map(t => {
                        const isOverdue = new Date(t.due_date) < new Date() && t.status === 'Pendente'
                        return (
                          <TableRow key={t.id} className={isOverdue ? "bg-red-50/50" : ""}>
                            <TableCell className="whitespace-nowrap flex items-center gap-2">
                              {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                              <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                                {new Date(t.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
                                Pendente
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => toggleStatus(t)}>
                                Dar Baixa
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contas-a-pagar">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Gerencie suas despesas pendentes e não perca vencimentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasAPagar.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          Nenhuma conta a pagar pendente 🎉
                        </TableCell>
                      </TableRow>
                    ) : (
                      contasAPagar.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map(t => {
                        const isOverdue = new Date(t.due_date) < new Date() && t.status === 'Pendente'
                        return (
                          <TableRow key={t.id} className={isOverdue ? "bg-red-50/50" : ""}>
                            <TableCell className="whitespace-nowrap flex items-center gap-2">
                              {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                              <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                                {new Date(t.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
                                Pendente
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => toggleStatus(t)}>
                                Dar Baixa
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Fluxo Real (Conciliação)</CardTitle>
              <CardDescription>Acompanhe o saldo cronológico das suas contas (Apenas transações pagas).</CardDescription>
              <div className="flex flex-col sm:flex-row items-end gap-4 pt-4">
                <div className="w-full max-w-[200px]">
                  <Label className="mb-2 block text-sm">Mês/Ano</Label>
                  <Input type="month" value={fluxoMonth} onChange={e => setFluxoMonth(e.target.value)} />
                </div>
                <div className="w-full max-w-sm">
                  <Label className="mb-2 block text-sm">Filtrar por Conta Bancária</Label>
                  <select
                    value={fluxoAccountId}
                    onChange={e => setFluxoAccountId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="all">Todas as Contas (Saldo Global)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
                <div className="ml-auto w-full max-w-[150px]">
                  <Button variant="outline" className="w-full" onClick={() => setFluxoMonth('all')}>
                    Ver Todo o Período
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Data</TableHead>
                      <TableHead>Histórico</TableHead>
                      <TableHead className="text-right text-green-700">Entrada (+)</TableHead>
                      <TableHead className="text-right text-red-700">Saída (-)</TableHead>
                      <TableHead className="text-right font-bold">Saldo (=)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFluxoReal.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          Nenhuma transação paga encontrada para este período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFluxoReal.map((tx) => (
                        <TableRow key={`fluxo-${tx.id}`}>
                          <TableCell className="whitespace-nowrap font-medium text-gray-600">
                            {new Date(tx.payment_date || tx.due_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate" title={tx.description}>
                            {tx.description}
                            {tx.bank_account_id && fluxoAccountId === 'all' && (
                              <span className="ml-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                {accounts.find(a => a.id === tx.bank_account_id)?.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {tx.type === 'Receita' ? `R$ ${Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {tx.type === 'Despesa' ? `R$ ${Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${tx.runningBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            R$ {tx.runningBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  <TableFooter className="bg-gray-100">
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold text-gray-700 uppercase tracking-wider">
                        Totais no Período:
                      </TableCell>
                      <TableCell className="text-right text-green-700 font-bold">
                        R$ {fluxoTotals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-red-700 font-bold">
                        R$ {fluxoTotals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${fluxoSaldoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        R$ {fluxoSaldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Novo Fornecedor */}
      <Dialog open={isNewSupplierModalOpen} onOpenChange={setIsNewSupplierModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
          </DialogHeader>
          <SupplierForm
            isModal
            onSuccess={(supplier) => {
              setSuppliers(prev => [supplier, ...prev])
              setFormData(prev => ({ ...prev, category: supplier.name }))
              setIsNewSupplierModalOpen(false)
            }}
            onCancel={() => setIsNewSupplierModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
