import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Client = {
  id: string
  full_name: string
  whatsapp: string
  additional_phone?: string | null
  email?: string | null
  cpf?: string | null
  address?: string | null
  birth_date?: string | null
  children_birthdays?: any | null
  store_ids?: string[] | null
  client_type?: 'Varejo' | 'Revenda' | 'Corporativo'
  status?: 'Ativo' | 'Despedido'
  is_vip?: boolean
  preferred_payment?: 'PIX' | 'Cartão de crédito' | 'Cartão de débito' | 'Transferência' | 'Boleto' | 'Dinheiro' | null
  accepts_boleto?: boolean
  social_media?: string | null
  instagram?: string | null
  posts_products?: boolean
  discount_percentage?: number | null
  was_referred?: boolean
  referrer_name?: string | null
  company_id?: string | null
  notes?: string | null
  internal_alert?: string | null
  created_at?: string
}

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select(`*`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    throw error
  }
  return data
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    throw error
  }
  return data
}

export async function createClient(client: Partial<Client>) {
  const payload = { ...client }
  if (payload.birth_date === '') payload.birth_date = null

  const { data, error } = await supabase
    .from('clients')
    .insert([payload])
    .select()

  if (error) {
    console.error('Error creating client:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateClient(id: string, client: Partial<Client>) {
  const payload = { ...client }
  if (payload.birth_date === '') payload.birth_date = null

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating client:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    throw error
  }
  return true
}
