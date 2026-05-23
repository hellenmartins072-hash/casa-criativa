import { supabase } from '../supabase'

export type Supplier = {
  id: string
  name: string
  document?: string | null
  phone?: string | null
  email?: string | null
  type?: string | null
  provided_items?: string | null
  average_delivery_days?: number | null
  payment_conditions?: string | null
  notes?: string | null
  created_at?: string
}

export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching suppliers:', error)
    throw error
  }
  return data
}

export async function getSupplier(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching supplier:', error)
    throw error
  }
  return data
}

export async function createSupplier(supplier: Partial<Supplier>) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplier])
    .select()

  if (error) {
    console.error('Error creating supplier:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateSupplier(id: string, supplier: Partial<Supplier>) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplier)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating supplier:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    throw error
  }
  return true
}
