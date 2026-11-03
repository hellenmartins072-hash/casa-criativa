'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

export default function OrderPdfRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/orcamento/${resolvedParams.id}/pdf`)
  }, [resolvedParams.id, router])

  return (
    <div className="p-10 text-center text-sm text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5C3D8F] border-t-transparent mb-2" />
      Redirecionando para o documento de impressão...
    </div>
  )
}
