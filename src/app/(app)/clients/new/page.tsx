import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Adicionar Cliente</h2>
      </div>
      <ClientForm />
    </div>
  )
}
