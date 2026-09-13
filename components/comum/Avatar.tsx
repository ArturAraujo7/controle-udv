'use client'

import { useArquivoUrl } from '@/hooks/useArquivoUrl'
import { iniciais } from '@/lib/membros'
import { cn } from '@/lib/utils'

/** Foto (quando houver arquivo) ou iniciais do nome. */
export function Avatar({
  nome,
  arquivo,
  className,
}: {
  nome?: string | null
  arquivo?: string | null
  className?: string
}) {
  const url = useArquivoUrl(arquivo)

  return (
    <span
      className={cn(
        'relative inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground',
        className
      )}
      aria-hidden="true"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  )
}
