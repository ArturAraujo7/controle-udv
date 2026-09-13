'use client'

import { usePathname } from 'next/navigation'

import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { ehRotaFormulario, temShell } from './rotas'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login e vitrine do design system ocupam a tela inteira.
  if (!temShell(pathname)) return <>{children}</>

  // Formulários: sem barra de abas; o header some no celular (o formulário tem o próprio topo).
  const formulario = ehRotaFormulario(pathname)

  return (
    <div className="min-h-dvh bg-background">
      <Header ocultarNoMobile={formulario} />
      <main className={cn('mx-auto max-w-5xl px-4 py-6', formulario ? 'pb-10' : 'pb-32 md:pb-10')}>
        {children}
      </main>
      {!formulario && <BottomNav />}
    </div>
  )
}
