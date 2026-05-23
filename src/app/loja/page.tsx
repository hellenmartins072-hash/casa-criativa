'use client'

import { useEffect, useState } from 'react'
import { getActiveProducts, type Product } from '@/lib/api/products'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, MessageCircle, X, Plus, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // Carrinho de compras simples
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getActiveProducts()
        setProducts(data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQtd = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQtd }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const cartTotal = cart.reduce((total, item) => total + (item.product.price_retail || 0) * item.quantity, 0)
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0)

  const handleCheckout = () => {
    let text = `🛍️ *Novo Pedido - Casa Criativa*\n\n`
    cart.forEach(item => {
      text += `${item.quantity}x ${item.product.name} - R$ ${((item.product.price_retail || 0) * item.quantity).toFixed(2)}\n`
    })
    text += `\n*Total: R$ ${cartTotal.toFixed(2)}*\n\nOlá! Gostaria de finalizar a compra destes itens.`
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse h-12 w-12 bg-[#5C3D8F]/20 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl text-[#5C3D8F]">
            Casa Criativa
          </div>
          <Button variant="outline" className="relative" onClick={() => setIsCartOpen(!isCartOpen)}>
            <ShoppingCart className="w-5 h-5 mr-2 text-gray-700" />
            <span className="font-medium">Meu Carrinho</span>
            {cartItemsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-white px-2 rounded-full">
                {cartItemsCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Banner / Hero */}
      <div className="bg-[#5C3D8F] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Bem-vindo à nossa Loja</h1>
          <p className="text-lg md:text-xl text-[#5C3D8F]/20 text-indigo-200 max-w-2xl mx-auto">
            Produtos exclusivos e personalizados feitos com o maior carinho para você.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-gray-200">
                <div className="aspect-square bg-gray-100 relative w-full group">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/90 text-gray-800 hover:bg-white border-none shadow-sm">{product.category}</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-1 leading-tight line-clamp-2" title={product.name}>
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-auto">
                    <div className="text-xl font-bold text-[#5C3D8F] mb-4">
                      R$ {(product.price_retail || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Button 
                      className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] text-white transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-500">Nenhum produto disponível no momento.</h2>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-xl text-gray-800 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Seu Carrinho
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingCart className="w-16 h-16 opacity-20" />
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 border-b pb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                         <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Imagem</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <h4 className="font-medium text-sm leading-tight text-gray-800">{item.product.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <div className="font-bold text-[#5C3D8F] text-sm">
                          R$ {((item.product.price_retail || 0) * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center border rounded-md">
                          <button className="px-2 py-1 text-gray-500 hover:bg-gray-100" onClick={() => updateQuantity(item.product.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <button className="px-2 py-1 text-gray-500 hover:bg-gray-100" onClick={() => updateQuantity(item.product.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-2xl font-bold text-[#5C3D8F]">
                    R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Button 
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                >
                  <MessageCircle className="w-5 h-5" />
                  Finalizar no WhatsApp
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
