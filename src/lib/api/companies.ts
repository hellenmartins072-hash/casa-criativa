import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type Company = {
  id: string
  business_name: string
  trading_name?: string | null
  cnpj?: string | null
  phone?: string | null
  address?: string | null
  store_ids?: string[] | null
  payment_method?: 'PIX' | 'Cartão' | 'Boleto' | 'Dinheiro' | null
  boleto_only?: boolean
  boleto_days?: number | null
  status?: 'Ativo' | 'Despedido'
  notes?: string | null
  contact_quote_id?: string | null
  contact_approval_id?: string | null
  contact_finance_id?: string | null
  created_at?: string
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching companies:', error)
    throw error
  }
  return data
}

export async function getCompany(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching company:', error)
    throw error
  }
  return data
}

export async function createCompany(company: Partial<Company>) {
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select()

  if (error) {
    console.error('Error creating company:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateCompany(id: string, company: Partial<Company>) {
  const { data, error } = await supabase
    .from('companies')
    .update(company)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating company:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting company:', error)
    throw error
  }
  return true
}
