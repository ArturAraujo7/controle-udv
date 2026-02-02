'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

const AuthContext = createContext<{ session: Session | null }>({ session: null })

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (!session && pathname !== '/login') {
        router.push('/login')
      }
    })

    // 2. Escuta mudanças (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session && pathname !== '/login') {
        router.push('/login')
      } else if (session && pathname === '/login') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  // Se estiver carregando e não estiver na tela de login, mostra loading
  // (Evita piscar o conteúdo protegido antes de redirecionar)
  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  )
}