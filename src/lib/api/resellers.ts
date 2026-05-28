import { supabase } from '../supabase'

export type Reseller = {
  id: string
  user_id?: string | null
  full_name: string
  document_number?: string | null
  address?: string | null
  phone?: string | null
  whatsapp?: string | null
  social_media?: string | null
  bank_details?: string | null
  notes?: string | null
  birth_date?: string | null
  status: 'Ativo' | 'Inativo' | 'Suspenso'
  discount_percentage: number
  created_at?: string
  updated_at?: string
}

export async function getResellers() {
  const { data, error } = await supabase
    .from('resellers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching resellers:', error)
    return []
  }
  return data as Reseller[]
}

export async function createReseller(reseller: Partial<Reseller>) {
  const payload = { ...reseller }
  if (payload.birth_date === '') payload.birth_date = null

  const { data, error } = await supabase
    .from('resellers')
    .insert([payload])
    .select()

  if (error) {
    console.error('Error creating reseller:', error)
    throw error
  }
  return data[0] as Reseller
}

export async function updateReseller(id: string, reseller: Partial<Reseller>) {
  const payload = { ...reseller }
  if (payload.birth_date === '') payload.birth_date = null

  const { data, error } = await supabase
    .from('resellers')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating reseller:', error)
    throw error
  }
  return data[0] as Reseller
}

export async function deleteReseller(id: string) {
  const { error } = await supabase
    .from('resellers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting reseller:', error)
    throw error
  }
}
