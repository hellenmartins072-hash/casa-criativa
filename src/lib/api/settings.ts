import { supabase } from '../supabase'

// --- Configurações da Empresa ---
export type Settings = {
  id: number
  business_name: string
  document_number?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo_url?: string | null
  
  // Lote 2 & 4
  bank_name?: string | null
  bank_account_name?: string | null
  bank_pix?: string | null
  bank_agency?: string | null
  bank_account?: string | null
  primary_color?: string | null
  // WhatsApp API Settings
  wa_access_token?: string | null
  wa_phone_number_id?: string | null
  wa_template_approved?: string | null
  wa_template_production?: string | null
  wa_template_ready?: string | null
  wa_template_delivered?: string | null

  // Metas
  monthly_revenue_goal?: number | null

  // Alertas CRM e Backup (Fase 17)
  inactive_client_days?: number | null
  followup_days?: number | null
  backup_email?: string | null
  resend_api_key?: string | null

  updated_at?: string
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Error fetching settings:', error)
    return null
  }
  return data as Settings
}

export async function updateSettings(settings: Partial<Settings>) {
  const { data, error } = await supabase
    .from('settings')
    .update(settings)
    .eq('id', 1)
    .select()

  if (error) {
    console.error('Error updating settings:', error)
    throw error
  }
  return data ? (data[0] as Settings) : null
}

export async function uploadLogo(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `logo_${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(fileName, file)

  if (uploadError) {
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName)

  return publicUrl
}

// --- Taxas de Pagamento e Plataformas ---
export type PaymentFee = {
  id: string
  name: string
  type: 'Maquininha' | 'Plataforma' | 'Link de Pagamento' | 'Outros'
  percentage_fee: number
  fixed_fee: number
  is_active: boolean
  created_at?: string
}

export async function getFees() {
  const { data, error } = await supabase
    .from('payment_fees')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching fees:', error)
    throw error
  }
  return data as PaymentFee[]
}

export async function createFee(fee: Partial<PaymentFee>) {
  const { data, error } = await supabase
    .from('payment_fees')
    .insert([fee])
    .select()

  if (error) {
    console.error('Error creating fee:', error)
    throw error
  }
  return data ? (data[0] as PaymentFee) : null
}

export async function updateFee(id: string, fee: Partial<PaymentFee>) {
  const { data, error } = await supabase
    .from('payment_fees')
    .update(fee)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating fee:', error)
    throw error
  }
  return data ? (data[0] as PaymentFee) : null
}

export async function deleteFee(id: string) {
  const { error } = await supabase
    .from('payment_fees')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting fee:', error)
    throw error
  }
  return true
}
