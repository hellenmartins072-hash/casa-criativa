'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Package, Calendar, Clock, AlertTriangle, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { getDashboardAlerts, Alert } from '@/lib/api/alerts'

export function NotificationsBell() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)

  // Polling every 5 minutes or fetch once on mount
  useEffect(() => {
    async function fetchAlerts() {
      const data = await getDashboardAlerts()
      setAlerts(data)
    }
    
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = alerts.length

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="h-4 w-4 text-orange-500" />
      case 'deadline': return <Clock className="h-4 w-4 text-red-500" />
      case 'quote_pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'birthday': return <Gift className="h-4 w-4 text-blue-500" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const handleAlertClick = (alert: Alert) => {
    setOpen(false)
    if (alert.actionUrl) {
      router.push(alert.actionUrl)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[85vh] overflow-y-auto">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificações</span>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Tudo tranquilo por aqui! Nenhuma pendência urgente.
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-1">
            {alerts.map((alert) => (
              <DropdownMenuItem 
                key={alert.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${alert.urgent ? 'bg-red-50/50' : ''}`}
                onClick={() => handleAlertClick(alert)}
              >
                <div className="flex items-center gap-2 font-medium text-sm w-full">
                  {getIcon(alert.type)}
                  <span className="flex-1 truncate">{alert.title}</span>
                  {alert.urgent && <Badge variant="destructive" className="text-[10px] px-1 h-4">Urgente</Badge>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 w-full pl-6">
                  {alert.message}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
