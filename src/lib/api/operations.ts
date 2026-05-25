import { supabase } from '../supabase'

// --- Order Checklists ---

export type OrderChecklist = {
  id: string
  order_id: string
  step_name: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export async function getOrderChecklist(orderId: string) {
  const { data, error } = await supabase
    .from('order_checklists')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching checklist:', error)
    return []
  }
  return data as OrderChecklist[]
}

export async function createChecklistStep(step: { order_id: string; step_name: string }) {
  const { data, error } = await supabase
    .from('order_checklists')
    .insert([step])
    .select()

  if (error) {
    console.error('Error creating checklist step:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function toggleChecklistStep(id: string, is_completed: boolean) {
  const { data, error } = await supabase
    .from('order_checklists')
    .update({ 
      is_completed, 
      completed_at: is_completed ? new Date().toISOString() : null 
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error toggling checklist step:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteChecklistStep(id: string) {
  const { error } = await supabase
    .from('order_checklists')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting checklist step:', error)
    throw error
  }
  return true
}

// --- Order Reworks ---

export type OrderRework = {
  id: string
  order_id: string
  reason: string
  extra_cost: number
  created_at: string
}

export async function getOrderReworks(orderId: string) {
  const { data, error } = await supabase
    .from('order_reworks')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching reworks:', error)
    return []
  }
  return data as OrderRework[]
}

export async function registerRework(rework: { order_id: string; reason: string; extra_cost: number }) {
  const { data, error } = await supabase
    .from('order_reworks')
    .insert([rework])
    .select()

  if (error) {
    console.error('Error registering rework:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteRework(id: string) {
  const { error } = await supabase
    .from('order_reworks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting rework:', error)
    throw error
  }
  return true
}

// --- Project Gallery ---

export type GalleryProject = {
  id: string
  title: string
  category: string | null
  image_url: string
  created_at: string
}

export async function getGalleryProjects() {
  const { data, error } = await supabase
    .from('project_gallery')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching gallery:', error)
    return []
  }
  return data as GalleryProject[]
}

export async function uploadGalleryImage(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from('gallery')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function addProjectToGallery(project: { title: string; category?: string; image_url: string }) {
  const { data, error } = await supabase
    .from('project_gallery')
    .insert([project])
    .select()

  if (error) {
    console.error('Error adding to gallery:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteGalleryProject(id: string) {
  // Opcional: apagar imagem do storage também. Por simplicidade, deletaremos apenas o registro.
  const { error } = await supabase
    .from('project_gallery')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting from gallery:', error)
    throw error
  }
  return true
}
