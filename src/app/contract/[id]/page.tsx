'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getOrderById, Order, OrderItem } from '@/lib/api/orders'
import { getSettings } from '@/lib/api/settings'
import { Loader2, CheckCircle2, UploadCloud } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ContractPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [accepting, setAccepting] = useState(false)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const o = await getOrderById(id as string)
        if (!o) throw new Error('Pedido não encontrado')
        setOrder(o.order)
        setItems(o.items)
        
        const s = await getSettings()
        setSettings(s)
        
        if (o.order.contract_accepted_at) {
          setAccepted(true)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      let signatureUrl = null
      
      // Se houver arquivo de assinatura, faz o upload para o Storage
      if (signatureFile) {
        const fileExt = signatureFile.name.split('.').pop()
        const fileName = `${order?.id}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(fileName, signatureFile)
          
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('signatures')
          .getPublicUrl(fileName)
          
        signatureUrl = publicUrl
      }
      
      // Buscar IP do usuário (opcional e simples)
      let ip = 'IP Desconhecido'
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipRes.json()
        ip = ipData.ip
      } catch (e) {
        console.warn('Could not fetch IP')
      }

      // Atualizar o banco de dados via rota de API ou chamada direta
      // Neste caso, como a rota é pública e o supabase client do navegador precisa ter acesso,
      // se a RLS do orders permitir update público (perigoso), seria direto.
      // O ideal é chamar uma API Route que usa o Service Role.
      
      const res = await fetch('/api/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id,
          signatureUrl,
          ip
        })
      })
      
      if (!res.ok) throw new Error('Falha ao processar assinatura.')
      
      setAccepted(true)
    } catch (err: any) {
      alert('Erro: ' + err.message)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-[#5C3D8F]" /></div>
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-red-500 font-bold">{error}</div>
  }

  const clientName = order?.clients?.full_name || order?.companies?.business_name || 'Cliente'
  const clientDoc = order?.clients?.cpf || order?.companies?.cnpj || 'Não informado'
  const clientAddress = order?.clients?.address || order?.companies?.address || 'Não informado'

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex items-start justify-center">
      <Card className="max-w-4xl w-full shadow-lg">
        <CardHeader className="border-b bg-white rounded-t-xl text-center pb-8 pt-8">
          {settings?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt="Logo" className="mx-auto h-16 object-contain mb-4" />
          )}
          <CardTitle className="text-2xl font-bold text-gray-800 uppercase tracking-wider">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS
          </CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            Pedido #{order?.order_number}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 md:p-10 space-y-8 bg-white text-sm text-gray-700 leading-relaxed text-justify">
          
          <section>
            <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">1. As Partes</h3>
            <p>
              Pelo presente instrumento particular, de um lado <strong>{settings?.business_name || 'Casa Criativa'}</strong>, 
              inscrita no CNPJ/CPF sob o nº {settings?.document_number || 'N/A'}, com sede em {settings?.address || 'Endereço não informado'}, 
              doravante denominada <strong>CONTRATADA</strong>, e do outro lado <strong>{clientName}</strong>, 
              inscrito(a) no CPF/CNPJ sob o nº {clientDoc}, residente e domiciliado(a) em {clientAddress}, doravante denominado(a) <strong>CONTRATANTE</strong>.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">2. O Objeto</h3>
            <p className="mb-4">
              O presente contrato tem como objeto a confecção e/ou fornecimento dos seguintes produtos/serviços:
            </p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3">Qtd</th>
                    <th className="p-3 text-right">Valor Unit.</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-3 font-medium text-gray-900">
                        {item.product_name}
                        {item.notes && <div className="text-xs text-gray-500 font-normal mt-1">{item.notes}</div>}
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3 text-right">R$ {Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-medium">R$ {Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">3. Valores e Condições de Pagamento</h3>
            <p>
              O valor total do presente contrato é de <strong>R$ {Number(order?.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, 
              a ser pago via {order?.payment_method || 'PIX/Transferência'}, conforme as seguintes observações: {order?.payment_notes || 'Pagamento conforme combinado.'}
            </p>
            <p className="mt-2">
              Frete/Entrega: R$ {Number(order?.shipping_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              {order?.discount_amount > 0 && ` | Desconto: R$ ${Number(order.discount_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">4. Prazos</h3>
            <p>
              O prazo estipulado para a entrega dos produtos/serviços é até <strong>{order?.deadline ? new Date(order.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'data a combinar'}</strong>.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs tracking-wider">5. Disposições Gerais</h3>
            <p>
              As partes declaram estar de acordo com todas as cláusulas e condições estabelecidas neste instrumento. 
              Em caso de desistência por parte do CONTRATANTE após o início da confecção, os valores já pagos a título de sinal não serão reembolsados, 
              servindo para cobrir custos de material e hora técnica.
            </p>
          </section>

        </CardContent>

        <CardFooter className="bg-gray-50 border-t p-6 rounded-b-xl flex flex-col items-center justify-center text-center space-y-6">
          {accepted ? (
            <div className="flex flex-col items-center text-green-600 bg-green-50 p-6 rounded-lg w-full border border-green-200">
              <CheckCircle2 className="w-12 h-12 mb-2" />
              <h3 className="text-xl font-bold mb-1">Contrato Assinado Digitalmente</h3>
              <p className="text-sm text-green-800">
                Aceito em {new Date(order?.contract_accepted_at || '').toLocaleString('pt-BR')}
              </p>
              {order?.contract_ip && (
                <p className="text-xs text-green-700/60 mt-1">IP registrado: {order.contract_ip}</p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-2 text-left">
                <label className="font-bold text-gray-700 text-sm">Upload de Assinatura (Opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors relative">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500 text-center">
                    {signatureFile ? signatureFile.name : 'Clique para enviar foto da sua assinatura'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setSignatureFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAccept} 
                disabled={accepting}
                className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] text-white py-6 text-lg font-bold shadow-lg"
              >
                {accepting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Li e Aceito os Termos'}
              </Button>
              <p className="text-xs text-gray-500">
                Ao clicar em aceitar, seu IP e data/hora serão registrados com validade jurídica como aceite eletrônico.
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
