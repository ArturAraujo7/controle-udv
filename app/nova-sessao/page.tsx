'use client'
import { use } from 'react'

import { FormularioSessao } from '@/components/formularios/FormularioSessao'

export default function NovaSessao({ searchParams }: { searchParams: Promise<{ duplicar?: string }> }) {
  const { duplicar } = use(searchParams)
  const origem = Number(duplicar)

  return (
    <FormularioSessao
      key={duplicar ?? 'nova'}
      duplicarDe={duplicar && Number.isFinite(origem) ? origem : undefined}
    />
  )
}
