'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** O registro de atividades agora faz parte da Auditoria. */
export default function Atividades() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/auditoria')
  }, [router])

  return null
}
