'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, ShieldCheck, Database } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function Perfil() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [fullName, setFullName] = useState('')
    const { session, profile } = useAuth()
    const userId = session?.user?.id || null

    useEffect(() => {
        async function getProfile() {
            if (!session?.user?.id) {
                setLoading(false)
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', session.user.id)
                .single()

            if (data) {
                setFullName(data.full_name || '')
            }

            setLoading(false)
        }

        getProfile()
    }, [session?.user?.id])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        setUpdating(true)

        const updates = {
            id: userId,
            full_name: fullName,
            updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (error) {
            alert('Erro ao atualizar perfil: ' + error.message)
        } else {
            alert('Perfil atualizado com sucesso!')
            router.back()
        }
        setUpdating(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                <div className="animate-pulse">Carregando perfil...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
            <header className="flex items-center mb-6">
                <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
                <h1 className="text-xl font-bold">Meu Perfil</h1>
            </header>

            <div className="max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-celestial-100 dark:bg-celestial-900/30 rounded-full flex items-center justify-center text-celestial-600 dark:text-celestial-400 mb-4">
                        <User className="w-10 h-10" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        ID: {userId?.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium uppercase tracking-wider">
                        Cargo: <span className="text-gold-600 dark:text-gold-500 font-bold">{profile?.role || 'mestre'}</span>
                    </p>
                </div>

                <form onSubmit={handleUpdate} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome de Exibição
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome completo"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-celestial-500/50 focus:border-celestial-500 transition-all"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Este nome aparecerá no histórico das sessões que você criou.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        className="w-full bg-celestial-600 hover:bg-celestial-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-celestial-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {updating ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Perfil</>}
                    </button>
                </form>

                {((profile?.role as string) === 'admin' || (profile?.role as string) === 'geral') && (
                    <div className="mt-8 space-y-3">
                        <Link 
                            href="/admin/usuarios"
                            className="w-full bg-white dark:bg-gray-800 border border-gold-200 dark:border-gold-900/50 text-gold-700 dark:text-gold-500 font-bold py-4 px-4 rounded-2xl shadow-sm hover:shadow-md hover:border-gold-300 dark:hover:border-gold-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <ShieldCheck className="w-6 h-6" />
                            <span>Gerenciar Usuários & Cargos</span>
                        </Link>

                        <Link 
                            href="/admin/auditoria"
                            className="w-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-500 font-bold py-4 px-4 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <Database className="w-6 h-6" />
                            <span>Auditoria de Dados</span>
                        </Link>

                        <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-widest font-medium">
                            Acesso administrativo restrito
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
