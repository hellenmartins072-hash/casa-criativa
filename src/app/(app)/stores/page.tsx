"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { StoreFormDialog } from "@/components/store-form-dialog"
import { getStores, deleteStore, Store } from "@/lib/api/stores"
import { Skeleton } from "@/components/ui/skeleton"

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const loadStores = async () => {
    setLoading(true)
    try {
      const data = await getStores()
      setStores(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente EXCLUIR esta loja?")) {
      try {
        await deleteStore(id)
        loadStores()
      } catch (err) {
        alert("Erro ao excluir. Podem existir clientes vinculados a esta loja.")
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lojas e Perfis</h2>
          <p className="text-muted-foreground">
            Gerencie os perfis de vendas da Casa Criativa.
          </p>
        </div>
        <StoreFormDialog onSave={loadStores} />
      </div>

      <div className="border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Cor</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Nenhuma loja cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-md shadow-sm border"
                      style={{ backgroundColor: store.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.instagram || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{store.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={store.is_active ? "default" : "secondary"}>
                      {store.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <StoreFormDialog 
                      initialData={store}
                      onSave={loadStores}
                      triggerButton={
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
