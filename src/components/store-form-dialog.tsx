"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, createStore, updateStore, uploadStoreLogo } from "@/lib/api/stores"
import { Loader2, Plus, Image as ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function StoreFormDialog({ 
  initialData,
  triggerButton,
  onSave
}: { 
  initialData?: Store,
  triggerButton?: React.ReactNode,
  onSave?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Store>>({
    name: "",
    instagram: "",
    type: "Varejo",
    color: "#5C3D8F",
    logo_url: null,
    is_active: true
  })

  useEffect(() => {
    if (initialData && open) {
      setFormData(initialData)
      setLogoPreview(initialData.logo_url || null)
    } else if (!open && !initialData) {
      setFormData({
        name: "",
        instagram: "",
        type: "Varejo",
        color: "#5C3D8F",
        logo_url: null,
        is_active: true
      })
      setLogoFile(null)
      setLogoPreview(null)
    }
  }, [initialData, open])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let finalData = { ...formData }
      if (logoFile) {
        try {
          const logoUrl = await uploadStoreLogo(logoFile)
          finalData.logo_url = logoUrl
        } catch (err) {
          setError("Erro ao fazer upload do logotipo.")
          setLoading(false)
          return
        }
      }

      if (initialData?.id) {
        await updateStore(initialData.id, finalData)
      } else {
        await createStore(finalData)
      }
      setOpen(false)
      if (onSave) onSave()
    } catch (err) {
      setError("Erro ao salvar loja. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {triggerButton || (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Loja
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Loja</DialogTitle>
            <DialogDescription>
              Adicione um novo perfil de loja ao sistema. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            <div className="flex justify-center mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-full p-2 w-24 h-24 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors relative overflow-hidden">
                {logoPreview || formData.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={logoPreview || formData.logo_url || ''} 
                    alt="Logo da Loja" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted-foreground flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[9px] uppercase">Logo</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Topo de Bolo"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instagram" className="text-right">
                Instagram
              </Label>
              <Input
                id="instagram"
                value={formData.instagram || ''}
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                placeholder="@perfil"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <div className="col-span-3">
                <Select required value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Varejo">Varejo</SelectItem>
                    <SelectItem value="Laser">Laser</SelectItem>
                    <SelectItem value="Corporativo">Corporativo</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color || '#5C3D8F'}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Cor de identificação</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
