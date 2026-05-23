'use client'

import { useEffect, useState, use } from 'react'
import { CompanyForm } from '@/components/companies/company-form'
import { getCompany, type Company } from '@/lib/api/companies'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCompany() {
      try {
        const resolvedParams = await params
        const data = await getCompany(resolvedParams.id)
        setCompany(data)
      } catch (error) {
        console.error('Error fetching company:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [params])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-10 w-[250px] mb-4" />
        <Skeleton className="h-[400px] w-full max-w-3xl mx-auto" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-2xl font-bold">Empresa não encontrada</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Editar Empresa</h2>
      </div>
      <CompanyForm initialData={company} />
    </div>
  )
}
