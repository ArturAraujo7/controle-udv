import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Cartão com linhas separadas por divisores. */
export function ListaCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <ul className="divide-y">{children}</ul>
    </Card>
  )
}

/**
 * Linha de lista: elemento inicial (ícone/avatar), título, subtítulo e valor à
 * direita. Vira link ou botão (com chevron) quando recebe `href` ou `onClick`.
 */
export function ItemLista({
  href,
  onClick,
  inicio,
  sobre,
  titulo,
  subtitulo,
  fim,
  quebrarTexto = false,
  className,
}: {
  href?: string
  onClick?: () => void
  inicio?: React.ReactNode
  /** Conteúdo acima do título (ex.: badge). */
  sobre?: React.ReactNode
  titulo: React.ReactNode
  subtitulo?: React.ReactNode
  fim?: React.ReactNode
  quebrarTexto?: boolean
  className?: string
}) {
  const interativo = !!href || !!onClick
  const conteudo = (
    <>
      {inicio && <span className="shrink-0">{inicio}</span>}
      <span className="min-w-0 flex-1">
        {sobre && <span className="mb-1 flex flex-wrap gap-1">{sobre}</span>}
        <span className={cn('block text-sm font-medium', !quebrarTexto && 'truncate')}>{titulo}</span>
        {subtitulo && (
          <span className={cn('mt-0.5 block text-xs text-muted-foreground', !quebrarTexto && 'truncate')}>
            {subtitulo}
          </span>
        )}
      </span>
      {fim && <span className="shrink-0 text-right">{fim}</span>}
      {interativo && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
    </>
  )

  const base = 'flex w-full items-center gap-3 px-4 py-3 text-left'
  const interacao = 'outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/60'

  if (href) {
    return (
      <li>
        <Link href={href} className={cn(base, interacao, className)}>{conteudo}</Link>
      </li>
    )
  }
  if (onClick) {
    return (
      <li>
        <button type="button" onClick={onClick} className={cn(base, interacao, className)}>{conteudo}</button>
      </li>
    )
  }
  return <li className={cn(base, className)}>{conteudo}</li>
}

/** Pares rótulo → valor (ex.: procedência, dados cadastrais). */
export function ListaDados({ itens }: { itens: { rotulo: string; valor: React.ReactNode }[] }) {
  return (
    <ListaCard>
      {itens.map(item => (
        <li key={item.rotulo} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
          <span className="shrink-0 text-muted-foreground">{item.rotulo}</span>
          <span className="min-w-0 text-right font-medium">{item.valor}</span>
        </li>
      ))}
    </ListaCard>
  )
}

/** Valor numérico alinhado à direita de uma linha. */
export function ValorLinha({
  valor,
  detalhe,
  className,
}: {
  valor: React.ReactNode
  detalhe?: React.ReactNode
  className?: string
}) {
  return (
    <>
      <span className={cn('block text-sm font-semibold tabular-nums', className)}>{valor}</span>
      {detalhe && <span className="mt-0.5 block text-[11px] text-muted-foreground">{detalhe}</span>}
    </>
  )
}

/** Ícone quadrado neutro para o início das linhas. */
export function IconeLinha({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4', className)}>
      {children}
    </span>
  )
}

/** Estado vazio padrão dentro de um cartão tracejado. */
export function Vazio({
  icone,
  children,
  acao,
}: {
  icone?: React.ReactNode
  children: React.ReactNode
  acao?: React.ReactNode
}) {
  return (
    <Card className="border-dashed ring-0 border">
      <div className="px-4 py-8 text-center">
        {icone && <div className="mx-auto mb-2 flex justify-center text-muted-foreground [&_svg]:size-6">{icone}</div>}
        <p className="text-sm text-muted-foreground">{children}</p>
        {acao && <div className="mt-4">{acao}</div>}
      </div>
    </Card>
  )
}
