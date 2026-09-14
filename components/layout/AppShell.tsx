'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { ehCentral } from '@/lib/permissoes'
import { cn } from '@/lib/utils'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { ehRotaFormulario, ehRotaRegional, temShell } from './rotas'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const central = ehCentral(profile)

  // O Mestre Central não pertence a núcleo: usa só a visão regional (e o próprio perfil).
  useEffect(() => {
    if (central && temShell(pathname) && !ehRotaRegional(pathname) && pathname !== '/perfil') {
      router.replace('/regional')
    }
  }, [central, pathname, router])

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
