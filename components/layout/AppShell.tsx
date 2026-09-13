'use client'

import { usePathname } from 'next/navigation'

import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { foiMigrada, temShell } from './rotas'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login e vitrine do design system ocupam a tela inteira.
  if (!temShell(pathname)) return <>{children}</>

  // Telas ainda não migradas mantêm o invólucro antigo (cartão flutuante) e o
  // cabeçalho próprio. Remover este ramo quando a última tela for migrada.
  if (!foiMigrada(pathname)) {
    return (
      <div className="max-w-5xl mx-auto min-h-screen sm:min-h-[calc(100vh-2rem)] sm:my-4 sm:rounded-3xl bg-gray-50 dark:bg-gray-900 shadow-2xl sm:border border-x-0 sm:border-x border-gray-200 dark:border-gray-800 relative overflow-hidden">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  )
}
