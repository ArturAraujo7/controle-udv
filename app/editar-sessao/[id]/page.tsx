'use client'
import { use } from 'react'

import { FormularioSessao } from '@/components/formularios/FormularioSessao'

export default function EditarSessao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FormularioSessao key={id} id={Number(id)} />
}
