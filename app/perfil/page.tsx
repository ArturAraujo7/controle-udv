'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

export default function Perfil() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [fullName, setFullName] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        async function getProfile() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            setUserId(user.id)

            const { data, error } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (data) {
                setFullName(data.full_name || '')
            }

            setLoading(false)
        }

        getProfile()
    }, [router])

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
            router.push('/')
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
                <Link href="/" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </Link>
                <h1 className="text-xl font-bold">Meu Perfil</h1>
            </header>

            <div className="max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                        <User className="w-10 h-10" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        ID: {userId?.slice(0, 8)}...
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
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Este nome aparecerá no histórico das sessões que você criou.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {updating ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Perfil</>}
                    </button>
                </form>
            </div>
        </div>
    )
}
