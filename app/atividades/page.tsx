'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ActivityTimeline, ActivityLog } from '@/components/ActivityTimeline'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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
                setLogs(data as unknown as ActivityLog[])
            } else if (error) {
                console.error("Erro ao buscar logs: ", error.message, error.details, error.hint)
            }
            setLoading(false)
        }

        // Só busca quando confirmou que é admin; nos demais casos a tela já
        // redirecionou ou ainda está resolvendo o perfil.
        if (profile?.role === 'admin') {
            fetchLogs()
        }
    }, [profile, router])

    if (!profile || profile.role !== 'admin') {
        return (
            <div className="space-y-4">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-20 rounded-xl" />
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
                    <ArrowLeft />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight">Registro de atividades</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-12">
                Histórico automático das alterações no sistema — as 100 ocorrências mais recentes.
            </p>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
            ) : (
                <ActivityTimeline logs={logs} />
            )}
        </>
    )
}
