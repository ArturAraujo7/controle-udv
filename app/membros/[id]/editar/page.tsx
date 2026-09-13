'use client'
import { use } from 'react'

import { FormularioMembro } from '@/components/formularios/FormularioMembro'

export default function EditarMembro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FormularioMembro key={id} id={Number(id)} />
}
