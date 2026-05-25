import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Usamos Service Role para extrair os dados livremente nesta rota de Cron
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function GET(request: Request) {
  try {
    // 1. Obter configurações de e-mail e chaves
    const { data: settings } = await supabase.from('settings').select('*').single()
    
    const resendKey = settings?.resend_api_key || process.env.RESEND_API_KEY
    const backupEmail = settings?.backup_email || 'seu-email@dominio.com'

    if (!resendKey) {
      return NextResponse.json({ error: 'Resend API Key not configured' }, { status: 500 })
    }

    const resend = new Resend(resendKey)

    // 2. Extrair dados cruciais: Clientes e Pedidos
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: orders } = await supabase.from('orders').select('*')

    // 3. Converter para CSV rudimentar
    const clientsCSV = [
      'ID,Nome,WhatsApp,CPF,Email',
      ...(clients || []).map(c => `${c.id},"${c.full_name || ''}","${c.whatsapp || ''}","${c.cpf || ''}","${c.email || ''}"`)
    ].join('\n')

    const ordersCSV = [
      'ID,Numero,Cliente_ID,Status,Total,Data',
      ...(orders || []).map(o => `${o.id},${o.order_number || ''},${o.client_id || ''},"${o.status || ''}",${o.total_amount || 0},"${o.created_at || ''}"`)
    ].join('\n')

    // 4. Enviar e-mail com anexos
    const { data, error } = await resend.emails.send({
      from: 'Backup Casa Criativa <onboarding@resend.dev>', // Email padrão de dev do Resend (só manda pra verificados)
      to: [backupEmail],
      subject: `Backup Automático do Sistema - ${new Date().toLocaleDateString('pt-BR')}`,
      text: 'Segue em anexo o backup semanal dos clientes e pedidos cadastrados.',
      attachments: [
        {
          filename: `clientes-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(clientsCSV).toString('base64'),
        },
        {
          filename: `pedidos-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(ordersCSV).toString('base64'),
        }
      ]
    })

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Backup enviado com sucesso!' })
  } catch (error: any) {
    console.error('Error in /api/cron/backup:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
