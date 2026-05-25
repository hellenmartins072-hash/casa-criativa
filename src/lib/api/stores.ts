import { supabase } from '../supabase'

export type Store = {
  id: string
  name: string
  instagram?: string
  type?: 'Varejo' | 'Laser' | 'Corporativo' | 'E-commerce'
  color?: string
  logo_url?: string | null
  is_active?: boolean
  created_at?: string
}

export async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching stores:', error)
    throw error
  }
  return data as Store[]
}

export async function getStore(id: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching store:', error)
    throw error
  }
  return data as Store
}

export async function createStore(store: Partial<Store>) {
  const { data, error } = await supabase
    .from('stores')
    .insert([store])
    .select()

  if (error) {
    console.error('Error creating store:', error)
    throw error
  }
  return data ? (data[0] as Store) : null
}

export async function updateStore(id: string, store: Partial<Store>) {
  const { data, error } = await supabase
    .from('stores')
    .update(store)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating store:', error)
    throw error
  }
  return data ? (data[0] as Store) : null
}

export async function deleteStore(id: string) {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting store:', error)
    throw error
  }
  return true
}

export async function uploadStoreLogo(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `store_logo_${Date.now()}.${fileExt}`

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
