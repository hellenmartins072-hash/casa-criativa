import { supabase } from '../supabase'

export type UserRole = 'admin' | 'reseller'

export type UserProfile = {
  id: string
  role: UserRole
  company_id?: string | null
  client_id?: string | null
  created_at: string
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as UserProfile
  } catch (err) {
    console.error('Error in getCurrentProfile:', err)
    return null
  }
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      auth_user:id (email),
      companies(business_name),
      clients(full_name)
    `)
  
  if (error) {
    console.error('Error fetching all profiles:', error)
    throw error
  }
  return data
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }
  return data as UserProfile
}
