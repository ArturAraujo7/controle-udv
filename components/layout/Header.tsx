'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Settings, User } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_PRINCIPAL, estaAtiva } from './rotas'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const sair = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight">Guardião</span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-0.5 text-sm">
            {NAV_PRINCIPAL.map(({ href, label }) => {
              const ativa = estaAtiva(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={ativa ? 'page' : undefined}
                  className={cn(
                    'px-3 py-1.5 rounded-md transition-colors',
                    ativa
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Administração">
                  <Settings />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Administração</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/atividades"><Bell /> Atividades</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/usuarios"><User /> Usuários</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/auditoria"><Settings /> Auditoria</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="icon" asChild aria-label="Meu perfil">
            <Link href="/perfil"><User /></Link>
          </Button>

          <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}
