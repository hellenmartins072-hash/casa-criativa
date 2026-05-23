import { supabase } from '../supabase'

export type PricingRule = {
  id: string
  category: string
  markup_retail?: number
  markup_resale?: number
  markup_corporate?: number
  markup_shopee?: number
  markup_mercado_livre?: number
  markup_elo7?: number
  markup_instagram?: number
  markup_tiktok?: number
  markup_google?: number
  created_at?: string
}

export async function getPricingRules() {
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching pricing rules:', error)
    throw error
  }
  return data
}

export async function getPricingRule(id: string) {
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching pricing rule:', error)
    throw error
  }
  return data
}

export async function updatePricingRule(id: string, rule: Partial<PricingRule>) {
  const { data, error } = await supabase
    .from('pricing_rules')
    .update(rule)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating pricing rule:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function createPricingRule(rule: Partial<PricingRule>) {
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert([rule])
    .select()

  if (error) {
    console.error('Error creating pricing rule:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deletePricingRule(id: string) {
  const { error } = await supabase
    .from('pricing_rules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting pricing rule:', error)
    throw error
  }
  return true
}
