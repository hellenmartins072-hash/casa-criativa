'use client'

import { useEffect, useState, use } from 'react'
import { getSupplier, type Supplier } from '@/lib/api/suppliers'
import { SupplierForm } from '@/components/suppliers/supplier-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        const data = await getSupplier(resolvedParams.id)
        setSupplier(data)
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
        <Skeleton className="h-[600px] w-full max-w-3xl" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-red-600">Fornecedor não encontrado</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Detalhes do Fornecedor</h2>
        </div>
      </div>
      <SupplierForm initialData={supplier} />
    </div>
  )
}
