import {
  Home, Package, CalendarDays, BarChart3, CalendarPlus, FlaskConical, ArrowUpRight, BookOpen,
  type LucideIcon,
} from 'lucide-react'

export type ItemNav = {
  href: string
  label: string
  icon: LucideIcon
  /** Outras rotas que também acendem esta aba. */
  prefixos: string[]
}

/** Destinos principais — header no desktop, barra flutuante no celular. */
export const NAV_PRINCIPAL: ItemNav[] = [
  { href: '/', label: 'Início', icon: Home, prefixos: [] },
  {
    href: '/estoque', label: 'Estoque', icon: Package,
    prefixos: ['/estoque', '/novo-preparo', '/editar-preparo', '/nova-saida', '/editar-saida'],
  },
  {
    href: '/sessoes', label: 'Sessões', icon: CalendarDays,
    prefixos: [
      '/sessoes', '/membros', '/nova-sessao', '/editar-sessao',
      '/nova-sessao-historica', '/editar-sessao-historica',
    ],
  },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3, prefixos: ['/relatorios'] },
]

/** Visão regional (Mestre Central e administrador geral) — somente leitura, sem botão +. */
export const NAV_REGIONAL: ItemNav[] = [
  { href: '/regional', label: 'Início', icon: Home, prefixos: ['/regional/nucleos'] },
  { href: '/regional/estoque', label: 'Estoque', icon: Package, prefixos: ['/regional/estoque', '/regional/lotes'] },
  { href: '/regional/sessoes', label: 'Sessões', icon: CalendarDays, prefixos: ['/regional/sessoes', '/regional/membros'] },
  { href: '/regional/relatorios', label: 'Relatórios', icon: BarChart3, prefixos: ['/regional/relatorios'] },
]

/** Registros rápidos — folha do botão "+" e menu "Registrar" do desktop. */
export const ACOES_RAPIDAS: {
  href: string
  titulo: string
  descricao: string
  icon: LucideIcon
  destaque?: boolean
}[] = [
  { href: '/nova-sessao', titulo: 'Nova sessão', descricao: 'Registrar a ata de uma sessão', icon: CalendarPlus, destaque: true },
  { href: '/novo-preparo', titulo: 'Novo preparo', descricao: 'Entrada de vegetal no estoque', icon: FlaskConical },
  { href: '/nova-saida', titulo: 'Registrar saída', descricao: 'Doação ou envio a outro núcleo', icon: ArrowUpRight },
  { href: '/nova-sessao-historica', titulo: 'Registro histórico', descricao: 'Sessões anteriores a 2026', icon: BookOpen },
]

/** Rotas sem shell algum (tela cheia). */
const ROTAS_SEM_SHELL = ['/login', '/design-system']

export function temShell(pathname: string) {
  return !ROTAS_SEM_SHELL.includes(pathname)
}

export function estaAtiva(pathname: string, item: ItemNav) {
  return pathname === item.href || item.prefixos.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

export function ehRotaRegional(pathname: string) {
  return pathname === '/regional' || pathname.startsWith('/regional/')
}

export function navDaRota(pathname: string) {
  return ehRotaRegional(pathname) ? NAV_REGIONAL : NAV_PRINCIPAL
}

const ROTA_FORMULARIO = /^\/(?:(?:nova|novo|editar)-[^/]+(?:\/[^/]+)?|membros\/(?:novo|\d+\/editar))\/?$/

/** Formulários escondem a barra de abas e ganham botão de salvar fixo. */
export function ehRotaFormulario(pathname: string) {
  return ROTA_FORMULARIO.test(pathname)
}
