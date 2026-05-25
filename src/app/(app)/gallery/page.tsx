'use client'

import { useState, useEffect } from 'react'
import { getGalleryProjects, addProjectToGallery, deleteGalleryProject, uploadGalleryImage, type GalleryProject } from '@/lib/api/operations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function GalleryPage() {
  const [projects, setProjects] = useState<GalleryProject[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [newProject, setNewProject] = useState({ title: '', category: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getGalleryProjects()
      setProjects(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      alert("Selecione uma imagem para o portfólio.")
      return
    }
    if (!newProject.title.trim()) {
      alert("Dê um título para o projeto.")
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadGalleryImage(selectedFile)
      if (imageUrl) {
        await addProjectToGallery({
          title: newProject.title.trim(),
          category: newProject.category.trim() || null,
          image_url: imageUrl
        })
        setNewProject({ title: '', category: '' })
        setSelectedFile(null)
        setIsModalOpen(false)
        loadData()
      }
    } catch (err) {
      alert("Erro ao enviar imagem. Verifique o tamanho ou tente novamente.")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Deseja apagar este projeto da galeria?")) {
      await deleteGalleryProject(id)
      loadData()
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Galeria de Projetos</h2>
          <p className="text-muted-foreground">
            Portfólio interno de fotos dos trabalhos produzidos.
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5C3D8F] hover:bg-[#4a3173] text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Projeto à Galeria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Imagem (Foto do Trabalho)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título / Descrição Curta</Label>
                <Input 
                  placeholder="Ex: Troféu em Acrílico 5mm"
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria / Tag</Label>
                <Input 
                  placeholder="Ex: Casamento, Acrílico, Corte Laser"
                  value={newProject.category}
                  onChange={e => setNewProject({...newProject, category: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full bg-[#5C3D8F] hover:bg-[#4a3173] mt-4" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Enviando...' : 'Salvar Projeto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {projects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground w-full flex flex-col items-center border border-dashed rounded-lg bg-gray-50">
              <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
              Nenhum projeto adicionado na galeria.
            </div>
          ) : (
            projects.map(project => (
              <Card key={project.id} className="break-inside-avoid overflow-hidden border-0 shadow-md group relative">
                <div className="relative w-full">
                  <img 
                    src={project.image_url} 
                    alt={project.title}
                    className="w-full object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white font-semibold text-sm truncate">{project.title}</p>
                    {project.category && <p className="text-purple-200 text-xs truncate">{project.category}</p>}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
