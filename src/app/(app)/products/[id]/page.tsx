'use client'

import { useEffect, useState, use } from 'react'
import { getProduct, type Product } from '@/lib/api/products'
import { ProductForm } from '@/components/products/product-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        const data = await getProduct(resolvedParams.id)
        setProduct(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-[250px] mb-4" />
        <Skeleton className="h-[600px] w-full max-w-4xl" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-red-600">Produto não encontrado</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Editar Produto</h2>
        </div>
      </div>
      <ProductForm initialData={product} />
    </div>
  )
}
