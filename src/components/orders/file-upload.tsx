'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadCloud, X, File, FileText, FileImage, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface OrderFile {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  created_at: string
}

interface FileUploadProps {
  orderId: string
  clientName?: string
}

export function FileUpload({ orderId, clientName }: FileUploadProps) {
  const [files, setFiles] = useState<OrderFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles()
  }, [orderId])

  async function loadFiles() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (err: any) {
      console.error('Error loading files:', err)
      setError('Erro ao carregar arquivos')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        // 50MB limit
        if (file.size > 50 * 1024 * 1024) {
          setError(`O arquivo ${file.name} excede o limite de 50MB.`)
          continue
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${orderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('order-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('order-files')
          .getPublicUrl(fileName)

        // Save metadata to database
        const { data: dbData, error: dbError } = await supabase
          .from('order_files')
          .insert({
            order_id: orderId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            file_url: urlData.publicUrl,
            uploaded_by: user?.id
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Trigger Email Notification (if Resend is configured)
        try {
           await fetch('/api/send-email', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               to: ['hellenmartins072@gmail.com'],
               subject: `Novo Arquivo Enviado - Pedido #${orderId.substring(0,8)}`,
               html: `
                 <h2>Um novo arquivo foi enviado!</h2>
                 <p><strong>Parceiro/Cliente:</strong> ${clientName || 'Desconhecido'}</p>
                 <p><strong>Pedido ID:</strong> ${orderId}</p>
                 <p><strong>Arquivo:</strong> ${file.name}</p>
                 <br/>
                 <a href="${urlData.publicUrl}" style="background: #5C3D8F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Baixar Arquivo</a>
               `
             })
           })
        } catch (e) {
           console.error("Falha ao enviar email, mas arquivo foi salvo.", e)
        }
      }

      await loadFiles()
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setError(`Erro ao enviar arquivo: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: string, fileUrl: string) => {
    if (!confirm("Deseja realmente excluir este arquivo?")) return
    
    try {
      // Remover do Storage (Precisamos extrair o path da URL)
      // A URL publica geralmente tem o formato: https://[project].supabase.co/storage/v1/object/public/order-files/orderId/filename
      const urlParts = fileUrl.split('/order-files/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from('order-files').remove([filePath])
      }

      // Remover do BD
      await supabase.from('order_files').delete().eq('id', fileId)
      setFiles(files.filter(f => f.id !== fileId))
    } catch (err) {
      console.error('Error deleting file', err)
      setError('Erro ao excluir o arquivo')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploading ? 'bg-gray-50 border-gray-300' : 'hover:bg-purple-50 hover:border-[#5C3D8F] border-gray-200 cursor-pointer'}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
          accept=".pdf,.png,.jpg,.jpeg,.ai,.cdr,.svg,.eps,.zip,.rar"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center text-[#5C3D8F]">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="font-medium">Enviando arquivos...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-[#5C3D8F]/10 rounded-full flex items-center justify-center mb-4 text-[#5C3D8F]">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="font-medium text-gray-900 mb-1">Clique para selecionar ou arraste arquivos</p>
            <p className="text-sm">PNG, JPG, PDF, AI, CDR, SVG (Max 50MB)</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Arquivos do Pedido ({files.length})</h4>
        
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-[#5C3D8F]" /></div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum arquivo anexado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={file.file_name}>{file.file_name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" asChild>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(file.id, file.file_url)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
