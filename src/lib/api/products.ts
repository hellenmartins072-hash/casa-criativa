import { supabase } from '../supabase'

export type Product = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  image_url?: string | null
  price_retail?: number
  price_resale?: number
  price_ecommerce?: number
  is_active?: boolean
  store_id?: string | null
  created_at?: string
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    throw error
  }
  return data
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    throw error
  }
  return data
}

export async function createProduct(product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()

  if (error) {
    console.error('Error creating product:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating product:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    throw error
  }
  return true
}

export async function getActiveProducts(store_id?: string) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    
  if (store_id) {
    query = query.eq('store_id', store_id)
  }
    
  const { data, error } = await query.order('name', { ascending: true })

  if (error) {
    console.error('Error fetching active products:', error)
    throw error
  }
  return data
}

export type ProductMaterial = {
  id?: string
  product_id: string
  material_id: string
  quantity: number
  material?: {
    id: string
    name: string
    unit_measure: string
    unit_cost: number
  }
}

export async function getProductMaterials(product_id: string) {
  const { data, error } = await supabase
    .from('product_materials')
    .select(`
      id,
      product_id,
      material_id,
      quantity,
      material:materials (
        id,
        name,
        unit_measure,
        unit_cost
      )
    `)
    .eq('product_id', product_id)

  if (error) {
    console.error('Error fetching product materials:', error)
    throw error
  }
  return data as unknown as ProductMaterial[]
}

export async function saveProductMaterials(product_id: string, materials: Partial<ProductMaterial>[]) {
  // First delete existing materials for this product
  const { error: deleteError } = await supabase
    .from('product_materials')
    .delete()
    .eq('product_id', product_id)

  if (deleteError) {
    console.error('Error clearing old product materials:', deleteError)
    throw deleteError
  }

  // Then insert new ones if any
  if (materials.length > 0) {
    const insertData = materials.map(m => ({
      product_id,
      material_id: m.material_id,
      quantity: m.quantity
    }))

    const { error: insertError } = await supabase
      .from('product_materials')
      .insert(insertData)

    if (insertError) {
      console.error('Error saving product materials:', insertError)
      throw insertError
    }
  }

  return true
}
