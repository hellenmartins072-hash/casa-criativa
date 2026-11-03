'use client'

import { useState, useRef } from 'react'
import { ImageIcon, Plus, Trash2, RefreshCw, Loader2, Maximize2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

interface ItemImageUploaderProps {
  orderId?: string
  images?: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
  productName?: string
}

export function ItemImageUploader({
  orderId,
  images = [],
  onChange,
  disabled = false,
  productName = 'Item'
}: ItemImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null)
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null)

  const addInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tipo (PNG ou JPG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    const hasValidExt = /\.(png|jpe?g)$/i.test(file.name)
    if (!validTypes.includes(file.type) && !hasValidExt) {
      return `O arquivo "${file.name}" não é suportado. Apenas imagens PNG ou JPG são permitidas.`
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB em bytes
    if (file.size > maxSize) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      return `A imagem "${file.name}" tem ${sizeMb}MB. O limite máximo permitido é 10MB.`
    }

    return null
  }

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const cleanOrderId = orderId && orderId !== 'none' ? orderId : 'drafts'
    const fileName = `item-images/${cleanOrderId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('order-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: urlData } = supabase.storage
      .from('order-files')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setError(null)
    setUploading(true)

    try {
      // 1. Validar todos os arquivos primeiro
      for (let i = 0; i < selectedFiles.length; i++) {
        const validationError = validateFile(selectedFiles[i])
        if (validationError) {
          setError(validationError)
          setUploading(false)
          if (addInputRef.current) addInputRef.current.value = ''
          return
        }
      }

      // 2. Fazer upload para o Supabase Storage
      const uploadedUrls: string[] = []
      for (let i = 0; i < selectedFiles.length; i++) {
        const publicUrl = await uploadFileToStorage(selectedFiles[i])
        uploadedUrls.push(publicUrl)
      }

      // 3. Atualizar a lista de imagens do item
      onChange([...images, ...uploadedUrls])
    } catch (err: any) {
      console.error('Erro no upload de imagem:', err)
      setError(`Erro ao enviar imagem: ${err.message || 'Falha de comunicação com o Storage'}`)
    } finally {
      setUploading(false)
      if (addInputRef.current) addInputRef.current.value = ''
    }
  }

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || replacingIndex === null) return

    setError(null)
    setUploading(true)

    try {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setUploading(false)
        if (replaceInputRef.current) replaceInputRef.current.value = ''
        return
      }

      const newPublicUrl = await uploadFileToStorage(file)
      const oldUrl = images[replacingIndex]

      // Substitui na lista
      const updated = [...images]
      updated[replacingIndex] = newPublicUrl
      onChange(updated)

      // Exclui a imagem antiga do Storage se for de order-files
      if (oldUrl?.includes('/order-files/')) {
        const path = oldUrl.split('/order-files/')[1]
        if (path) {
          supabase.storage.from('order-files').remove([path]).catch(console.warn)
        }
      }
    } catch (err: any) {
      console.error('Erro ao trocar imagem:', err)
      setError(`Erro ao trocar imagem: ${err.message || 'Falha no upload'}`)
    } finally {
      setUploading(false)
      setReplacingIndex(null)
      if (replaceInputRef.current) replaceInputRef.current.value = ''
    }
  }

  const handleRemove = (indexToRemove: number) => {
    const urlToRemove = images[indexToRemove]
    const updated = images.filter((_, i) => i !== indexToRemove)
    onChange(updated)

    // Opcional: remover do storage
    if (urlToRemove?.includes('/order-files/')) {
      const path = urlToRemove.split('/order-files/')[1]
      if (path) {
        supabase.storage.from('order-files').remove([path]).catch(console.warn)
      }
    }
  }

  return (
    <div className="mt-2.5">
      {/* Inputs de arquivo ocultos */}
      <input
        ref={addInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleAddFiles}
        className="hidden"
        disabled={disabled || uploading}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleReplaceFile}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Alerta de erro de validação/upload */}
      {error && (
        <div className="flex items-start gap-1.5 p-2 mb-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Se não houver imagens e não estiver enviando */}
      {images.length === 0 && !uploading && (
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs text-[#5C3D8F] bg-[#5C3D8F]/5 hover:bg-[#5C3D8F]/10 border border-dashed border-[#5C3D8F]/30 rounded-md px-2.5 py-1.5 transition-colors font-medium disabled:opacity-50"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Anexar Imagem (PNG/JPG até 10MB)</span>
        </button>
      )}

      {/* Galeria de miniaturas de imagens */}
      {(images.length > 0 || uploading) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium flex items-center gap-1 text-[11px] text-gray-600">
              <ImageIcon className="h-3.5 w-3.5 text-[#5C3D8F]" />
              Fotos do Item ({images.length})
            </span>
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              disabled={disabled || uploading}
              className="text-[#5C3D8F] hover:underline font-medium inline-flex items-center gap-1 text-[11px]"
            >
              <Plus className="h-3 w-3" />
              Adicionar foto
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="relative group w-18 h-18 rounded-md border border-gray-200 bg-white p-1 shadow-xs overflow-hidden flex items-center justify-center hover:border-[#5C3D8F]/50 transition-all"
              >
                {/* Imagem proporcional sem distorção */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${productName} - Foto ${idx + 1}`}
                  className="w-full h-full object-contain cursor-pointer rounded"
                  onClick={() => setPreviewModalUrl(url)}
                  title="Clique para ampliar"
                />

                {/* Barra de ações sobre a miniatura */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1 rounded-md">
                  {/* Botão Ver / Ampliar */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(url)}
                    className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                    title="Ampliar visualização"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Botão Trocar */}
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingIndex(idx)
                      replaceInputRef.current?.click()
                    }}
                    disabled={disabled || uploading}
                    className="p-1 rounded bg-white/20 hover:bg-blue-600 text-white transition-colors"
                    title="Trocar imagem"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>

                  {/* Botão Remover */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    disabled={disabled || uploading}
                    className="p-1 rounded bg-white/20 hover:bg-red-600 text-white transition-colors"
                    title="Remover imagem"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Indicador de ordem discreto */}
                <div className="absolute bottom-0.5 right-1 pointer-events-none group-hover:opacity-0 transition-opacity">
                  <span className="text-[9px] bg-black/60 text-white px-1 rounded-xs font-mono">
                    {idx + 1}
                  </span>
                </div>
              </div>
            ))}

            {/* Tile de Upload em Progresso */}
            {uploading && (
              <div className="w-18 h-18 rounded-md border border-dashed border-[#5C3D8F] bg-[#5C3D8F]/5 flex flex-col items-center justify-center text-[10px] text-[#5C3D8F] p-1 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin mb-1 text-[#5C3D8F]" />
                <span className="text-center font-medium leading-tight">Enviando...</span>
              </div>
            )}

            {/* Tile de Adicionar mais fotos */}
            {!uploading && (
              <button
                type="button"
                onClick={() => addInputRef.current?.click()}
                disabled={disabled}
                className="w-18 h-18 rounded-md border border-dashed border-gray-300 hover:border-[#5C3D8F] hover:bg-[#5C3D8F]/5 flex flex-col items-center justify-center text-gray-500 hover:text-[#5C3D8F] transition-colors p-1"
                title="Adicionar mais imagens"
              >
                <Plus className="h-4 w-4 mb-0.5" />
                <span className="text-[9px] font-medium leading-none">Mais fotos</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Zoom da Imagem */}
      <Dialog open={!!previewModalUrl} onOpenChange={(open) => !open && setPreviewModalUrl(null)}>
        <DialogContent className="max-w-2xl p-4 bg-white">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <DialogTitle className="text-base font-semibold text-gray-800">
              Visualização da Imagem — {productName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 max-h-[70vh] overflow-hidden bg-gray-50 rounded-lg">
            {previewModalUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewModalUrl}
                alt="Prévia ampliada"
                className="max-h-[65vh] max-w-full object-contain rounded"
              />
            )}
          </div>
          <div className="flex justify-between items-center pt-2 text-xs text-gray-500">
            <span className="truncate max-w-md">{previewModalUrl}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => previewModalUrl && window.open(previewModalUrl, '_blank')}
            >
              Abrir em nova aba
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
