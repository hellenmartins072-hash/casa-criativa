import { LayoutDashboard, Users, Store, Box, ShoppingCart, DollarSign, Settings, Building, Truck, Package, BookOpen, LogOut, Send, KanbanSquare, Calendar, BarChart3, Image as ImageIcon, Megaphone, PlusCircle, Handshake } from "lucide-react"
import { logout } from "@/app/login/actions"
import { getSettings } from "@/lib/api/settings"
import { getCurrentProfile } from "@/lib/api/profiles"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Empresas B2B",
    url: "/companies",
    icon: Building,
  },
  {
    title: "Revendedores",
    url: "/resellers",
    icon: Handshake,
  },
  {
    title: "Pedidos e Orçamentos",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Fila de Produção",
    url: "/production",
    icon: KanbanSquare,
  },
  {
    title: "Agenda de Entregas",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Galeria / Portfólio",
    url: "/gallery",
    icon: ImageIcon,
  },
  {
    title: "Inteligência e KPIs",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Vendas e Marketing",
    url: "/marketing",
    icon: Megaphone,
  },
  {
    title: "Fretes e Entregas",
    url: "/shipping",
    icon: Send,
  },
  {
    title: "Materiais e Custos",
    url: "/materials",
    icon: Box,
  },
  {
    title: "Fornecedores",
    url: "/suppliers",
    icon: Truck,
  },
  {
    title: "Produtos Finais",
    url: "/products",
    icon: Package,
  },
  {
    title: "Catálogos Virtuais",
    url: "/catalogs",
    icon: BookOpen,
  },
  {
    title: "Financeiro",
    url: "/finance",
    icon: DollarSign,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

const resellerItems = [
  {
    title: "Dashboard",
    url: "/reseller/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Catálogo de Revenda",
    url: "/reseller/catalog",
    icon: BookOpen,
  },
  {
    title: "Meus Pedidos",
    url: "/reseller/orders",
    icon: ShoppingCart,
  },
  {
    title: "Solicitar Orçamento",
    url: "/reseller/quote",
    icon: PlusCircle,
  },
]

export async function AppSidebar() {
  const settings = await getSettings()
  const profile = await getCurrentProfile()
  const role = profile?.role || 'admin'
  
  const menuItemsToUse = role === 'reseller' ? resellerItems : items
  
  return (
    <Sidebar variant="sidebar">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt="Logo" className="max-h-10 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
          )}
          {!settings?.logo_url && <span className="font-bold text-lg">Casa Criativa</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItemsToUse.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} render={<a href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 flex flex-col gap-2">
        <form action={logout}>
          <button type="submit" className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors text-left">
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </form>
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
