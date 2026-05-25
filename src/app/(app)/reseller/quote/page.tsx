'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Loader2, Plus, Trash2 } from "lucide-react"

export default function ResellerQuote() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([{ product_name: "", quantity: 1, notes: "" }])

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
        if (data?.role !== 'reseller') {
          router.push('/')
        } else {
          setProfile(data)
        }
      }
    }
    loadProfile()
  }, [router])

  const handleAddItem = () => {
    setItems([...items, { product_name: "", quantity: 1, notes: "" }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    
    // Validar itens
    const validItems = items.filter(i => i.product_name.trim() !== '')
    if (validItems.length === 0) {
      alert("Adicione pelo menos um produto para orçar.")
      return
    }

    setLoading(true)
    try {
      // 1. Criar o pedido (status Orçamento)
      const orderNumber = Math.floor(1000 + Math.random() * 9000).toString()
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          client_id: profile.client_id,
          company_id: profile.company_id,
          status: 'Orçamento',
          notes: `[SOLICITAÇÃO DE REVENDEDOR]\n${notes}`,
          total_amount: 0 // Será precificado pelo Admin
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Inserir os itens do pedido
      const orderItems = validItems.map(item => ({
        order_id: orderData.id,
        product_name: item.product_name,
        quantity: item.quantity,
        notes: item.notes,
        unit_price: 0,
        total_price: 0
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      alert("Orçamento solicitado com sucesso! Nossa equipe irá precificar e você poderá visualizar em Meus Pedidos.")
      router.push('/reseller/orders')
      
    } catch (err) {
      console.error(err)
      alert("Erro ao enviar solicitação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Solicitar Orçamento</h2>
        <p className="text-muted-foreground">
          Preencha os itens desejados. Nossa equipe irá precificar e você receberá uma notificação.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            
            <div className="space-y-4 border-b pb-6">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-[#5C3D8F]">Itens do Orçamento</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                  <Plus className="h-4 w-4" /> Adicionar Linha
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-md border border-gray-100">
                  <div className="grid gap-3 flex-1">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-9 space-y-1">
                        <Label className="text-xs text-muted-foreground">Produto / Descrição do que você precisa</Label>
                        <Input 
                          placeholder="Ex: 50 Caixas de Acrílico 5x5cm"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Qtd</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Detalhes adicionais (Cores, Acabamento, Tema)</Label>
                      <Input 
                        placeholder="Ex: Tampa rosa bebê, gravação a laser dourada"
                        value={item.notes}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="text-red-400 mt-5" onClick={() => handleRemoveItem(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Observações Gerais / Prazo desejado</Label>
              <Textarea 
                placeholder="Qualquer outra informação importante para a precificação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
              <strong>Nota:</strong> Para anexar arquivos (Logos, Artes, Referências), você poderá fazer isso na página de detalhes do pedido após enviar esta solicitação.
            </div>

          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4 flex justify-end gap-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar Solicitação de Orçamento
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
