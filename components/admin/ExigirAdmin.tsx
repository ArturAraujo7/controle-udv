'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { ehAdmin } from '@/lib/permissoes'

/** Só renderiza o conteúdo para administradores; os demais voltam ao Início. */
export function ExigirAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile } = useAuth()
  const admin = ehAdmin(profile)

  useEffect(() => {
    if (profile && !admin) router.replace('/')
  }, [profile, admin, router])

  if (!profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  return admin ? <>{children}</> : null
}
