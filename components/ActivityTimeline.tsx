import { Database, History, User, Activity, Trash2, ArrowUpRight } from 'lucide-react'

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

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
    if (!logs || logs.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Nenhuma atividade registrada ainda.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => {
                const isInsert = log.acao === 'INSERT'
                const isDelete = log.acao === 'DELETE'
                
                let Icon = Activity
                if (log.tabela_afetada === 'preparos') Icon = Database
                if (log.tabela_afetada === 'sessoes') Icon = History
                if (log.tabela_afetada === 'saidas') Icon = ArrowUpRight
                if (isDelete) Icon = Trash2

                return (
                    <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-start gap-4 hover:border-gold-300 dark:hover:border-gold-800 transition-colors">
                        <div className={`p-2 rounded-xl border flex-shrink-0 ${
                            isDelete ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400' :
                            isInsert ? 'bg-celestial-50 border-celestial-100 text-celestial-600 dark:bg-celestial-900/20 dark:border-celestial-900/50 dark:text-celestial-400' :
                            'bg-gold-50 border-gold-100 text-gold-600 dark:bg-gold-900/20 dark:border-gold-900/50 dark:text-gold-400'
                        }`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 leading-snug">
                                {log.mensagem_automatica || `${log.acao} em ${log.tabela_afetada}`}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 font-medium">
                                    <User className="w-3 h-3" />
                                    {log.profiles?.full_name || log.user_id || 'Sistema / Auto'}
                                </span>
                                <span>•</span>
                                <span>
                                    {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
