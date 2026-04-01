'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, User, Shield, ShieldCheck, ShieldAlert, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'representante' | 'assistente' | 'mestre'
}

export default function AdminUsuarios() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // 1. Protection: Only admins can stay on this page
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      router.replace('/')
    }
  }, [profile, authLoading, router])

  // 2. Fetch all users
  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error.message)
    } else {
      setProfiles(data as UserProfile[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
    }
  }, [profile])

  // 3. Update User Role
  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    setUpdatingId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Erro ao atualizar cargo: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
    }
    setUpdatingId(null)
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-red-500" />
      case 'representante': return <Shield className="w-4 h-4 text-gold-500" />
      case 'assistente': return <ShieldAlert className="w-4 h-4 text-amber-500" />
      default: return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const roleLabels: Record<string, string> = {
    mestre: 'Mestre',
    assistente: 'Mestre Assistente',
    representante: 'Mestre Representante',
    admin: 'Administrador'
  }

  if (authLoading || (loading && profiles.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300 font-sans">
      <header className="flex items-center mb-8 sticky top-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md z-20 py-2">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">Controle de Cargos e Acessos</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-gold-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* User Card List */}
        <div className="space-y-4">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <User className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum usuário encontrado</p>
            </div>
          ) : (
            filteredProfiles.map((user) => (
              <div 
                key={user.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {user.full_name || 'Sem nome'}
                        {user.id === profile?.id && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold">Você</span>}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || 'Email não disponível'}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider">
                      {getRoleIcon(user.role)}
                      <span className={
                        user.role === 'admin' ? 'text-red-500' : 
                        user.role === 'representante' ? 'text-gold-600' :
                        user.role === 'assistente' ? 'text-amber-600' : 'text-gray-400'
                      }>
                        {roleLabels[user.role]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    disabled={updatingId === user.id}
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value as UserProfile['role'])}
                    className="flex-1 sm:w-44 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-gold-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="mestre">Mestre</option>
                    <option value="assistente">Assistente</option>
                    <option value="representante">Representante</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {updatingId === user.id ? (
                    <div className="w-10 h-10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center text-green-500 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/50">
                        <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
