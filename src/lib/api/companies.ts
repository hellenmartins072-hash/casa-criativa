import { supabase } from '../supabase'
import type { Database } from '../database.types'

export type CompanyContact = {
  id: string
  company_id: string
  name: string
  phone?: string | null
  email?: string | null
  role?: string | null
  notes?: string | null
  created_at?: string
}

export type Company = {
  id: string
  business_name: string
  trading_name?: string | null
  cnpj?: string | null
  phone?: string | null
  instagram?: string | null
  address?: string | null
  store_ids?: string[] | null
  payment_methods?: string[] | null
  birth_date?: string | null
  boleto_only?: boolean
  boleto_days?: number | null
  status?: 'Ativo' | 'Despedido'
  notes?: string | null
  contact_quote_id?: string | null
  contact_approval_id?: string | null
  contact_finance_id?: string | null
  created_at?: string
  contacts?: CompanyContact[]
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_contacts(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching companies:', error)
    throw error
  }
  
  return data.map(company => ({
    ...company,
    contacts: company.company_contacts
  })) as Company[]
}

export async function getCompany(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_contacts(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching company:', error)
    throw error
  }
  
  const companyData = data as any
  if (companyData && companyData.company_contacts) {
    companyData.contacts = companyData.company_contacts
    delete companyData.company_contacts
  }
  
  return companyData as Company
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

// --- Contatos de Empresas ---

export async function getCompanyContacts(companyId: string) {
  const { data, error } = await supabase
    .from('company_contacts')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as CompanyContact[]
}

export async function createCompanyContact(contact: Partial<CompanyContact>) {
  const { data, error } = await supabase
    .from('company_contacts')
    .insert([contact])
    .select()

  if (error) throw error
  return data[0] as CompanyContact
}

export async function updateCompanyContact(id: string, contact: Partial<CompanyContact>) {
  const { data, error } = await supabase
    .from('company_contacts')
    .update(contact)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as CompanyContact
}

export async function deleteCompanyContact(id: string) {
  const { error } = await supabase
    .from('company_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
