import { supabase } from '../supabase'

export type ShippingPartner = {
  id: string
  name: string
  phone?: string | null
  base_fee?: number | null
  notes?: string | null
  created_at?: string
}

export async function getShippingPartners() {
  const { data, error } = await supabase
    .from('shipping_partners')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching shipping partners:', error)
    throw error
  }
  return data as ShippingPartner[]
}

export async function createShippingPartner(partner: Partial<ShippingPartner>) {
  const { data, error } = await supabase
    .from('shipping_partners')
    .insert([partner])
    .select()

  if (error) throw error
  return data[0]
}

export async function updateShippingPartner(id: string, partner: Partial<ShippingPartner>) {
  const { data, error } = await supabase
    .from('shipping_partners')
    .update(partner)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

export async function deleteShippingPartner(id: string) {
  const { error } = await supabase
    .from('shipping_partners')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
