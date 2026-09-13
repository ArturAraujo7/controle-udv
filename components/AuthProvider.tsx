'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { Loader2, ShieldOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Perfil } from '@/lib/tipos'

type AuthContextType = {
  session: Session | null
  profile: Perfil | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ session: null, profile: null, loading: true })

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  // Rotas acessíveis sem sessão (a vitrine do design system só tem dados fictícios)
  const isPublicRoute = pathname === '/login' || pathname === '/design-system'

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // `*` para funcionar antes e depois das migrations (status, membro_id)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar perfil:', error.message)
        return null
      }
      return data as Perfil
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!mounted) return

      if (session) {
        setSession(session)
        // Busca o perfil em segundo plano para não travar o carregamento inicial
        fetchProfile(session.user.id).then(userProfile => {
          if (mounted) setProfile(userProfile)
        })
      } else {
        setSession(null)
        setProfile(null)
      }

      setLoading(false)

      if (!session && !isPublicRoute) {
        router.push('/login')
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setSession(session)

      if (session) {
        fetchProfile(session.user.id).then(userProfile => {
          if (mounted) setProfile(userProfile)
        })

        if (pathname === '/login') {
          router.push('/')
        }
      } else {
        setProfile(null)
        if (!isPublicRoute) {
          router.push('/login')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname, fetchProfile, isPublicRoute])

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (profile?.status === 'desativado' && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <ShieldOff className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Acesso desativado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu acesso ao Guardião foi desativado por um administrador. Fale com a direção do núcleo se achar que é um engano.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
