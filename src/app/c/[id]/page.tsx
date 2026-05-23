'use client'

import { useEffect, useState, use } from 'react'
import { getCatalog, type Catalog } from '@/lib/api/catalogs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, ShoppingCart, MessageCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function PublicCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const isPrintMode = searchParams.get('print') === 'true'

  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getCatalog(resolvedParams.id)
        setCatalog(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [resolvedParams.id])

  useEffect(() => {
    if (isPrintMode && !loading && catalog) {
      setTimeout(() => {
        window.print()
      }, 1000)
    }
  }, [isPrintMode, loading, catalog])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-primary/20 rounded"></div>
        </div>
      </div>
    )
  }

  if (!catalog || !catalog.is_public) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ops!</h1>
          <p className="text-gray-500">Este catálogo não está disponível ou não existe.</p>
        </div>
      </div>
    )
  }

  const handleWhatsApp = (productName: string) => {
    const text = encodeURIComponent(`Olá! Gostaria de mais informações sobre o produto: *${productName}* que vi no seu catálogo.`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isPrintMode ? 'bg-white' : ''}`}>
      {/* Header / Navbar */}
      {!isPrintMode && (
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="font-bold text-xl text-[#5C3D8F]">
              Casa Criativa
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:flex">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir / PDF
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 print:py-0">
        <div className="text-center mb-10 print:mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 print:text-3xl">{catalog.title}</h1>
          {catalog.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto print:text-sm whitespace-pre-wrap">
              {catalog.description}
            </p>
          )}
        </div>

        {catalog.products && catalog.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
            {catalog.products.map(product => (
              <Card key={product.id} className="overflow-hidden flex flex-col print:shadow-none print:border-gray-200">
                <div className="aspect-square bg-gray-100 relative w-full">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col justify-between print:p-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1 print:text-base leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 print:line-clamp-3">
                      {product.description || 'Produto personalizado.'}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <div className="text-2xl font-bold text-[#5C3D8F] mb-4 print:text-xl print:mb-0">
                      R$ {(product.price_retail || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {!isPrintMode && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleWhatsApp(product.name)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Pedir pelo WhatsApp
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Este catálogo ainda não possui produtos.</p>
          </div>
        )}
      </main>
      
      {/* Print Styles fix for Next.js */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  )
}
