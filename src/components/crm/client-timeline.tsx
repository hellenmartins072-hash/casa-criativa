'use client'

import { useState, useEffect } from 'react'
import { ClientInteraction, getClientInteractions, getCompanyInteractions, createInteraction, deleteInteraction } from '@/lib/api/crm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MessageCircle, Phone, Mail, Calendar as CalendarIcon, FileText, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ClientTimelineProps {
  clientId?: string
  companyId?: string
}

export function ClientTimeline({ clientId, companyId }: ClientTimelineProps) {
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [notes, setNotes] = useState('')
  const [type, setType] = useState('WhatsApp')

  useEffect(() => {
    loadInteractions()
  }, [clientId, companyId])

  async function loadInteractions() {
    setLoading(true)
    try {
      let data: ClientInteraction[] = []
      if (clientId) {
        data = await getClientInteractions(clientId)
      } else if (companyId) {
        data = await getCompanyInteractions(companyId)
      }
      setInteractions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!notes.trim()) return
    setSaving(true)
    try {
      await createInteraction({
        client_id: clientId,
        company_id: companyId,
        interaction_type: type,
        notes,
        interaction_date: new Date().toISOString()
      })
      setNotes('')
      await loadInteractions()
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar anotação')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta anotação?')) return
    try {
      await deleteInteraction(id)
      await loadInteractions()
    } catch (error) {
      console.error(error)
    }
  }

  const getIcon = (t: string) => {
    switch (t) {
      case 'WhatsApp': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'Ligação': return <Phone className="w-4 h-4 text-blue-500" />
      case 'E-mail': return <Mail className="w-4 h-4 text-orange-500" />
      case 'Reunião': return <CalendarIcon className="w-4 h-4 text-purple-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#5C3D8F]">Histórico de Conversas (CRM)</CardTitle>
        <CardDescription>Registre combinados, preferências e orçamentos enviados.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Ligação">Ligação</SelectItem>
              <SelectItem value="E-mail">E-mail</SelectItem>
              <SelectItem value="Reunião">Reunião</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Textarea 
            placeholder="Ex: Cliente pediu para enviar a arte amanhã de manhã..." 
            className="flex-1 min-h-[40px] h-[40px]"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={saving || !notes.trim()} className="bg-[#5C3D8F] hover:bg-[#4a3173]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-[#5C3D8F]" /></div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {interactions.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">Nenhuma interação registrada ainda.</p>
            ) : (
              interactions.map(interaction => (
                <div key={interaction.id} className="flex gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                      {getIcon(interaction.interaction_type)}
                    </div>
                    <div className="w-px h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-3 group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-gray-700">{interaction.interaction_type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {format(new Date(interaction.interaction_date), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <button 
                          onClick={() => handleDelete(interaction.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{interaction.notes}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
