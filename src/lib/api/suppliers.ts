import { supabase } from '../supabase'

export type SupplierProduct = {
  id: string
  supplier_id: string
  product_name: string
  price: number
  notes?: string | null
  created_at?: string
}

export type Supplier = {
  id: string
  name: string
  document?: string | null
  phone?: string | null
  email?: string | null
  instagram?: string | null
  address?: string | null
  type?: string | null
  provided_items?: string | null
  average_delivery_days?: number | null
  payment_conditions?: string | null
  status?: 'Ativo' | 'Inativo'
  notes?: string | null
  created_at: string
  products?: SupplierProduct[]
}

export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      *,
      supplier_products(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching suppliers:', error)
    throw error
  }
  
  return data.map(supplier => ({
    ...supplier,
    products: supplier.supplier_products
  })) as Supplier[]
}

export async function getSupplier(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      *,
      supplier_products(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching supplier:', error)
    throw error
  }
  
  const supplierData = data as any
  if (supplierData && supplierData.supplier_products) {
    supplierData.products = supplierData.supplier_products
    delete supplierData.supplier_products
  }
  
  return supplierData as Supplier
}

export async function createSupplier(supplier: Partial<Supplier>) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplier])
    .select()

  if (error) {
    console.error('Error creating supplier:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function updateSupplier(id: string, supplier: Partial<Supplier>) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplier)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating supplier:', error)
    throw error
  }
  return data ? data[0] : null
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    throw error
  }
  return true
}

// --- Produtos de Fornecedores ---

export async function getSupplierProducts(supplierId: string) {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('product_name', { ascending: true })

  if (error) throw error
  return data as SupplierProduct[]
}

export async function createSupplierProduct(product: Partial<SupplierProduct>) {
  const { data, error } = await supabase
    .from('supplier_products')
    .insert([product])
    .select()

  if (error) throw error
  return data[0] as SupplierProduct
}

export async function updateSupplierProduct(id: string, product: Partial<SupplierProduct>) {
  const { data, error } = await supabase
    .from('supplier_products')
    .update(product)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as SupplierProduct
}

export async function deleteSupplierProduct(id: string) {
  const { error } = await supabase
    .from('supplier_products')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
