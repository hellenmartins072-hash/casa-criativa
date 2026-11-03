'use client'

import { useEffect, useState, use } from 'react'
import { getOrder, getOrderHistory, type Order, type OrderHistory } from '@/lib/api/orders'
import { getSettings, type Settings } from '@/lib/api/settings'
import { getStore } from '@/lib/api/stores'
import { Printer, MapPin, Phone, Building, Calendar, CreditCard, Clock, FileText, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OrderPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<OrderHistory[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [storeLogo, setStoreLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [data, settingsData, historyData] = await Promise.all([
          getOrder(resolvedParams.id),
          getSettings(),
          getOrderHistory(resolvedParams.id)
        ])
        setOrder(data)
        setSettings(settingsData)
        setHistory(historyData)

        // Nome do arquivo ao baixar/imprimir em PDF
        if (data) {
          const rawClient =
            data.clients?.full_name ||
            data.companies?.trading_name ||
            data.companies?.business_name ||
            data.resellers?.full_name ||
            'Cliente'
          const cleanClient = rawClient
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[/\\?%*:|"<>]/g, '')
            .replace(/\s+/g, '_')
            .trim()
          const num = data.order_number
            ? data.order_number.toString().padStart(5, '0')
            : data.id.slice(0, 5)

          document.title = `Orcamento-${num}-${cleanClient}`
        }

        if (data.store_id) {
          try {
            const store = await getStore(data.store_id)
            if (store && store.logo_url) {
              setStoreLogo(store.logo_url)
            }
          } catch (e) {
            console.warn('Could not fetch store logo', e)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar orçamento:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C3D8F] border-t-transparent mb-3" />
        <p className="font-medium text-sm">Carregando orçamento para impressão...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border max-w-md">
          <p className="text-red-500 font-semibold mb-2">Orçamento ou Pedido não encontrado.</p>
          <Button variant="outline" onClick={() => window.close()}>
            Fechar Janela
          </Button>
        </div>
      </div>
    )
  }

  const clientName =
    order.clients?.full_name ||
    order.companies?.trading_name ||
    order.companies?.business_name ||
    order.resellers?.full_name ||
    'Cliente não informado'

  const clientCpfCnpj = order.clients?.cpf || order.companies?.cnpj
  const clientPhone =
    order.clients?.whatsapp ||
    order.companies?.phone ||
    order.resellers?.whatsapp ||
    order.resellers?.phone
  const clientEmail = order.clients?.email
  const clientAddress = order.clients?.address || order.companies?.address

  const docTitle = order.status === 'Orçamento' ? 'PROPOSTA COMERCIAL / ORÇAMENTO' : 'PEDIDO DE VENDA'
  const primaryColor = settings?.primary_color || '#5C3D8F'

  return (
    <div className="min-h-screen bg-neutral-100 text-gray-900 print:bg-white print:min-h-0">
      {/* Barra de Ações Superior (Apenas em tela, oculta no PDF) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-xs print:hidden px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">
              Visualização de Impressão (A4)
            </span>
            <span className="text-xs bg-[#5C3D8F]/10 text-[#5C3D8F] font-semibold px-2 py-0.5 rounded-full">
              #{order.order_number.toString().padStart(5, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] text-gray-500 hidden md:inline">
              💡 Para salvar em arquivo: escolha <strong>&quot;Salvar como PDF&quot;</strong> na janela de impressão.
            </span>
            <Button
              onClick={() => window.print()}
              className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white font-semibold shadow-xs"
              size="sm"
            >
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir / Salvar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.close()}
              title="Fechar esta aba"
            >
              <X className="h-4 w-4 mr-1" /> Fechar
            </Button>
          </div>
        </div>
      </header>

      {/* Folha do Orçamento (Formato A4) */}
      <main className="max-w-4xl mx-auto my-6 bg-white border border-gray-200 shadow-sm p-8 sm:p-10 rounded-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full print:w-full print-document">
        {/* Cabeçalho */}
        <div
          className="flex justify-between items-start border-b-2 pb-5 mb-5 print-avoid-break"
          style={{ borderColor: primaryColor }}
        >
          <div className="max-w-[55%]">
            {storeLogo || settings?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeLogo || settings?.logo_url || ''}
                alt="Logo da Loja"
                className="max-h-16 w-auto object-contain mb-2"
                crossOrigin="anonymous"
              />
            ) : (
              <h1 className="text-2xl font-black mb-1 tracking-tight" style={{ color: primaryColor }}>
                {settings?.business_name || 'CASA CRIATIVA'}
              </h1>
            )}
            <div className="mt-1 space-y-0.5 text-xs text-gray-600 leading-relaxed">
              {settings?.document_number && (
                <p className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>CNPJ: {settings.document_number}</span>
                </p>
              )}
              {settings?.address && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{settings.address}</span>
                </p>
              )}
              {settings?.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{settings.phone}</span>
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <span
              className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider text-white mb-1"
              style={{ backgroundColor: primaryColor }}
            >
              {docTitle}
            </span>
            <p className="text-gray-700 font-mono text-xl font-bold">
              #{order.order_number.toString().padStart(5, '0')}
            </p>

            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>
                <strong>Emissão:</strong>{' '}
                {new Date(order.quote_date || order.created_at).toLocaleDateString('pt-BR')}
              </p>
              {order.order_date && (
                <p>
                  <strong>Aprovação:</strong>{' '}
                  {new Date(order.order_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              <p className="text-sm font-semibold text-gray-800 pt-0.5">
                <strong>Prazo de Entrega:</strong>{' '}
                <span className="text-[#5C3D8F]">
                  {order.deadline
                    ? new Date(order.deadline).toLocaleDateString('pt-BR')
                    : 'A combinar'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-gray-50/80 p-4 rounded-md mb-6 border border-gray-200 print-avoid-break">
          <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Dados do Cliente
            </h2>
            {order.status && (
              <span className="text-[11px] font-semibold text-gray-600">
                Status: <strong className="text-gray-900">{order.status}</strong>
              </span>
            )}
          </div>

          <p className="text-base font-bold text-gray-900">{clientName}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-600">
            {clientCpfCnpj && (
              <p>
                <strong>CPF/CNPJ:</strong> {clientCpfCnpj}
              </p>
            )}
            {clientPhone && (
              <p>
                <strong>WhatsApp / Tel:</strong> {clientPhone}
              </p>
            )}
            {clientEmail && (
              <p className="truncate">
                <strong>E-mail:</strong> {clientEmail}
              </p>
            )}
            {clientAddress && (
              <p className="sm:col-span-2 md:col-span-3">
                <strong>Endereço:</strong> {clientAddress}
              </p>
            )}
          </div>
        </div>

        {/* Tabela de Itens com Imagens Anexadas */}
        <div className="mb-6">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-white" style={{ backgroundColor: primaryColor }}>
                <th className="p-2.5 text-center font-bold w-12 rounded-tl-sm">Qtd</th>
                <th className="p-2.5 text-left font-bold">Descrição do Item / Imagens</th>
                <th className="p-2.5 text-right font-bold w-24">Valor Unit.</th>
                <th className="p-2.5 text-right font-bold w-28 rounded-tr-sm">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-x border-b border-gray-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, i) => (
                  <tr key={i} className="print-avoid-break">
                    <td className="p-2.5 font-bold text-center align-top text-gray-800 bg-gray-50/30">
                      {item.quantity}x
                    </td>
                    <td className="p-2.5 align-top">
                      <p className="font-bold text-gray-900 text-sm">{item.product_name}</p>
                      {item.notes && (
                        <p className="text-gray-600 text-xs mt-1 italic whitespace-pre-wrap leading-relaxed">
                          {item.notes}
                        </p>
                      )}

                      {/* Imagens Anexadas ao Item */}
                      {item.image_urls && item.image_urls.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2.5 mt-2.5 pt-2 border-t border-gray-100">
                          {item.image_urls.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="flex flex-col items-center border border-gray-200 rounded-md bg-gray-50/70 p-1 shadow-2xs"
                              title="Foto anexada ao item"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt={`${item.product_name} - Foto ${imgIdx + 1}`}
                                className="h-20 w-auto max-w-[130px] object-contain rounded"
                                crossOrigin="anonymous"
                                loading="eager"
                              />
                              {item.image_urls!.length > 1 && (
                                <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                                  Foto {imgIdx + 1}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-right align-top text-gray-700 whitespace-nowrap">
                      R$ {Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-right font-bold align-top text-gray-900 whitespace-nowrap bg-gray-50/30">
                      R$ {Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Nenhum item adicionado a este orçamento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo Financeiro / Totais */}
        <div className="flex justify-end mb-6 print-avoid-break">
          <div className="w-full sm:w-1/2 md:w-5/12 bg-gray-50/80 border border-gray-200 rounded-md p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal dos Itens:</span>
              <span className="font-medium text-gray-800">
                R${' '}
                {order.items
                  ?.reduce((acc, i) => acc + Number(i.total_price || 0), 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto Aplicado:</span>
                <span className="font-medium">
                  - R${' '}
                  {Number(order.discount_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {Number(order.shipping_cost) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Frete / Entrega:</span>
                <span className="font-medium text-gray-800">
                  + R${' '}
                  {Number(order.shipping_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {Number(order.credit_fee) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Taxas de Cartão:</span>
                <span className="font-medium">
                  + R${' '}
                  {Number(order.credit_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div
              className="flex justify-between text-base font-black pt-2 border-t-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              <span>VALOR TOTAL:</span>
              <span>
                R${' '}
                {Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {Number(order.amount_paid) > 0 && (
              <div className="pt-2 mt-1 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>
                    Valor Pago{' '}
                    {order.entry_date
                      ? `(${new Date(order.entry_date).toLocaleDateString('pt-BR')})`
                      : ''}
                    :
                  </span>
                  <span>
                    R${' '}
                    {Number(order.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-red-600 font-bold text-sm">
                  <span>Restante a Pagar:</span>
                  <span>
                    R${' '}
                    {Math.max(
                      0,
                      Number(order.total_amount) - Number(order.amount_paid)
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Condições de Pagamento, Prazo e Observações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-4 text-xs print-avoid-break">
          {/* Informações de Pagamento e Prazo */}
          <div className="md:col-span-2 space-y-2 text-gray-600">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] border-b pb-1">
              Condições e Observações
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              <p>
                <strong>Forma de Pagamento:</strong>{' '}
                <span className="text-gray-900 font-medium">
                  {order.payment_method || 'A combinar'}
                </span>
                {order.payment_method?.includes('Cartão') && order.credit_installments ? (
                  <span> ({order.credit_installments}x)</span>
                ) : null}
              </p>
              <p>
                <strong>Prazo de Entrega:</strong>{' '}
                <span className="text-gray-900 font-semibold">
                  {order.deadline
                    ? new Date(order.deadline).toLocaleDateString('pt-BR')
                    : 'A combinar'}
                </span>
              </p>
            </div>

            {order.payment_notes && (
              <p className="bg-gray-50 p-2 rounded border border-gray-200 text-gray-700">
                <strong>Detalhes de Pagamento:</strong> {order.payment_notes}
              </p>
            )}

            <div className="pt-1">
              {order.notes ? (
                <p className="whitespace-pre-wrap italic text-gray-700 leading-relaxed">
                  {order.notes}
                </p>
              ) : (
                <p className="text-gray-500 italic">
                  Proposta comercial válida por 3 dias úteis. A produção inicia mediante confirmação do sinal
                  e aprovação final das artes/modelos.
                </p>
              )}
            </div>
          </div>

          {/* Dados Bancários para Pagamento */}
          {settings && (settings.bank_name || settings.bank_pix) ? (
            <div className="bg-gray-50/80 p-3.5 rounded-md border border-gray-200 space-y-1 text-gray-600">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] border-b pb-1 mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#5C3D8F]" /> Dados Bancários
              </h4>
              {settings.bank_name && (
                <p>
                  <strong>Banco:</strong> {settings.bank_name}
                </p>
              )}
              {settings.bank_account_name && (
                <p>
                  <strong>Titular:</strong> {settings.bank_account_name}
                </p>
              )}
              {settings.bank_agency && (
                <p>
                  <strong>Agência:</strong> {settings.bank_agency}
                </p>
              )}
              {settings.bank_account && (
                <p>
                  <strong>Conta:</strong> {settings.bank_account}
                </p>
              )}
              {settings.bank_pix && (
                <div className="mt-2 text-green-800 bg-green-50 p-1.5 rounded font-bold border border-green-200 text-center text-xs">
                  Chave PIX: {settings.bank_pix}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Linhas de Assinatura */}
        <div className="mt-12 pt-6 flex justify-between px-6 sm:px-12 text-center text-xs text-gray-500 print-avoid-break">
          <div className="border-t border-gray-400 pt-1.5 w-5/12">
            <span className="font-semibold text-gray-700">
              {settings?.business_name || 'Casa Criativa'}
            </span>
            <br />
            <span className="text-[10px] text-gray-400">Emissor</span>
          </div>
          <div className="border-t border-gray-400 pt-1.5 w-5/12">
            <span className="font-semibold text-gray-700">{clientName}</span>
            <br />
            <span className="text-[10px] text-gray-400">De Acordo / Aceite do Cliente</span>
          </div>
        </div>
      </main>

      {/* Regras de Estilo de Impressão (CSS Exclusivo para A4 sem corte e sem tela inteira) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }

        @media print {
          /* Reset total da página para não herdar tela inteira */
          html, body {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Oculta tudo que não for o documento */
          .print\\:hidden,
          header,
          nav,
          aside,
          button {
            display: none !important;
          }

          /* Garante que o documento use largura total e sem molduras de tela */
          .print-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          /* Evita quebras indesejadas no meio de itens, imagens ou totais */
          tr, .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Imagens proporcionais e nítidas */
          img {
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Remove qualquer margem final que gerava página em branco */
          main:last-child,
          div:last-child {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
        }
      `
        }}
      />
    </div>
  )
}
