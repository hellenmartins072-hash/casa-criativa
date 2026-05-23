'use client'

import { useEffect, useState, use } from 'react'
import { getMaterial, type Material } from '@/lib/api/materials'
import { MaterialForm } from '@/components/materials/material-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params
        const data = await getMaterial(resolvedParams.id)
        setMaterial(data)
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

  if (!material) {
    return (
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-red-600">Material não encontrado</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Editar Material</h2>
        </div>
      </div>
      <MaterialForm initialData={material} />
    </div>
  )
}
