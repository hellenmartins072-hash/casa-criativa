'use client'

import { useEffect, useState, use } from 'react'
import { getOrder, type Order } from '@/lib/api/orders'
import { Printer, MapPin, Phone, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OrderPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        const data = await getOrder(resolvedParams.id)
        setOrder(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  if (loading) {
    return <div className="p-10 text-center">Carregando documento...</div>
  }

  if (!order) {
    return <div className="p-10 text-center text-red-500">Pedido não encontrado.</div>
  }

  const clientName = order.clients?.full_name || order.companies?.business_name || 'Cliente Removido'
  // Identifica se é orçamento ou pedido firme
  const docTitle = order.status === 'Orçamento' ? 'PROPOSTA COMERCIAL / ORÇAMENTO' : 'PEDIDO DE VENDA'

  return (
    <div className="bg-white min-h-screen p-8 print:p-0">
      
      {/* Botões Flutuantes (Escondidos na impressão) */}
      <div className="fixed top-4 right-4 print:hidden flex gap-2">
        <Button onClick={() => window.print()} className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
          <Printer className="mr-2 h-4 w-4" /> Imprimir / Gerar PDF
        </Button>
        <Button variant="outline" onClick={() => window.close()}>
          Fechar
        </Button>
      </div>

      <div className="max-w-4xl mx-auto border border-gray-200 p-8 print:border-none print:p-0">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start border-b-2 border-[#5C3D8F] pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#5C3D8F] mb-1">CASA CRIATIVA</h1>
            <p className="text-gray-500 text-sm">Presentes Corporativos e Personalizados</p>
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <p className="flex items-center"><Building className="w-4 h-4 mr-2" /> CNPJ: 00.000.000/0001-00</p>
              <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> Rua das Flores, 123 - Centro</p>
              <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> (11) 99999-9999</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{docTitle}</h2>
            <p className="text-gray-500 font-mono mt-1 text-lg">#{order.order_number.toString().padStart(5, '0')}</p>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Emissão:</strong> {new Date(order.created_at).toLocaleDateString('pt-BR')}
            </p>
            {order.deadline && (
              <p className="text-sm text-gray-600">
                <strong>Previsão/Validade:</strong> {new Date(order.deadline).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-100">
          <h3 className="font-bold text-gray-800 border-b pb-2 mb-2">DADOS DO CLIENTE</h3>
          <p className="text-lg font-semibold text-[#5C3D8F]">{clientName}</p>
          <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
            {order.clients?.whatsapp && <p><strong>WhatsApp:</strong> {order.clients.whatsapp}</p>}
            {order.clients?.email && <p><strong>E-mail:</strong> {order.clients.email}</p>}
            {order.companies?.cnpj && <p><strong>CNPJ:</strong> {order.companies.cnpj}</p>}
            {order.companies?.phone && <p><strong>Telefone:</strong> {order.companies.phone}</p>}
          </div>
        </div>

        {/* Tabela de Itens */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#5C3D8F] text-white">
                <th className="p-3 text-left font-semibold">Qtd</th>
                <th className="p-3 text-left font-semibold">Descrição do Item</th>
                <th className="p-3 text-right font-semibold">Valor Unit.</th>
                <th className="p-3 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="p-3 font-medium align-top">{item.quantity}x</td>
                  <td className="p-3 align-top">
                    <p className="font-bold text-gray-800">{item.product_name}</p>
                    {item.notes && <p className="text-gray-500 text-xs mt-1 italic">{item.notes}</p>}
                  </td>
                  <td className="p-3 text-right align-top">
                    R$ {Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-semibold align-top text-gray-800">
                    R$ {Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2 md:w-1/3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>R$ {order.items?.reduce((acc, i) => acc + Number(i.total_price), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Desconto:</span>
                <span>- R$ {Number(order.discount_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {order.shipping_cost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Frete:</span>
                <span>+ R$ {Number(order.shipping_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-[#5C3D8F] pt-2 border-t-2 border-[#5C3D8F]">
              <span>TOTAL:</span>
              <span>R$ {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Rodapé / Termos */}
        <div className="text-sm text-gray-500 border-t border-gray-200 pt-6">
          <h4 className="font-bold text-gray-800 mb-2">CONDIÇÕES GERAIS E OBSERVAÇÕES</h4>
          <p className="mb-2"><strong>Pagamento:</strong> {order.payment_method || 'A combinar'} - Status: {order.payment_status}</p>
          {order.notes ? (
            <p className="whitespace-pre-wrap italic">{order.notes}</p>
          ) : (
            <p>Este orçamento tem validade de 7 dias úteis. A produção inicia apenas após a confirmação do pagamento e aprovação das artes.</p>
          )}
        </div>
        
        <div className="mt-20 pt-8 flex justify-between px-10 text-center text-sm text-gray-400">
           <div className="border-t border-gray-400 pt-2 w-1/3">
             Assinatura Casa Criativa
           </div>
           <div className="border-t border-gray-400 pt-2 w-1/3">
             Assinatura / De Acordo (Cliente)
           </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}} />
    </div>
  )
}
