import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsBell } from "@/components/layout/notifications-bell"
import SettingsProvider from "@/components/layout/settings-provider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <SettingsProvider>
        <div className="print:hidden">
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-h-screen print:min-h-0 print:block">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px] print:hidden">
            <SidebarTrigger />
            <div className="w-full flex-1">
              <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationsBell />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 print:p-0 print:m-0 print:overflow-visible">
            {children}
          </main>
        </div>
      </SettingsProvider>
    </SidebarProvider>
  )
}
