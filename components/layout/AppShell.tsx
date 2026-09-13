'use client'

import { usePathname } from 'next/navigation'

import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { temShell } from './rotas'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login e vitrine do design system ocupam a tela inteira.
  if (!temShell(pathname)) return <>{children}</>

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  )
}
