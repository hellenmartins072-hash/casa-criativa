import { supabase } from '../supabase'
import { Supplier } from './suppliers'

export type Material = {
  id: string
  name: string
  category?: string | null
  supplier_id?: string | null
  unit_cost?: number
  unit_measure?: string | null
  current_stock?: number
  minimum_stock?: number
  created_at?: string
  suppliers?: Supplier | null // Para joins
}

export async function getMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      suppliers (
        id,
        name
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching materials:', error)
    throw error
  }
  return data
}

export async function getMaterial(id: string) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching material:', error)
    throw error
  }
  return data
}

export async function createMaterial(material: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .insert([material])
    .select()

  if (error) {
    console.error('Error creating material:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateMaterial(id: string, material: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .update(material)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating material:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting material:', error)
    throw error
  }
  return true
}

export type InventoryMovement = {
  id: string
  material_id: string
  movement_type: 'Entrada' | 'Saída' | 'Ajuste'
  quantity: number
  description?: string
  order_id?: string
  created_at: string
}

export async function getMaterialConsumption(materialId: string, days: number = 30) {
  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - days)

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('quantity')
    .eq('material_id', materialId)
    .eq('movement_type', 'Saída')
    .gte('created_at', pastDate.toISOString())

  if (error) {
    console.error('Error fetching material consumption:', error)
    return 0
  }

  return data.reduce((sum, mov) => sum + (mov.quantity || 0), 0)
}

export async function getInventoryMovements(materialId: string) {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching inventory movements:', error)
    throw error
  }
  
  return data as InventoryMovement[]
}
