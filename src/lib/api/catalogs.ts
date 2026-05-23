import { supabase } from '../supabase'
import { Product } from './products'

export type Catalog = {
  id: string
  title: string
  description?: string | null
  store_id?: string | null
  is_public?: boolean
  created_at?: string
  products?: Product[] // Para joins lógicos
}

export async function getCatalogs() {
  const { data, error } = await supabase
    .from('catalogs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching catalogs:', error)
    throw error
  }
  return data
}

export async function getCatalog(id: string) {
  // Puxa o catálogo base
  const { data: catalog, error: catError } = await supabase
    .from('catalogs')
    .select('*')
    .eq('id', id)
    .single()

  if (catError) throw catError

  // Puxa os produtos vinculados usando uma query manual pois o Supabase
  // as vezes não resolve m2m facilmente sem definir foreign keys exatas
  const { data: catalogProducts, error: prodError } = await supabase
    .from('catalog_products')
    .select(`
      product_id,
      products (*)
    `)
    .eq('catalog_id', id)
    .order('sort_order', { ascending: true })

  if (prodError) throw prodError

  // Mapeia para retornar um array direto de produtos
  const products = catalogProducts
    .map((cp: any) => cp.products)
    .filter(Boolean)

  return {
    ...catalog,
    products
  }
}

export async function createCatalog(catalogData: Partial<Catalog>, productIds: string[]) {
  const payload: any = {
    title: catalogData.title,
    description: catalogData.description,
    is_public: catalogData.is_public
  }
  
  if (catalogData.store_id) {
    payload.store_id = catalogData.store_id
  }

  // 1. Cria o catálogo
  const { data: newCatalog, error: catError } = await supabase
    .from('catalogs')
    .insert([payload])
    .select()

  if (catError || !newCatalog) {
    console.error('Create Catalog Error Details:', catError)
    throw catError
  }

  const catalogId = newCatalog[0].id

  // 2. Insere os produtos
  if (productIds && productIds.length > 0) {
    const cpData = productIds.map((pid, index) => ({
      catalog_id: catalogId,
      product_id: pid,
      sort_order: index
    }))

    const { error: cpError } = await supabase
      .from('catalog_products')
      .insert(cpData)

    if (cpError) throw cpError
  }

  return newCatalog[0]
}

export async function updateCatalog(id: string, catalogData: Partial<Catalog>, productIds: string[]) {
  // 1. Atualiza dados base
  const { error: catError } = await supabase
    .from('catalogs')
    .update({
      title: catalogData.title,
      description: catalogData.description,
      store_id: catalogData.store_id,
      is_public: catalogData.is_public
    })
    .eq('id', id)

  if (catError) throw catError

  // 2. Atualiza produtos (remove todos e insere novos)
  const { error: delError } = await supabase
    .from('catalog_products')
    .delete()
    .eq('catalog_id', id)

  if (delError) throw delError

  if (productIds && productIds.length > 0) {
    const cpData = productIds.map((pid, index) => ({
      catalog_id: id,
      product_id: pid,
      sort_order: index
    }))

    const { error: insError } = await supabase
      .from('catalog_products')
      .insert(cpData)

    if (insError) throw insError
  }

  return true
}

export async function deleteCatalog(id: string) {
  const { error } = await supabase
    .from('catalogs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting catalog:', error)
    throw error
  }
  return true
}
