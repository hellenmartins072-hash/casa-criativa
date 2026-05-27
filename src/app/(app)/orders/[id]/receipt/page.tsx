'use client'

import { useEffect, useState, use } from 'react'
import { getOrder, type Order } from '@/lib/api/orders'
import { getSettings, type Settings } from '@/lib/api/settings'
import { getStore } from '@/lib/api/stores'
import { Printer, MapPin, Phone, Building, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OrderReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [storeLogo, setStoreLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        const [data, settingsData] = await Promise.all([
          getOrder(resolvedParams.id),
          getSettings()
        ])
        setOrder(data)
        setSettings(settingsData)
        
        if (data.store_id) {
          try {
            const store = await getStore(data.store_id)
            if (store && store.logo_url) {
              setStoreLogo(store.logo_url)
            }
          } catch (e) {
            console.warn('Could not fetch store logo')
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  if (loading) {
    return <div className="p-10 text-center">Carregando recibo...</div>
  }

  if (!order) {
    return <div className="p-10 text-center text-red-500">Pedido não encontrado.</div>
  }

  const clientName = order.clients?.full_name || order.companies?.trading_name || order.companies?.business_name || order.resellers?.full_name || 'Cliente Removido'

  return (
    <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex items-center justify-center">
      
      {/* Botões Flutuantes (Escondidos na impressão) */}
      <div className="fixed top-4 right-4 print:hidden flex gap-2">
        <Button onClick={() => window.print()} className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
          <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
        </Button>
        <Button variant="outline" onClick={() => window.close()}>
          Fechar
        </Button>
      </div>

      <div className="w-full max-w-2xl bg-white mx-auto border border-gray-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: settings?.primary_color || '#5C3D8F' }}>
          <div>
            {(storeLogo || settings?.logo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storeLogo || settings?.logo_url || ''} alt="Logo" className="max-h-20 w-auto object-contain mb-2" />
            ) : (
              <h1 className="text-3xl font-black mb-1" style={{ color: settings?.primary_color || '#5C3D8F' }}>{settings?.business_name || 'CASA CRIATIVA'}</h1>
            )}
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {settings?.document_number && <p className="flex items-center"><Building className="w-4 h-4 mr-2" /> CNPJ: {settings.document_number}</p>}
              {settings?.address && <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {settings.address}</p>}
              {settings?.phone && <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {settings.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex justify-end items-center gap-2">RECIBO <CheckCircle className="h-6 w-6 text-green-600" /></h2>
            <p className="text-gray-500 font-mono mt-1 text-lg">Ped. #{order.order_number.toString().padStart(5, '0')}</p>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Data Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Corpo do Recibo */}
        <div className="my-10 text-center space-y-6">
          <p className="text-lg">Recebemos de <strong>{clientName}</strong>,</p>
          <div className="inline-block border-2 p-4 rounded-md" style={{ borderColor: settings?.primary_color || '#5C3D8F' }}>
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">A importância de</p>
            <p className="text-4xl font-bold text-gray-800">
               R$ {Number(order.amount_paid || order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-gray-600 max-w-lg mx-auto">
            Referente ao pagamento {order.payment_status === 'Pago Parcial' ? 'parcial (entrada/parcela)' : 'integral'} do pedido de venda <strong>#{order.order_number.toString().padStart(5, '0')}</strong>.
          </p>
        </div>

        {/* Detalhes do Pagamento */}
        <div className="bg-gray-50 p-6 rounded-md mb-8 border border-gray-100 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Forma de Pagamento</p>
            <p className="font-semibold text-gray-800">{order.payment_method || 'Não especificada'}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 mb-1">Data do Pagamento</p>
            <p className="font-semibold text-gray-800">{order.entry_date ? new Date(order.entry_date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        
        {/* Rodapé / Assinatura */}
        <div className="mt-20 flex justify-center">
           <div className="border-t border-gray-400 pt-2 w-2/3 text-center text-sm text-gray-600">
             <strong>{settings?.business_name || 'Casa Criativa'}</strong><br/>
             Assinatura do Recebedor
           </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:bg-white { background: white !important; }
        }
      `}} />
    </div>
  )
}
