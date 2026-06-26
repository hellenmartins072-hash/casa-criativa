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
  if (company.business_name && company.phone) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('business_name', company.business_name)
      .eq('phone', company.phone)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error('Já existe uma empresa cadastrada com esta mesma razão social e telefone.')
    }
  }

  const payload = { ...company }
  if (payload.birth_date === '') payload.birth_date = null

  const { data, error } = await supabase
    .from('companies')
    .insert([payload])
    .select()

  if (error) {
    console.error('Error creating company:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateCompany(id: string, company: Partial<Company>) {
  if (company.business_name && company.phone) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('business_name', company.business_name)
      .eq('phone', company.phone)
      .neq('id', id)
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error('Já existe outra empresa cadastrada com esta mesma razão social e telefone.')
    }
  }

  const payload = { ...company }
  if (payload.birth_date === '') payload.birth_date = null

  const { data, error } = await supabase
    .from('companies')
    .update(payload)
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

  // Sincronizar com tabela de clientes (PF)
  if (contact.company_id && contact.name) {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('business_name')
        .eq('id', contact.company_id)
        .single()
        
      const businessName = company?.business_name || 'B2B'
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', contact.company_id)
        .eq('full_name', contact.name)
        .limit(1)
        
      if (!existingClient || existingClient.length === 0) {
        await supabase.from('clients').insert([{
          full_name: contact.name,
          whatsapp: contact.phone || '',
          email: contact.email || '',
          company_id: contact.company_id,
          client_type: 'Corporativo',
          notes: `Cliente vinculado à Empresa ${businessName}${contact.role ? ' - Cargo: ' + contact.role : ''}`
        }])
      }
    } catch (e) {
      console.error('Error syncing contact to client', e)
    }
  }

  return data[0] as CompanyContact
}

export async function updateCompanyContact(id: string, contact: Partial<CompanyContact>) {
  const { data, error } = await supabase
    .from('company_contacts')
    .update(contact)
    .eq('id', id)
    .select()

  if (error) throw error

  // Sincronizar com tabela de clientes (PF) se houver dados
  const updatedContact = data[0] as CompanyContact
  if (updatedContact && updatedContact.company_id && updatedContact.name) {
    try {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', updatedContact.company_id)
        .eq('full_name', updatedContact.name)
        .limit(1)
        
      if (existingClient && existingClient.length > 0) {
        await supabase.from('clients').update({
          whatsapp: updatedContact.phone || '',
          email: updatedContact.email || ''
        }).eq('id', existingClient[0].id)
      } else {
        const { data: company } = await supabase
          .from('companies')
          .select('business_name')
          .eq('id', updatedContact.company_id)
          .single()
        
        await supabase.from('clients').insert([{
          full_name: updatedContact.name,
          whatsapp: updatedContact.phone || '',
          email: updatedContact.email || '',
          company_id: updatedContact.company_id,
          client_type: 'Corporativo',
          notes: `Cliente vinculado à Empresa ${company?.business_name || 'B2B'}${updatedContact.role ? ' - Cargo: ' + updatedContact.role : ''}`
        }])
      }
    } catch (e) {
      console.error('Error syncing updated contact to client', e)
    }
  }

  return updatedContact
}

export async function deleteCompanyContact(id: string) {
  const { error } = await supabase
    .from('company_contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
