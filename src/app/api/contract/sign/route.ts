import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usamos Service Role para ignorar RLS nesta rota pública controlada
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback if no service key

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(request: Request) {
  try {
    const { orderId, signatureUrl, ip } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        contract_accepted_at: new Date().toISOString(),
        contract_signature_url: signatureUrl || null,
        contract_ip: ip
      })
      .eq('id', orderId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in /api/contract/sign:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
