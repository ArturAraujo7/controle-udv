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

/**
 * Rotas já migradas para a identidade v2 — recebem o novo shell (header + nav).
 * As demais continuam com o invólucro legado até serem migradas; remover esta
 * lista (e o invólucro) quando a última tela entrar.
 */
const ROTAS_MIGRADAS = ['/', '/estoque', '/sessoes', '/nova-sessao']

export function temShell(pathname: string) {
  return !ROTAS_SEM_SHELL.includes(pathname)
}

export function foiMigrada(pathname: string) {
  return ROTAS_MIGRADAS.some(rota =>
    rota === '/' ? pathname === '/' : pathname === rota || pathname.startsWith(`${rota}/`)
  )
}

export function estaAtiva(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
