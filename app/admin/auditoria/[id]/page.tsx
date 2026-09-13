'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { History, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { BadgeAcao } from '@/components/admin/Badges'
import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { Avatar } from '@/components/comum/Avatar'
import { ItemLista, ListaCard, ListaDados, Vazio } from '@/components/comum/Lista'
import { Secao, VoltarLink } from '@/components/comum/Secao'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ROTULO_ACAO, TABELAS_COM_MOTIVO, TABELAS_RESTAURAVEIS, camposAlterados, camposPreenchidos,
  descreverRegistro, formatarValor, hrefRegistro, impactoEstoque,
} from '@/lib/auditoria'
import { formatarDataHora, formatarNumero } from '@/lib/formato'
import { supabase } from '@/lib/supabaseClient'
import type { RegistroAtividade } from '@/lib/tipos'
import { cn } from '@/lib/utils'

type Log = RegistroAtividade & { profiles: { full_name: string | null } | null }
type Versao = Pick<RegistroAtividade, 'id' | 'acao' | 'created_at'> & { profiles: { full_name: string | null } | null }

const COR_ACAO: Record<string, string> = {
  INSERT: 'bg-primary',
  UPDATE: 'bg-amber-500',
  DELETE: 'bg-destructive',
}

export default function PaginaAlteracao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ExigirAdmin>
      <DetalheAlteracao id={Number(id)} />
    </ExigirAdmin>
  )
}

function DetalheAlteracao({ id }: { id: number }) {
  const router = useRouter()
  const [log, setLog] = useState<Log | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [confirmar, setConfirmar] = useState(false)
  const [restaurando, setRestaurando] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data, error } = await supabase.from('activity_logs').select('*, profiles ( full_name )').eq('id', id).single()
      if (!ativo) return
      if (error || !data) {
        setNaoEncontrado(true)
        return
      }
      const registro = data as Log
      setLog(registro)

      if (registro.registro_id || registro.registro_uuid) {
        let consulta = supabase
          .from('activity_logs')
          .select('id, acao, created_at, profiles ( full_name )')
          .eq('tabela_afetada', registro.tabela_afetada)
          .order('created_at')
        consulta = registro.registro_id
          ? consulta.eq('registro_id', registro.registro_id)
          : consulta.eq('registro_uuid', registro.registro_uuid!)
        const { data: lista } = await consulta
        if (ativo) setVersoes((lista ?? []) as unknown as Versao[])
      }
    }
    carregar()
    return () => { ativo = false }
  }, [id])

  if (naoEncontrado) {
    return (
      <>
        <VoltarLink href="/admin/auditoria" rotulo="Auditoria" />
        <Vazio icone={<History />}>Alteração não encontrada.</Vazio>
      </>
    )
  }

  if (!log) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const tabela = log.tabela_afetada
  const alterados = log.acao === 'UPDATE' ? camposAlterados(log.dados_antigos, log.dados_novos) : []
  const preenchidos = camposPreenchidos(log.acao === 'DELETE' ? log.dados_antigos : log.dados_novos)
  const impacto = impactoEstoque(tabela, log.acao, log.dados_antigos, log.dados_novos)
  const href = log.acao === 'DELETE' ? null : hrefRegistro(tabela, log.registro_id, log.registro_uuid)
  const podeRestaurar = log.acao === 'UPDATE' && TABELAS_RESTAURAVEIS.has(tabela) && !!log.registro_id && alterados.length > 0
  const titulo = { INSERT: 'Criação', UPDATE: 'Edição', DELETE: 'Exclusão' }[log.acao] ?? log.acao

  const restaurar = async () => {
    setRestaurando(true)
    const dados: Record<string, unknown> = Object.fromEntries(alterados.map(c => [c.campo, c.antes]))
    if (TABELAS_COM_MOTIVO.has(tabela)) dados.motivo_alteracao = `Restaurado a partir da alteração #${log.id}`
    const { error } = await supabase.from(tabela).update(dados).eq('id', log.registro_id!)
    setRestaurando(false)
    setConfirmar(false)
    if (error) {
      toast.error('Não foi possível restaurar', { description: error.message })
      return
    }
    toast.success('Valores anteriores restaurados')
    router.push(href ?? '/admin/auditoria')
  }

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <VoltarLink href="/admin/auditoria" rotulo="Auditoria" />

      <div className="mb-5 space-y-2">
        <BadgeAcao acao={log.acao} />
        <h1 className="text-2xl font-semibold tracking-tight">{descreverRegistro(tabela, log.dados_novos ?? log.dados_antigos)}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar nome={log.profiles?.full_name} className="size-7 text-[10px]" />
          {titulo} por {log.profiles?.full_name || 'Sistema'} · {formatarDataHora(log.created_at)}
        </div>
      </div>

      {href && (
        <ListaCard>
          <ItemLista href={href} titulo="Abrir o registro" subtitulo="Ver como está agora" />
        </ListaCard>
      )}

      {log.acao === 'UPDATE' ? (
        <Secao titulo="O que mudou" acao={`${alterados.length} ${alterados.length === 1 ? 'campo' : 'campos'}`}>
          {alterados.length === 0 ? (
            <Vazio>Nenhuma mudança visível nos dados.</Vazio>
          ) : (
            <div className="space-y-2.5">
              {alterados.map(c => (
                <Card key={c.campo} className="py-3">
                  <CardContent className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{c.rotulo}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive line-through decoration-destructive/60">
                        {formatarValor(c.campo, c.antes)}
                      </span>
                      <span className="text-muted-foreground" aria-hidden="true">→</span>
                      <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">
                        {formatarValor(c.campo, c.depois)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Secao>
      ) : (
        <Secao titulo={log.acao === 'DELETE' ? 'Dados excluídos' : 'Dados registrados'}>
          <ListaDados itens={preenchidos.map(c => ({ rotulo: c.rotulo, valor: formatarValor(c.campo, c.valor) }))} />
        </Secao>
      )}

      {impacto !== null && (
        <Secao titulo="Impacto no estoque">
          <p
            className={cn(
              'rounded-xl border px-4 py-3 text-sm font-medium',
              impacto > 0
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
            )}
          >
            O saldo do estoque {impacto > 0 ? 'aumentou' : 'diminuiu'} {formatarNumero(Math.abs(impacto))} L com esta alteração.
          </p>
        </Secao>
      )}

      {log.motivo && (
        <Secao titulo="Motivo informado">
          <Card><CardContent><p className="text-sm italic text-muted-foreground">“{log.motivo}”</p></CardContent></Card>
        </Secao>
      )}

      {versoes.length > 1 && (
        <Secao titulo="Versões deste registro">
          <ListaCard>
            {versoes.map(v => (
              <ItemLista
                key={v.id}
                href={v.id === log.id ? undefined : `/admin/auditoria/${v.id}`}
                inicio={<span className={cn('block size-2.5 rounded-full', COR_ACAO[v.acao] ?? 'bg-muted-foreground')} aria-hidden="true" />}
                titulo={
                  <>
                    {ROTULO_ACAO[v.acao]} por {v.profiles?.full_name || 'Sistema'}
                    {v.id === log.id && <span className="font-normal text-muted-foreground"> · esta alteração</span>}
                  </>
                }
                subtitulo={formatarDataHora(v.created_at)}
              />
            ))}
          </ListaCard>
        </Secao>
      )}

      {podeRestaurar && (
        <div className="mt-6 space-y-2">
          <Button variant="outline" className="h-10 w-full" onClick={() => setConfirmar(true)}>
            <RotateCcw /> Restaurar valores anteriores
          </Button>
          <p className="text-center text-xs text-muted-foreground">Restaurar cria uma nova alteração; nada é apagado.</p>
        </div>
      )}

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar os valores anteriores?</AlertDialogTitle>
            <AlertDialogDescription>
              {alterados.length} {alterados.length === 1 ? 'campo volta' : 'campos voltam'} ao valor de antes desta edição.
              A restauração fica registrada como uma nova alteração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restaurando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={restaurar} disabled={restaurando}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
