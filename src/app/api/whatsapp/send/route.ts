import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/api/settings'

// Helper function to format phone number to international format without + or -
function formatWhatsAppNumber(phone: string) {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If the number doesn't start with 55 (Brazil country code), assume it's Brazilian and add it
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned
  }
  
  return cleaned
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetPhone, status, clientName, orderNumber } = body

    if (!targetPhone || !status || !clientName || !orderNumber) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const formattedPhone = formatWhatsAppNumber(targetPhone)

    // Get Settings
    const settings = await getSettings()
    
    if (!settings || !settings.wa_access_token || !settings.wa_phone_number_id) {
      return NextResponse.json({ error: 'WhatsApp API credentials not configured in settings.' }, { status: 400 })
    }

    // Determine the template based on status
    let templateName = ''
    if (status === 'Aprovado' || status === 'Novo') {
      templateName = settings.wa_template_approved || ''
    } else if (status === 'Em Produção') {
      templateName = settings.wa_template_production || ''
    } else if (status === 'Pronto para Entrega' || status === 'Pronto para Retirada') {
      templateName = settings.wa_template_ready || ''
    } else if (status === 'Entregue' || status === 'Concluído') {
      templateName = settings.wa_template_delivered || ''
    }

    if (!templateName) {
      return NextResponse.json({ error: `Nenhum nome de template configurado para o status: ${status}. Vá em Configurações > WhatsApp Oficial.` }, { status: 400 })
    }

    // Construct WhatsApp Cloud API payload
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'pt_BR'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(clientName).split(' ')[0] // Primeiro nome apenas
              },
              {
                type: 'text',
                text: String(orderNumber)
              }
            ]
          }
        ]
      }
    }

    const response = await fetch(`https://graph.facebook.com/v20.0/${settings.wa_phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.wa_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API Error:', responseData)
      return NextResponse.json({ 
        error: 'Erro na API do WhatsApp', 
        details: responseData.error?.message || responseData 
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Notificação enviada com sucesso.', data: responseData })

  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ error: 'Erro interno no servidor.', details: error.message }, { status: 500 })
  }
}
