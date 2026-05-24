import { supabase } from '../supabase'

export interface ClientInteraction {
  id: string
  client_id?: string
  company_id?: string
  interaction_type: string
  notes: string
  interaction_date: string
  created_at?: string
}

export async function getClientInteractions(clientId: string) {
  const { data, error } = await supabase
    .from('client_interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('interaction_date', { ascending: false })

  if (error) {
    console.error('Error fetching client interactions:', error)
    throw error
  }
  return data as ClientInteraction[]
}

export async function getCompanyInteractions(companyId: string) {
  const { data, error } = await supabase
    .from('client_interactions')
    .select('*')
    .eq('company_id', companyId)
    .order('interaction_date', { ascending: false })

  if (error) {
    console.error('Error fetching company interactions:', error)
    throw error
  }
  return data as ClientInteraction[]
}

export async function createInteraction(interaction: Partial<ClientInteraction>) {
  const { data, error } = await supabase
    .from('client_interactions')
    .insert([interaction])
    .select()

  if (error) {
    console.error('Error creating interaction:', error)
    throw error
  }
  return data ? (data[0] as ClientInteraction) : null
}

export async function deleteInteraction(id: string) {
  const { error } = await supabase
    .from('client_interactions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting interaction:', error)
    throw error
  }
  return true
}
