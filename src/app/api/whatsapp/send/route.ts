import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/api/settings'

export async function POST(request: Request) {
  try {
    const { phone, clientName, orderNumber, status } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Telefone não informado' }, { status: 400 })
    }

    const settings = await getSettings()
    
    if (!settings || !settings.wa_access_token || !settings.wa_phone_number_id) {
      return NextResponse.json({ error: 'WhatsApp não configurado nas configurações gerais.' }, { status: 500 })
    }

    // Identificar qual template usar baseado no status
    let templateName = ''
    if (status === 'Aprovado') templateName = settings.wa_template_approved || ''
    else if (status === 'Em Produção') templateName = settings.wa_template_production || ''
    else if (status === 'Finalizado') templateName = settings.wa_template_ready || ''
    else if (status === 'Entregue') templateName = settings.wa_template_delivered || ''

    if (!templateName) {
      // Se não houver template para esse status, não faz nada
      return NextResponse.json({ success: true, ignored: true })
    }

    // Formatar número de telefone: remover não-dígitos e garantir que tem o código do país (55)
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = `55${formattedPhone}`
    }

    // Disparar requisição para a Graph API da Meta
    const url = `https://graph.facebook.com/v19.0/${settings.wa_phone_number_id}/messages`
    
    const body = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "pt_BR"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: clientName || "Cliente"
              },
              {
                type: "text",
                text: orderNumber || ""
              }
            ]
          }
        ]
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.wa_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Meta API Error:', data)
      throw new Error(data.error?.message || 'Erro na API do WhatsApp')
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Error sending WhatsApp:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
