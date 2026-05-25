import { redirect } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentProfile } from "@/lib/api/profiles"
import { supabase } from "@/lib/supabase"
import { Image as ImageIcon } from "lucide-react"

export default async function ResellerCatalog() {
  const profile = await getCurrentProfile()
  
  if (!profile || profile.role !== 'reseller') {
    redirect('/')
  }

  // Busca apenas produtos ativos
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')

  // Buscar dados do revendedor para aplicar o desconto
  let discountPercentage = 0
  if (profile.reseller_id) {
    const { data: reseller } = await supabase
      .from('resellers')
      .select('discount_percentage')
      .eq('id', profile.reseller_id)
      .single()
    
    if (reseller) {
      discountPercentage = Number(reseller.discount_percentage) || 0
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Catálogo de Revenda</h2>
        <p className="text-muted-foreground">
          Confira nossos produtos disponíveis e seus valores exclusivos de parceiro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {products?.map((product) => (
          <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                  <span className="text-xs font-medium">Sem imagem</span>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 truncate" title={product.name}>{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description || 'Nenhuma descrição'}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Preço Revenda</p>
                  <p className="text-lg font-bold text-[#5C3D8F]">
                    R$ {Number(
                      (product.price_retail || 0) * (1 - (discountPercentage / 100))
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Varejo Sugerido</p>
                  <p className="text-sm font-medium text-gray-500 line-through">
                    R$ {Number(product.price_retail || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {(!products || products.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum produto disponível no catálogo no momento.
        </div>
      )}
    </div>
  )
}
