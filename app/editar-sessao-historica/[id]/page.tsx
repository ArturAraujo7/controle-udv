'use client'
import { use } from 'react'

import { FormularioSessaoHistorica } from '@/components/formularios/FormularioSessaoHistorica'

export default function EditarSessaoHistorica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FormularioSessaoHistorica key={id} id={Number(id)} />
}
