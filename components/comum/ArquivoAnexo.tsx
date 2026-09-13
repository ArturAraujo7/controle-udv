'use client'

import { FileText } from 'lucide-react'

import { useArquivoUrl } from '@/hooks/useArquivoUrl'

const EXTENSOES_IMAGEM = /\.(png|jpe?g|webp|gif|heic)$/i

/** Prévia de um arquivo privado do bucket (imagem ou link para abrir). */
export function ArquivoAnexo({ caminho, rotulo = 'Abrir arquivo' }: { caminho: string; rotulo?: string }) {
  const url = useArquivoUrl(caminho)

  if (!url) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-label="Carregando arquivo" />
  }

  if (EXTENSOES_IMAGEM.test(caminho)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={rotulo} className="max-h-80 w-full object-contain bg-muted" />
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-medium text-primary hover:bg-muted/50"
    >
      <FileText className="size-5" /> {rotulo}
    </a>
  )
}
