'use client'

import { useEffect, useState } from 'react'
import { getSettings, type Settings } from '@/lib/api/settings'

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getSettings()
        setSettings(data)
      } catch (error) {
        console.error(error)
      }
    }
    load()
  }, [])

  if (!settings) return <>{children}</>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          ${settings.primary_color ? `--primary-color: ${settings.primary_color};` : ''}
        }
        .bg-primary { background-color: var(--primary-color, #5C3D8F) !important; }
        .text-primary { color: var(--primary-color, #5C3D8F) !important; }
        .border-primary { border-color: var(--primary-color, #5C3D8F) !important; }
        
        /* Replace hardcoded purple */
        .bg-\\[\\#5C3D8F\\] { background-color: var(--primary-color, #5C3D8F) !important; }
        .text-\\[\\#5C3D8F\\] { color: var(--primary-color, #5C3D8F) !important; }
        .border-\\[\\#5C3D8F\\] { border-color: var(--primary-color, #5C3D8F) !important; }
        .hover\\:bg-\\[\\#4a3173\\]:hover { filter: brightness(0.9); background-color: var(--primary-color, #5C3D8F) !important; }
      `}} />
      {/* We can pass settings via React Context if needed, but CSS variables handle most visual stuff */}
      {/* For Logo, we can just use an event or global state, or directly fetch it in Sidebar */}
      {children}
    </>
  )
}
