import { Database, History, User, Activity, Trash2, ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ActivityLog = {
    id: number
    user_id: string
    acao: string
    tabela_afetada: string
    registro_id: number
    mensagem_automatica: string
    created_at: string
    profiles?: {
        full_name: string
    }
}

const ROTULO_ACAO: Record<string, string> = {
    INSERT: 'Criação',
    UPDATE: 'Alteração',
    DELETE: 'Exclusão',
}

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
    if (!logs || logs.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                    <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <ul className="space-y-2">
            {logs.map((log) => {
                const isDelete = log.acao === 'DELETE'

                let Icone = Activity
                if (log.tabela_afetada === 'preparos') Icone = Database
                if (log.tabela_afetada === 'sessoes') Icone = History
                if (log.tabela_afetada === 'saidas') Icone = ArrowUpRight
                if (isDelete) Icone = Trash2

                return (
                    <li key={log.id} className="bg-card rounded-xl border p-4 flex items-start gap-3">
                        <Icone className={cn('w-4 h-4 shrink-0 mt-0.5', isDelete ? 'text-destructive' : 'text-muted-foreground')} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm leading-snug">
                                    {log.mensagem_automatica || `${log.acao} em ${log.tabela_afetada}`}
                                </p>
                                <Badge variant={isDelete ? 'destructive' : 'secondary'} className="shrink-0">
                                    {ROTULO_ACAO[log.acao] || log.acao}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                <span className="flex items-center gap-1 truncate">
                                    <User className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{log.profiles?.full_name || log.user_id || 'Sistema'}</span>
                                </span>
                                <span>·</span>
                                <span className="tabular-nums whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                            </div>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
