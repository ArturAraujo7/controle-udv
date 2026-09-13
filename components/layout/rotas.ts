import { Home, Package, CalendarDays, Users, BarChart3, type LucideIcon } from 'lucide-react'

export type ItemNav = {
  href: string
  label: string
  icon: LucideIcon
}

/** Destinos principais — header no desktop, tab bar no mobile. */
export const NAV_PRINCIPAL: ItemNav[] = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/sessoes', label: 'Sessões', icon: CalendarDays },
  { href: '/membros', label: 'Membros', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

/** Rotas sem shell algum (tela cheia). */
const ROTAS_SEM_SHELL = ['/login', '/design-system']

export function temShell(pathname: string) {
  return !ROTAS_SEM_SHELL.includes(pathname)
}

export function estaAtiva(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
