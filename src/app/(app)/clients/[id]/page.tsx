'use client'

import { useEffect, useState, use } from 'react'
import { ClientForm } from '@/components/clients/client-form'
import { getClient, type Client } from '@/lib/api/clients'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClient() {
      try {
        const resolvedParams = await params
        const data = await getClient(resolvedParams.id)
        setClient(data)
      } catch (error) {
        console.error('Error fetching client:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClient()
  }, [params])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-[250px] mb-4" />
        <Skeleton className="h-[400px] w-full max-w-3xl mx-auto" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Editar Cliente</h2>
      </div>
      <ClientForm initialData={client} />
    </div>
  )
}
