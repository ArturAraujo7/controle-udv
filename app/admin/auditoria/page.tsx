'use client'
import Link from 'next/link'
import { use, useCallback, useEffect, useState } from 'react'
import { Download, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'

import { BadgeAcao } from '@/components/admin/Badges'
import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { Pendencias, carregarPendencias } from '@/components/admin/Pendencias'
import { Avatar } from '@/components/comum/Avatar'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { ItemLista, ListaCard, Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ROTULO_ACAO, ROTULO_TABELA, descreverRegistro, resumoAlteracao } from '@/lib/auditoria'
import { baixarCSV } from '@/lib/csv'
import { formatarData, formatarDataHora } from '@/lib/formato'
import { supabase } from '@/lib/supabaseClient'
import type { RegistroAtividade } from '@/lib/tipos'
import { cn } from '@/lib/utils'

type Log = RegistroAtividade & { profiles: { full_name: string | null } | null }

type Parametros = { aba?: string; tabela?: string; registro?: string; usuario?: string }

const COLUNAS = 'id, user_id, acao, tabela_afetada, registro_id, registro_uuid, dados_antigos, dados_novos, mensagem_automatica, motivo, created_at, profiles ( full_name )'
const COLUNAS_BASICAS = 'id, user_id, acao, tabela_afetada, registro_id, dados_antigos, dados_novos, mensagem_automatica, created_at, profiles ( full_name )'
const PRINCIPAIS = ['sessoes', 'preparos', 'saidas', 'membros', 'profiles']
const POR_PAGINA = 50

export default function PaginaAuditoria({ searchParams }: { searchParams: Promise<Parametros> }) {
  const parametros = use(searchParams)
  return (
    <ExigirAdmin>
      <Auditoria parametros={parametros} />
    </ExigirAdmin>
  )
}

function Auditoria({ parametros }: { parametros: Parametros }) {
  const [aba, setAba] = useState<'alteracoes' | 'pendencias'>(parametros.aba === 'pendencias' ? 'pendencias' : 'alteracoes')
  const [pendencias, setPendencias] = useState<number | null>(null)

  useEffect(() => {
    let ativo = true
    carregarPendencias()
      .then(d => { if (ativo) setPendencias(d.sessoes.length + d.preparos.length) })
      .catch(() => {})
    return () => { ativo = false }
  }, [])

  const atualizarContagem = useCallback((n: number) => setPendencias(n), [])

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <Cabecalho titulo="Auditoria" descricao="Histórico de alterações e dados a corrigir." />

      <nav aria-label="Seções da auditoria" className="mb-5 grid grid-cols-2 rounded-lg bg-muted p-[3px]">
        {([
          { valor: 'alteracoes', rotulo: 'Alterações' },
          { valor: 'pendencias', rotulo: `Pendências${pendencias !== null ? ` (${pendencias})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.valor}
            type="button"
            onClick={() => setAba(t.valor)}
            aria-current={aba === t.valor ? 'page' : undefined}
            className={cn(
              'rounded-md py-1.5 text-sm font-medium transition-colors',
              aba === t.valor ? 'bg-background text-foreground shadow-sm dark:bg-input/40' : 'text-muted-foreground'
            )}
          >
            {t.rotulo}
          </button>
        ))}
      </nav>

      {aba === 'alteracoes' ? <Alteracoes parametros={parametros} /> : <Pendencias onContagem={atualizarContagem} />}
    </div>
  )
}

function rotuloDia(iso: string) {
  const data = new Date(iso)
  const hoje = new Date()
  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)
  if (data.toDateString() === hoje.toDateString()) return 'Hoje'
  if (data.toDateString() === ontem.toDateString()) return 'Ontem'
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Alteracoes({ parametros }: { parametros: Parametros }) {
  const [acao, setAcao] = useState('todas')
  const [tabela, setTabela] = useState(parametros.tabela && !parametros.registro ? parametros.tabela : 'todas')
  const [periodo, setPeriodo] = useState(parametros.registro ? 'tudo' : '30')
  const [usuario, setUsuario] = useState(parametros.usuario ?? 'todos')
  const [registro, setRegistro] = useState(
    parametros.tabela && parametros.registro ? { tabela: parametros.tabela, id: Number(parametros.registro) } : null
  )
  const [usuarios, setUsuarios] = useState<{ id: string; full_name: string | null; email: string | null }[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [carregando, setCarregando] = useState(true)
  const [temMais, setTemMais] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase.from('profiles').select('id, full_name, email').order('full_name').then(({ data }) => {
      if (ativo) setUsuarios(data ?? [])
    })
    return () => { ativo = false }
  }, [])

  const buscar = useCallback(async (de: number) => {
    const montar = (colunas: string) => {
      let consulta = supabase
        .from('activity_logs')
        .select(colunas)
        .order('created_at', { ascending: false })
        .range(de, de + POR_PAGINA - 1)
      if (acao !== 'todas') consulta = consulta.eq('acao', acao)
      if (registro) consulta = consulta.eq('tabela_afetada', registro.tabela).eq('registro_id', registro.id)
      else if (tabela === 'outras') consulta = consulta.not('tabela_afetada', 'in', `(${PRINCIPAIS.join(',')})`)
      else if (tabela !== 'todas') consulta = consulta.eq('tabela_afetada', tabela)
      if (periodo !== 'tudo') consulta = consulta.gte('created_at', new Date(Date.now() - Number(periodo) * 86_400_000).toISOString())
      if (usuario !== 'todos') consulta = consulta.eq('user_id', usuario)
      return consulta
    }

    let resultado = await montar(COLUNAS)
    // Antes das migrations não existem as colunas motivo e registro_uuid
    if (resultado.error) resultado = await montar(COLUNAS_BASICAS)
    if (resultado.error) throw new Error(resultado.error.message)
    return (resultado.data ?? []) as unknown as Log[]
  }, [acao, tabela, periodo, usuario, registro])

  useEffect(() => {
    let ativo = true
    buscar(0)
      .then(novos => {
        if (!ativo) return
        setLogs(novos)
        setTemMais(novos.length === POR_PAGINA)
        setCarregando(false)
      })
      .catch(e => {
        if (!ativo) return
        setCarregando(false)
        toast.error('Erro ao carregar a auditoria', { description: e instanceof Error ? e.message : undefined })
      })
    return () => { ativo = false }
  }, [buscar])

  const carregarMais = async () => {
    const novos = await buscar(logs.length)
    setLogs(atual => [...atual, ...novos])
    setTemMais(novos.length === POR_PAGINA)
  }

  const exportar = () => {
    baixarCSV('auditoria', [
      ['Data', 'Usuário', 'Ação', 'Registro', 'Mudanças', 'Motivo'],
      ...logs.map(l => [
        formatarDataHora(l.created_at),
        l.profiles?.full_name || 'Sistema',
        ROTULO_ACAO[l.acao] ?? l.acao,
        descreverRegistro(l.tabela_afetada, l.dados_novos ?? l.dados_antigos),
        l.acao === 'UPDATE' ? resumoAlteracao(l.dados_antigos, l.dados_novos) : l.mensagem_automatica,
        l.motivo,
      ]),
    ])
  }

  const grupos: { dia: string; itens: Log[] }[] = []
  for (const log of logs) {
    const dia = rotuloDia(log.created_at)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.dia === dia) ultimo.itens.push(log)
    else grupos.push({ dia, itens: [log] })
  }

  return (
    <>
      <div className="space-y-3">
        {registro && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-2.5 text-sm">
            <span>Alterações de <strong className="font-medium">{ROTULO_TABELA[registro.tabela] ?? registro.tabela} #{registro.id}</strong></span>
            <Button variant="ghost" size="icon-sm" aria-label="Limpar filtro de registro" onClick={() => setRegistro(null)}>
              <X />
            </Button>
          </div>
        )}
        <ChipsFiltro
          rotulo="Ação"
          valor={acao}
          onChange={setAcao}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas' },
            { valor: 'INSERT', rotulo: 'Criações' },
            { valor: 'UPDATE', rotulo: 'Edições' },
            { valor: 'DELETE', rotulo: 'Exclusões' },
          ]}
        />
        {!registro && (
          <ChipsFiltro
            rotulo="Tipo de registro"
            valor={tabela}
            onChange={setTabela}
            opcoes={[
              { valor: 'todas', rotulo: 'Tudo' },
              { valor: 'sessoes', rotulo: 'Sessões' },
              { valor: 'preparos', rotulo: 'Preparos' },
              { valor: 'saidas', rotulo: 'Saídas' },
              { valor: 'membros', rotulo: 'Membros' },
              { valor: 'profiles', rotulo: 'Usuários' },
              { valor: 'outras', rotulo: 'Outros' },
            ]}
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-10 w-full" aria-label="Período"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="tudo">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Select value={usuario} onValueChange={setUsuario}>
            <SelectTrigger className="h-10 w-full" aria-label="Usuário"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5">
        {carregando ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : logs.length === 0 ? (
          <Vazio icone={<ShieldCheck />}>Nenhuma alteração neste filtro.</Vazio>
        ) : (
          <div className="space-y-6">
            {grupos.map(grupo => (
              <section key={grupo.dia}>
                <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{grupo.dia}</h2>
                <ListaCard>
                  {grupo.itens.map(log => (
                    <ItemLista
                      key={log.id}
                      href={`/admin/auditoria/${log.id}`}
                      inicio={<Avatar nome={log.profiles?.full_name} />}
                      sobre={<BadgeAcao acao={log.acao} />}
                      titulo={`${log.profiles?.full_name || 'Sistema'} · ${descreverRegistro(log.tabela_afetada, log.dados_novos ?? log.dados_antigos)}`}
                      subtitulo={log.acao === 'UPDATE' ? resumoAlteracao(log.dados_antigos, log.dados_novos) : log.mensagem_automatica ?? undefined}
                      fim={
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      }
                      quebrarTexto
                    />
                  ))}
                </ListaCard>
              </section>
            ))}

            <div className="flex flex-col gap-2 sm:flex-row">
              {temMais && (
                <Button variant="outline" className="flex-1" onClick={carregarMais}>Carregar mais</Button>
              )}
              <Button variant="outline" className="flex-1" onClick={exportar}>
                <Download /> Exportar {logs.length} registros (CSV)
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        As alterações são gravadas automaticamente pelo banco desde {formatarData('2026-04-05')}.{' '}
        <Link href="/admin/usuarios" className="underline underline-offset-4">Usuários</Link>
      </p>
    </>
  )
}
