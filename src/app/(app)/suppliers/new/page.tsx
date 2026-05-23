import { SupplierForm } from '@/components/suppliers/supplier-form'

export default function NewSupplierPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Adicionar Parceiro</h2>
        </div>
      </div>
      <SupplierForm />
    </div>
  )
}
