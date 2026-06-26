'use client'

import { useState, useEffect } from "react"
import { getResellers, deleteReseller, type Reseller } from "@/lib/api/resellers"
import { ResellerFormDialog } from "@/components/reseller-form-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, LayoutDashboard, Search } from "lucide-react"
import Link from 'next/link'

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getResellers()
      if (data) {
        const sortedByDate = [...data].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
        const withCodes = sortedByDate.map((c, index) => ({
          ...c,
          reseller_code: `REV-${String(index + 1).padStart(3, '0')}`
        }))
        const sortedAlphabetically = withCodes.sort((a, b) => a.full_name.localeCompare(b.full_name))
        setResellers(sortedAlphabetically as any)
      } else {
        setResellers([])
      }
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

  const filteredResellers = resellers.filter(reseller => 
    reseller.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.whatsapp?.includes(searchQuery) ||
    reseller.phone?.includes(searchQuery) ||
    reseller.document_number?.includes(searchQuery) ||
    (reseller as any).reseller_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <div className="flex items-center pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código, nome, documento ou WhatsApp..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Código</TableHead>
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
                ) : filteredResellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum revendedor encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredResellers.map(reseller => (
                    <TableRow key={reseller.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {(reseller as any).reseller_code}
                      </TableCell>
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
