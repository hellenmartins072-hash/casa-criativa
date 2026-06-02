import { supabase } from '../supabase'

// --- Referral Coupons ---

export type ReferralCoupon = {
  id: string
  code: string
  client_id: string
  discount_percent: number
  credit_reward: number
  uses_count: number
  is_active: boolean
  created_at: string
}

export async function getReferralCoupons() {
  const { data, error } = await supabase
    .from('referral_coupons')
    .select(`
      *,
      clients(full_name, referral_credit)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching referral coupons:', error)
    return []
  }
  return data
}

export async function createReferralCoupon(coupon: {
  code: string
  client_id: string
  discount_percent: number
  credit_reward: number
}) {
  const { data, error } = await supabase
    .from('referral_coupons')
    .insert([coupon])
    .select()

  if (error) {
    console.error('Error creating referral coupon:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function toggleCouponStatus(id: string, is_active: boolean) {
  const { data, error } = await supabase
    .from('referral_coupons')
    .update({ is_active })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating coupon:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteReferralCoupon(id: string) {
  const { error } = await supabase
    .from('referral_coupons')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting coupon:', error)
    throw error
  }
  return true
}

export async function getCouponByCode(code: string) {
  const { data, error } = await supabase
    .from('referral_coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = zero rows
    console.error('Error fetching coupon code:', error)
  }
  return data
}

// --- WhatsApp Script Generator ---
export function generateWhatsAppBudgetScript(order: any) {
  const clientName = order.clients?.full_name || order.companies?.trading_name || order.companies?.business_name || 'Cliente'
  const itemsList = order.items?.map((item: any) => 
    `• ${item.quantity}x ${item.product_name} - R$ ${Number(item.total_price).toFixed(2).replace('.', ',')}`
  ).join('\n') || ''

  const subtotal = (order.total_amount + (order.discount_amount || 0)).toFixed(2).replace('.', ',')
  const total = Number(order.total_amount).toFixed(2).replace('.', ',')

  let discountText = ''
  if (Number(order.discount_amount) > 0) {
    discountText = `\n🎁 Desconto aplicado: - R$ ${Number(order.discount_amount).toFixed(2).replace('.', ',')}`
  }

  let text = `Olá, ${clientName}! Tudo bem? 🌟\n`
  text += `Aqui é da Casa Criativa e preparamos o seu orçamento com muito carinho.\n\n`
  text += `*RESUMO DO PEDIDO:*\n${itemsList}\n`
  
  if (discountText) {
    text += discountText
  }

  if (Number(order.shipping_cost) > 0) {
    text += `\n🚚 Frete / Entrega: R$ ${Number(order.shipping_cost).toFixed(2).replace('.', ',')}`
  }

  text += `\n\n*VALOR TOTAL: R$ ${total}*\n`
  
  if (Number(order.amount_paid) > 0) {
    const amountPaid = Number(order.amount_paid).toFixed(2).replace('.', ',')
    const remaining = Math.max(0, Number(order.total_amount) - Number(order.amount_paid)).toFixed(2).replace('.', ',')
    
    let dateText = ''
    if (order.entry_date) {
      // Usando formatação de data mais robusta para evitar problemas de fuso horário, mas considerando a string ISO YYYY-MM-DD
      const dateParts = order.entry_date.split('T')[0].split('-')
      if (dateParts.length === 3) {
        dateText = ` (em ${dateParts[2]}/${dateParts[1]}/${dateParts[0]})`
      }
    }
    
    text += `\n💰 Valor pago${dateText}: R$ ${amountPaid}`
    text += `\n⚠️ *Restante a pagar: R$ ${remaining}*\n`
  }

  text += `\n💳 *FORMAS DE PAGAMENTO:*\n`
  text += `• PIX (Chave: seucnpj@email.com)\n`
  text += `• Cartão (Consulte condições de parcelamento)\n\n`

  text += `⚠️ _Este orçamento é válido por 3 dias. A produção inicia mediante confirmação do pagamento (ou entrada)._\n\n`
  text += `Qualquer dúvida, estou à disposição para ajustarmos os detalhes! Podemos fechar o pedido? 🥰`

  return text
}
