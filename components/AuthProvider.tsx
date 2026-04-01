'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { Session } from '@supabase/supabase-js'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'representante' | 'assistente' | 'mestre'
}

type AuthContextType = {
  session: Session | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ session: null, profile: null, loading: true })

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar perfil:', error.message)
        return null
      }
      return data as Profile
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
      
      if (!session && pathname !== '/login') {
        router.push('/login')
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      setSession(session)
      
      if (session) {
        // Busca perfil em segundo plano
        fetchProfile(session.user.id).then(userProfile => {
          if (mounted) setProfile(userProfile)
        })
        
        if (pathname === '/login') {
          router.push('/')
        }
      } else {
        setProfile(null)
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname, fetchProfile])

  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="w-8 h-8 border-4 border-gold-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}