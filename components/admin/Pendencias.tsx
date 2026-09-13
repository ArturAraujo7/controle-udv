'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { SeletorMembro } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useLista } from '@/hooks/useListas'
import { useMembrosSelecao } from '@/hooks/useMembros'
import { buscarTodos } from '@/lib/consultas'
import { formatarData } from '@/lib/formato'
import { rotuloMestre } from '@/lib/membros'
import type { MembroRef } from '@/lib/sessoes'
import { supabase } from '@/lib/supabaseClient'
import type { Preparo, Sessao } from '@/lib/tipos'

type SessaoPendente = Pick<
  Sessao,
  'id' | 'data_realizacao' | 'tipo' | 'dirigente' | 'dirigente_id' | 'dirigente_2_id' | 'tipo_delegacao' |
  'explanador' | 'explanador_id' | 'leitor_documentos' | 'leitor_documentos_id'
>
type PreparoPendente = Pick<Preparo, 'id' | 'data_preparo' | 'mestre_preparo' | 'mestre_preparo_id'>

const texto = (v: string | null | undefined) => !!v && v.trim() !== ''

function pendenciasSessao(s: SessaoPendente) {
  return {
    dirigente: texto(s.dirigente) && s.dirigente_id === null,
    leitor: texto(s.leitor_documentos) && s.leitor_documentos_id === null,
    explanador: texto(s.explanador) && s.explanador_id === null,
    delegacao: s.dirigente_2_id !== null && !s.tipo_delegacao,
  }
}

const temPendencia = (s: SessaoPendente) => Object.values(pendenciasSessao(s)).some(Boolean)

/** Registros com nomes só em texto (sem vínculo com o cadastro) ou delegação sem classificação. */
export async function carregarPendencias() {
  const [sessoes, preparos] = await Promise.all([
    buscarTodos<SessaoPendente>((de, ate) =>
      supabase
        .from('sessoes')
        .select('id, data_realizacao, tipo, dirigente, dirigente_id, dirigente_2_id, tipo_delegacao, explanador, explanador_id, leitor_documentos, leitor_documentos_id')
        .order('data_realizacao', { ascending: false })
        .range(de, ate)
    ),
    buscarTodos<PreparoPendente>((de, ate) =>
      supabase
        .from('preparos')
        .select('id, data_preparo, mestre_preparo, mestre_preparo_id')
        .is('mestre_preparo_id', null)
        .order('data_preparo', { ascending: false })
        .range(de, ate)
    ),
  ])
  return {
    sessoes: sessoes.filter(temPendencia),
    preparos: preparos.filter(p => texto(p.mestre_preparo)),
  }
}

export function Pendencias({ onContagem }: { onContagem?: (n: number) => void }) {
  const { membros, adicionar } = useMembrosSelecao()
  const [dados, setDados] = useState<Awaited<ReturnType<typeof carregarPendencias>> | null>(null)

  useEffect(() => {
    let ativo = true
    carregarPendencias()
      .then(d => { if (ativo) setDados(d) })
      .catch(e => toast.error('Erro ao carregar pendências', { description: e instanceof Error ? e.message : undefined }))
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (dados) onContagem?.(dados.sessoes.length + dados.preparos.length)
  }, [dados, onContagem])

  const aplicarSessao = async (id: number, payload: Partial<SessaoPendente>) => {
    const { error } = await supabase.from('sessoes').update(payload).eq('id', id)
    if (error) {
      toast.error('Erro ao aplicar correção', { description: error.message })
      return
    }
    toast.success('Correção aplicada')
    setDados(d => d && {
      ...d,
      sessoes: d.sessoes.map(s => (s.id === id ? { ...s, ...payload } : s)).filter(temPendencia),
    })
  }

  const aplicarPreparo = async (id: number, mestre: MembroRef) => {
    const { error } = await supabase
      .from('preparos')
      .update({ mestre_preparo_id: mestre.id, mestre_preparo: mestre.nome.replace(/^M\.\s*/i, '') })
      .eq('id', id)
    if (error) {
      toast.error('Erro ao vincular', { description: error.message })
      return
    }
    toast.success('Mestre do preparo vinculado')
    setDados(d => d && { ...d, preparos: d.preparos.filter(p => p.id !== id) })
  }

  if (!dados) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
  }

  if (dados.sessoes.length + dados.preparos.length === 0) {
    return (
      <Card className="border border-dashed ring-0">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 size-8 text-primary" />
          <h2 className="font-medium">Nenhuma pendência</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Dirigentes, leitores, explanadores e mestres de preparo estão vinculados ao cadastro de membros.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vincule cada nome a um membro do cadastro — ou cadastre o visitante pelo próprio seletor. Assim as fichas dos
        membros e os relatórios contam as participações corretamente.
      </p>
      {dados.sessoes.map(s => (
        <ItemSessao key={s.id} sessao={s} membros={membros} onMembroAdicionado={adicionar} onAplicar={aplicarSessao} />
      ))}
      {dados.preparos.map(p => (
        <ItemPreparo key={p.id} preparo={p} membros={membros} onMembroAdicionado={adicionar} onAplicar={aplicarPreparo} />
      ))}
    </div>
  )
}

type PropsItem = {
  membros: ReturnType<typeof useMembrosSelecao>['membros']
  onMembroAdicionado: ReturnType<typeof useMembrosSelecao>['adicionar']
}

function ItemSessao({
  sessao,
  membros,
  onMembroAdicionado,
  onAplicar,
}: PropsItem & { sessao: SessaoPendente; onAplicar: (id: number, payload: Partial<SessaoPendente>) => Promise<void> }) {
  const pendente = pendenciasSessao(sessao)
  const tiposDelegacao = useLista('tipos_delegacao')
  const [dirigentes, setDirigentes] = useState<MembroRef[]>([])
  const [tipoDelegacao, setTipoDelegacao] = useState(sessao.tipo_delegacao || 'Transmissão da Assistência')
  // Pré-preenchidos com o texto gravado para facilitar a busca
  const [leitor, setLeitor] = useState<MembroRef>({ id: null, nome: pendente.leitor ? sessao.leitor_documentos ?? '' : '' })
  const [explanador, setExplanador] = useState<MembroRef>({ id: null, nome: pendente.explanador ? sessao.explanador ?? '' : '' })
  const [salvando, setSalvando] = useState(false)

  const pronto =
    (!pendente.dirigente || dirigentes.length > 0) &&
    (!pendente.leitor || !!leitor.id) &&
    (!pendente.explanador || !!explanador.id)

  const aplicar = async () => {
    setSalvando(true)
    const payload: Partial<SessaoPendente> = {}
    if (pendente.dirigente) {
      payload.dirigente = dirigentes.map(d => d.nome).join(' / ')
      payload.dirigente_id = dirigentes[0]?.id ?? null
      if (dirigentes.length > 1) {
        payload.dirigente_2_id = dirigentes[1].id
        payload.tipo_delegacao = tipoDelegacao
      }
    }
    if (pendente.delegacao) payload.tipo_delegacao = tipoDelegacao
    if (pendente.leitor) {
      payload.leitor_documentos = leitor.nome
      payload.leitor_documentos_id = leitor.id
    }
    if (pendente.explanador) {
      payload.explanador = explanador.nome
      payload.explanador_id = explanador.id
    }
    await onAplicar(sessao.id, payload)
    setSalvando(false)
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs tabular-nums text-muted-foreground">{formatarData(sessao.data_realizacao)}</p>
            <h3 className="font-medium">Sessão · {sessao.tipo}</h3>
          </div>
          <Badge variant="outline">Pendente</Badge>
        </div>
        <Separator />

        {pendente.dirigente && (
          <div className="space-y-2">
            <Label>Dirigente registrado como <span className="font-normal text-muted-foreground">“{sessao.dirigente}”</span></Label>
            <SeletorMultiploMembro
              membros={membros}
              onMembroAdicionado={onMembroAdicionado}
              value={dirigentes}
              onChange={setDirigentes}
              placeholder="Vincule o membro correspondente…"
              max={2}
            />
          </div>
        )}

        {(pendente.delegacao || dirigentes.length > 1) && (
          <div className="space-y-2">
            <Label htmlFor={`deleg-${sessao.id}`}>Classificação da delegação</Label>
            <Select value={tipoDelegacao} onValueChange={setTipoDelegacao}>
              <SelectTrigger id={`deleg-${sessao.id}`} className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tiposDelegacao.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {pendente.leitor && (
          <div className="space-y-2">
            <Label>Leitor registrado como <span className="font-normal text-muted-foreground">“{sessao.leitor_documentos}”</span></Label>
            <SeletorMembro membros={membros} onMembroAdicionado={onMembroAdicionado} value={leitor} onChange={setLeitor} placeholder="Vincule o membro correspondente…" />
          </div>
        )}

        {pendente.explanador && (
          <div className="space-y-2">
            <Label>Explanador registrado como <span className="font-normal text-muted-foreground">“{sessao.explanador}”</span></Label>
            <SeletorMembro membros={membros} onMembroAdicionado={onMembroAdicionado} value={explanador} onChange={setExplanador} placeholder="Vincule o membro correspondente…" />
          </div>
        )}

        <Button onClick={aplicar} disabled={!pronto || salvando} className="w-full">
          {salvando && <Loader2 className="animate-spin" />}
          {salvando ? 'Aplicando…' : 'Aplicar correção'}
        </Button>
      </CardContent>
    </Card>
  )
}

function ItemPreparo({
  preparo,
  membros,
  onMembroAdicionado,
  onAplicar,
}: PropsItem & { preparo: PreparoPendente; onAplicar: (id: number, mestre: MembroRef) => Promise<void> }) {
  const [mestre, setMestre] = useState<MembroRef>({ id: null, nome: preparo.mestre_preparo })
  const [salvando, setSalvando] = useState(false)

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs tabular-nums text-muted-foreground">{formatarData(preparo.data_preparo)}</p>
            <h3 className="font-medium">Preparo · {rotuloMestre(preparo.mestre_preparo)}</h3>
          </div>
          <Badge variant="outline">Pendente</Badge>
        </div>
        <div className="space-y-2">
          <Label>Mestre do preparo registrado como <span className="font-normal text-muted-foreground">“{preparo.mestre_preparo}”</span></Label>
          <SeletorMembro membros={membros} onMembroAdicionado={onMembroAdicionado} value={mestre} onChange={setMestre} placeholder="Vincule o membro correspondente…" />
        </div>
        <Button
          className="w-full"
          disabled={!mestre.id || salvando}
          onClick={async () => {
            setSalvando(true)
            await onAplicar(preparo.id, mestre)
            setSalvando(false)
          }}
        >
          {salvando && <Loader2 className="animate-spin" />}
          Vincular
        </Button>
      </CardContent>
    </Card>
  )
}
