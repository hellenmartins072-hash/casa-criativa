'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UploadCloud, Check, X, FileText, Loader2, AlertCircle } from 'lucide-react'
import { parseBankFile, ParsedBankTransaction } from '@/lib/utils/bank-parser'
import { getProcessedBankTransactionIds, ignoreBankTransactions, saveReconciledTransactions, FinancialTransaction } from '@/lib/api/finance'
import { getCompanies, Company } from '@/lib/api/companies'

type ReconciledItem = ParsedBankTransaction & {
  action: 'approve' | 'ignore' | 'pending'
  category: string
  store_id: string | null
}

const CATEGORIES = [
  'Venda', 
  'Material', 
  'Fornecedor', 
  'Despesa Fixa', 
  'Pessoal', 
  'ESCOLA / PESSOAL',
  'Taxa de Entrega',
  'Investimento Empresa',
  'Imposto', 
  'Outro'
]

export function BankImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const [items, setItems] = useState<ReconciledItem[]>([])
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    if (isOpen && companies.length === 0) {
      getCompanies().then(setCompanies).catch(console.error)
    }
  }, [isOpen])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setLoading(true)
    
    try {
      const parsed = await parseBankFile(uploadedFile)
      
      // Fetch already processed IDs
      const ids = parsed.map(p => p.id)
      const processedIds = await getProcessedBankTransactionIds(ids)
      
      const newItems: ReconciledItem[] = parsed
        .filter(p => !processedIds.includes(p.id))
        .map(p => ({
          ...p,
          action: 'pending',
          category: p.type === 'Receita' ? 'Venda' : 'Despesa Fixa',
          store_id: null
        }))

      setItems(newItems)
    } catch (err) {
      console.error(err)
      alert('Erro ao ler o arquivo. Verifique se é um CSV ou OFX válido.')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (id: string, field: keyof ReconciledItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const setAction = (id: string, action: 'approve' | 'ignore') => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, action } : item))
  }

  const processImport = async () => {
    const toApprove = items.filter(i => i.action === 'approve')
    const toIgnore = items.filter(i => i.action === 'ignore')

    if (toApprove.length === 0 && toIgnore.length === 0) {
      alert('Selecione uma ação para pelo menos uma transação.')
      return
    }

    setLoading(true)
    try {
      // 1. Save ignored
      if (toIgnore.length > 0) {
        await ignoreBankTransactions(toIgnore.map(i => i.id))
      }

      // 2. Save approved
      if (toApprove.length > 0) {
        const payload: Partial<FinancialTransaction>[] = toApprove.map(item => ({
          type: item.type,
          category: item.category,
          description: item.description,
          amount: item.amount,
          due_date: item.date,
          payment_date: item.date,
          status: 'Pago',
          payment_method: 'Transferência', // Default para banco
          bank_transaction_id: item.id,
          store_id: item.store_id || null,
          notes: 'Importado via Extrato Bancário'
        }))

        await saveReconciledTransactions(payload)
      }

      alert('Extrato processado com sucesso!')
      setIsOpen(false)
      window.location.reload() // Recarrega a página para atualizar a lista
    } catch (err) {
      console.error(err)
      alert('Erro ao processar as transações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
          <UploadCloud className="h-4 w-4 mr-2" /> Importar Extrato
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-6xl max-h-[95vh] flex flex-col overflow-hidden p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#5C3D8F]">Importar Extrato Bancário</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-1">
          {items.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50">
              <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
              <Label className="text-lg font-medium cursor-pointer bg-white px-4 py-2 border rounded-md shadow-sm hover:bg-gray-50 transition-colors">
                Selecionar Arquivo (CSV ou OFX)
                <input type="file" className="hidden" accept=".csv,.ofx,text/csv,application/x-ofx" onChange={handleFileUpload} />
              </Label>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
                Faça o upload do extrato do Bradesco ou outro banco para conciliar suas transações. Transações já importadas serão ignoradas.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#5C3D8F]" />
            </div>
          )}

          {items.length > 0 && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md text-blue-800 text-sm border border-blue-100">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <strong>{items.length} transações novas encontradas.</strong> Classifique cada uma ou clique em ignorar.
                </div>
                <div className="text-xs">
                  Aprovadas: {items.filter(i => i.action === 'approve').length} | 
                  Ignoradas: {items.filter(i => i.action === 'ignore').length} | 
                  Pendentes: {items.filter(i => i.action === 'pending').length}
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Histórico (Banco)</th>
                      <th className="p-2 text-right">Valor</th>
                      <th className="p-2 text-left">Categoria</th>
                      <th className="p-2 text-left">Vincular Loja</th>
                      <th className="p-2 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(item => (
                      <tr 
                        key={item.id} 
                        className={`
                          transition-colors
                          ${item.action === 'approve' ? 'bg-green-50' : ''}
                          ${item.action === 'ignore' ? 'bg-gray-100 opacity-60' : 'bg-white'}
                        `}
                      >
                        <td className="p-2">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2 font-medium truncate max-w-[200px]" title={item.description}>{item.description}</td>
                        <td className={`p-2 text-right font-bold ${item.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'Receita' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <select 
                            className="border rounded p-1 w-full bg-white/80"
                            value={item.category}
                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            disabled={item.action === 'ignore'}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select 
                            className="border rounded p-1 w-full bg-white/80 text-xs"
                            value={item.store_id || ''}
                            onChange={(e) => updateItem(item.id, 'store_id', e.target.value)}
                            disabled={item.action === 'ignore'}
                          >
                            <option value="">-- Nenhuma --</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex justify-center gap-1">
                            <Button 
                              size="sm" 
                              variant={item.action === 'approve' ? 'default' : 'outline'}
                              className={item.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'hover:text-green-600'}
                              onClick={() => setAction(item.id, 'approve')}
                              title="Aprovar e Importar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant={item.action === 'ignore' ? 'secondary' : 'outline'}
                              className={item.action === 'ignore' ? 'bg-gray-300 text-gray-700' : 'hover:text-red-600'}
                              onClick={() => setAction(item.id, 'ignore')}
                              title="Ignorar transação"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          {items.length > 0 && (
            <Button 
              className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white" 
              onClick={processImport}
              disabled={loading || (items.filter(i => i.action !== 'pending').length === 0)}
            >
              Processar {items.filter(i => i.action !== 'pending').length} Transações
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
