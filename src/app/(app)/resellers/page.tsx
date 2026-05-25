'use client'

import { useState, useEffect } from "react"
import { getResellers, deleteReseller, type Reseller } from "@/lib/api/resellers"
import { ResellerFormDialog } from "@/components/reseller-form-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, LayoutDashboard } from "lucide-react"
import Link from 'next/link'

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getResellers()
      setResellers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente apagar este revendedor? O acesso dele será perdido.")) {
      try {
        await deleteReseller(id)
        loadData()
      } catch (err) {
        alert("Erro ao excluir. Pode haver pedidos vinculados a ele.")
      }
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#5C3D8F]">Gestão de Revendedores</h2>
          <p className="text-muted-foreground">
            Cadastre parceiros e configure as tabelas de preços e comissões deles.
          </p>
        </div>
        <ResellerFormDialog onSave={loadData} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Revendedores</CardTitle>
          <CardDescription>Gerencie o status e o desconto fixo de cada parceiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Comissão / Desconto</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : resellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum revendedor cadastrado.</TableCell>
                  </TableRow>
                ) : (
                  resellers.map(reseller => (
                    <TableRow key={reseller.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{reseller.full_name}</div>
                        <div className="text-xs text-gray-500">{reseller.document_number || 'Sem documento'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{reseller.whatsapp || reseller.phone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          reseller.status === 'Ativo' ? 'default' : 
                          reseller.status === 'Suspenso' ? 'destructive' : 'secondary'
                        }>
                          {reseller.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {Number(reseller.discount_percentage).toFixed(0)}% OFF
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild title="Painel do Revendedor">
                          <Link href={`/resellers/${reseller.id}`}>
                            <LayoutDashboard className="h-4 w-4 text-[#5C3D8F]" />
                          </Link>
                        </Button>
                        <ResellerFormDialog 
                          initialData={reseller} 
                          onSave={loadData} 
                          triggerButton={
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4 text-gray-500" /></Button>
                          } 
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(reseller.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
