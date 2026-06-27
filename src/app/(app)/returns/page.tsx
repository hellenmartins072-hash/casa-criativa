'use client'

import { useEffect, useState } from 'react'
import { ClientInteraction, getAllReturns, updateInteraction } from '@/lib/api/crm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react'
import { format, isPast, isToday, parseISO, differenceInDays } from 'date-fns'

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ClientInteraction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReturns()
  }, [])

  async function loadReturns() {
    setLoading(true)
    try {
      const data = await getAllReturns()
      setReturns(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    if (!confirm('Deseja marcar este retorno como concluído?')) return
    try {
      await updateInteraction(id, { interaction_type: 'Retorno Concluído' })
      await loadReturns()
    } catch (error) {
      console.error('Erro ao concluir retorno', error)
      alert('Erro ao concluir retorno.')
    }
  }

  const pendingReturns = returns.filter(r => r.interaction_type === 'Retorno Programado')
  const completedReturns = returns.filter(r => r.interaction_type === 'Retorno Concluído')

  const getStatusColor = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (isPast(date)) return 'text-red-600 bg-red-50 border-red-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const getStatusLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Aviso para Hoje'
    if (isPast(date)) return 'Atrasado'
    const days = differenceInDays(date, new Date())
    return `Daqui a ${days} dias`
  }

  const renderReturnCard = (r: ClientInteraction, isCompleted: boolean) => {
    const clientName = r.clients?.full_name || r.companies?.business_name || 'Desconhecido'
    const clientPhone = r.clients?.whatsapp || r.companies?.phone || ''
    
    // Parse notes to get event info nicely, or just display raw if it's not our format
    const notesText = r.notes

    return (
      <Card key={r.id} className={`overflow-hidden ${isCompleted ? 'opacity-60 grayscale' : ''}`}>
        <div className={`h-1.5 w-full ${isCompleted ? 'bg-emerald-500' : 'bg-pink-500'}`}></div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-gray-900">{clientName}</h3>
              {clientPhone && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MessageCircle className="w-3 h-3" />
                  {clientPhone}
                </div>
              )}
            </div>
            {!isCompleted && (
              <div className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 ${getStatusColor(r.interaction_date)}`}>
                <AlertCircle className="w-3 h-3" />
                {getStatusLabel(r.interaction_date)}
              </div>
            )}
            {isCompleted && (
              <div className="px-2 py-1 rounded text-xs font-semibold border text-emerald-600 bg-emerald-50 border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Concluído
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 border border-gray-100 rounded p-3 mb-4 text-sm text-gray-700 whitespace-pre-wrap font-medium">
            {notesText}
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Lembrete: {format(new Date(r.interaction_date), 'dd/MM/yyyy')}
            </span>
            <div className="flex gap-2">
              {clientPhone && (
                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => window.open(`https://wa.me/55${clientPhone.replace(/\D/g, '')}`, '_blank')}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chamar
                </Button>
              )}
              {!isCompleted && (
                <Button size="sm" onClick={() => handleComplete(r.id)} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Concluir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Retornos e Lembretes</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe os clientes que precisam ser contatados para eventos anuais e datas comemorativas.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#5C3D8F]" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="text-pink-500" /> 
              Pendentes / Próximos ({pendingReturns.length})
            </h2>
            {pendingReturns.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50 text-gray-500">
                Nenhum retorno programado pendente no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReturns.map(r => renderReturnCard(r, false))}
              </div>
            )}
          </section>

          <section className="pt-6 border-t">
            <h2 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" /> 
              Histórico de Concluídos ({completedReturns.length})
            </h2>
            {completedReturns.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50 text-gray-500">
                Nenhum retorno concluído ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedReturns.map(r => renderReturnCard(r, true))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
