'use client'
import { use } from 'react'

import { FormularioPreparo } from '@/components/formularios/FormularioPreparo'

export default function EditarPreparo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FormularioPreparo key={id} id={Number(id)} />
}
