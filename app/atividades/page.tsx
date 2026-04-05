'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActivityTimeline, ActivityLog } from '@/components/ActivityTimeline'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Bell } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function Atividades() {
    const router = useRouter()
    const { profile } = useAuth()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Redireciona caso o profile ja tenha sido resolvido e não seja admin
        if (profile && profile.role !== 'admin') {
            router.push('/')
            return
        }

        async function fetchLogs() {
            setLoading(true)
            const { data, error } = await supabase
                .from('activity_logs')
                .select(`
                    id,
                    user_id,
                    acao,
                    tabela_afetada,
                    registro_id,
                    mensagem_automatica,
                    created_at,
                    profiles ( full_name )
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (data) {
                // @ts-ignore
                setLogs(data)
            } else if (error) {
                console.error("Erro ao buscar logs: ", error.message, error.details, error.hint)
            }
            setLoading(false)
        }

        // Se confirmou que é admin, busca.
        if (profile?.role === 'admin') {
            fetchLogs()
        } else if (profile !== undefined) {
             // Caso não seja admin, já será redirecionado
             setLoading(false)
        }
    }, [profile, router])

    if (!profile || (profile.role !== 'admin' && typeof window !== 'undefined')) {
         return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Verificando acessos...</div>
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
            <header className="flex items-center mb-6">
                <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gold-600 dark:text-gold-500" />
                    <h1 className="text-xl font-bold">Registro de Atividades</h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Este painel exibe um histórico automatizado de todas as interações e alterações em informações do sistema.
                        Limita-se as 100 ocorrências mais recentes.
                    </p>

                    {loading ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400 animate-pulse font-medium">
                            Carregando histórico estrutural...
                        </div>
                    ) : (
                        <ActivityTimeline logs={logs} />
                    )}
                </div>
            </div>
        </main>
    )
}
