'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react'
import { getTransactions, createTransaction, deleteTransaction, updateTransaction, type FinancialTransaction } from '@/lib/api/finance'
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
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { FinanceDashboard } from '@/components/finance/finance-dashboard'

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
    payment_method: 'PIX'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getTransactions()
      setTransactions(data || [])
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
        payment_method: formData.payment_method
      })
      setIsModalOpen(false)
      loadData()
      // reset form
      setFormData({
        type: 'Despesa', category: 'Fornecedor', description: '', amount: '', due_date: new Date().toISOString().split('T')[0], status: 'Pago', payment_method: 'PIX'
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
    await updateTransaction(t.id, { status: newStatus, payment_date: newPaymentDate })
    loadData()
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
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                    >
                      <option value="Despesa">Saída (Despesa)</option>
                      <option value="Receita">Entrada (Receita)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Compra de Resina" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select 
                      value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pagamento</Label>
                    <select 
                      value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 shadow-sm"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão">Cartão</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] text-white mt-4">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FinanceDashboard />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
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
    </div>
  )
}
