'use client'
import { useEffect, useState } from 'react'

import { urlArquivo } from '@/lib/arquivos'

/** URL assinada de um arquivo do bucket, ou `null` enquanto carrega / sem arquivo. */
export function useArquivoUrl(caminho: string | null | undefined) {
  const [url, setUrl] = useState<{ caminho: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!caminho) return
    let ativo = true
    urlArquivo(caminho).then(u => {
      if (ativo) setUrl({ caminho, url: u })
    })
    return () => { ativo = false }
  }, [caminho])

  return caminho && url?.caminho === caminho ? url.url : null
}
