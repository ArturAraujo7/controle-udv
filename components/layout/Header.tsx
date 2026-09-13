'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Plus, Settings, ShieldCheck, SlidersHorizontal, User, Users } from 'lucide-react'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { ehAdmin, podeEditar } from '@/lib/permissoes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BotaoConta } from './AccountSheet'
import { ACOES_RAPIDAS, NAV_PRINCIPAL, estaAtiva } from './rotas'
import { cn } from '@/lib/utils'

export function Header({ ocultarNoMobile = false }: { ocultarNoMobile?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()

  const sair = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden',
        ocultarNoMobile && 'hidden md:block'
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Logo className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Guardião</span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-0.5 text-sm md:flex">
            {NAV_PRINCIPAL.map(item => {
              const ativa = estaAtiva(pathname, item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ativa ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-colors',
                    ativa
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Celular: avatar abre a folha de conta */}
        <div className="md:hidden">
          <BotaoConta />
        </div>

        {/* Desktop */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {podeEditar(profile) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="mr-1">
                  <Plus /> Registrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {ACOES_RAPIDAS.map(({ href, titulo, icon: Icone }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link href={href}><Icone /> {titulo}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeToggle />

          {ehAdmin(profile) && (
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
                  <Link href="/admin/configuracoes"><SlidersHorizontal /> Configurações</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/usuarios"><Users /> Usuários</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/auditoria"><ShieldCheck /> Auditoria</Link>
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
