import { LayoutDashboard, Users, Store, Box, ShoppingCart, DollarSign, Settings, Building, Truck, Package, BookOpen, LogOut } from "lucide-react"
import { logout } from "@/app/login/actions"

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
    title: "Pedidos e Orçamentos",
    url: "/orders",
    icon: ShoppingCart,
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

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            C
          </div>
          <span className="font-bold text-lg">Casa Criativa</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
