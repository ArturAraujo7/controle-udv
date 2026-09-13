import { Badge } from '@/components/ui/badge'
import { ROTULO_ACAO } from '@/lib/auditoria'
import { rotuloPapel } from '@/lib/permissoes'
import type { UsuarioAdmin } from '@/lib/tipos'
import { cn } from '@/lib/utils'

export function BadgeUsuario({ usuario }: { usuario: Pick<UsuarioAdmin, 'role' | 'status'> }) {
  if (usuario.status === 'pendente') {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        Pendente
      </Badge>
    )
  }
  if (usuario.status === 'desativado') return <Badge variant="outline" className="text-muted-foreground">Desativado</Badge>
  if (usuario.role === 'admin') return <Badge>Administrador</Badge>
  return <Badge variant={usuario.role === 'mestre' ? 'outline' : 'secondary'}>{rotuloPapel(usuario.role)}</Badge>
}

const ESTILO_ACAO: Record<string, string> = {
  INSERT: 'border-primary/40 bg-primary/10 text-primary',
  UPDATE: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
  DELETE: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export function BadgeAcao({ acao, className }: { acao: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(ESTILO_ACAO[acao], className)}>
      {ROTULO_ACAO[acao] ?? acao}
    </Badge>
  )
}
