'use client'
import { use } from 'react'

import { FormularioSaida } from '@/components/formularios/FormularioSaida'

export default function EditarSaida({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FormularioSaida key={id} id={Number(id)} />
}
