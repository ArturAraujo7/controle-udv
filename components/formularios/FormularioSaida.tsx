'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { BotaoExcluir } from '@/components/BotaoExcluir'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { Vazio } from '@/components/comum/Lista'
import {
  BlocoFormulario, Campo, CampoMotivo, InputUnidade, Segmentado, SkeletonFormulario, Sugestoes,
} from '@/components/formularios/Campos'
import { FormLayout } from '@/components/formularios/FormLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { useLista } from '@/hooks/useListas'
import { calcularSaldos, estoqueDisponivel, type PreparoComSaldo } from '@/lib/estoque'
import { formatarData, formatarNumero, hojeISO } from '@/lib/formato'
import { rotuloMestre } from '@/lib/membros'
import { lerNumero } from '@/lib/sessoes'
import { supabase } from '@/lib/supabaseClient'
import type { Saida } from '@/lib/tipos'
import { cn } from '@/lib/utils'

type Form = {
  data_saida: string
  preparo_id: number | null
  quantidade: string
  tipo_destino: 'Núcleo' | 'Pessoa'
  destino: string
  motivo: string
  observacoes: string
  motivoAlteracao: string
}

const entradaDe = (l: PreparoComSaldo) => (l.tipo === 'Doação' && l.data_chegada) || l.data_preparo
const nomeLote = (l: PreparoComSaldo) => (l.tipo === 'Doação' ? l.nucleo_origem || 'Doação' : rotuloMestre(l.mestre_preparo))

/** Cadastro e edição de saída de vegetal (doação, empréstimo, envio). */
export function FormularioSaida({ id }: { id?: number }) {
  const editando = id !== undefined
  const router = useRouter()
  const estoque = useDadosEstoque()
  const motivos = useLista('motivos_saida')
  const nucleos = useLista('nucleos')

  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [original, setOriginal] = useState<Saida | null>(null)
  const [form, setForm] = useState<Form>({
    data_saida: hojeISO(),
    preparo_id: null,
    quantidade: '',
    tipo_destino: 'Núcleo',
    destino: '',
    motivo: 'Doação',
    observacoes: '',
    motivoAlteracao: '',
  })
  const [erros, setErros] = useState<Partial<Record<'lote' | 'quantidade' | 'destino', string>>>({})

  const atualizar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }))

  useEffect(() => {
    if (!editando) return
    let ativo = true
    supabase.from('saidas').select('*').eq('id', id).single().then(({ data, error }) => {
      if (!ativo) return
      if (error || !data) {
        toast.error('Saída não encontrada')
        router.replace('/estoque/movimentacoes')
        return
      }
      const s = data as Saida
      setOriginal(s)
      setForm({
        data_saida: s.data_saida,
        preparo_id: s.preparo_id,
        quantidade: String(s.quantidade),
        tipo_destino: s.tipo_destino === 'Pessoa' ? 'Pessoa' : 'Núcleo',
        destino: s.destino,
        motivo: s.motivo || 'Outro',
        observacoes: s.observacoes || '',
        motivoAlteracao: '',
      })
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [editando, id, router])

  const lotes = useMemo(
    () => calcularSaldos(estoque.preparos, estoque.consumos, estoque.saidas, { hoje: hojeISO(), sessoes: estoque.sessoes }),
    [estoque.preparos, estoque.consumos, estoque.saidas, estoque.sessoes]
  )

  // Na edição, a quantidade da própria saída volta a contar como disponível no lote de origem.
  const disponivelDe = (lote: PreparoComSaldo) =>
    Math.round((lote.saldo + (original?.preparo_id === lote.id ? Number(original.quantidade) : 0)) * 100) / 100

  const opcoes = lotes
    .filter(l => (disponivelDe(l) > 0 && !l.em_maturacao) || l.id === original?.preparo_id)
    .sort((a, b) => entradaDe(a).localeCompare(entradaDe(b)))

  // Sugere o lote mais antigo com saldo
  const preparoId = form.preparo_id ?? (editando ? null : opcoes[0]?.id ?? null)
  const lote = lotes.find(l => l.id === preparoId)
  const disponivel = lote ? disponivelDe(lote) : 0
  const quantidade = lerNumero(form.quantidade)
  const estoqueTotal = estoqueDisponivel(lotes)
  const variacaoTotal = quantidade - (original ? Number(original.quantidade) : 0)

  const recentes = [...new Map(
    [...estoque.saidas]
      .sort((a, b) => b.data_saida.localeCompare(a.data_saida))
      .map(s => [s.destino, s] as const)
  ).keys()].filter(Boolean).slice(0, 4)

  const validar = () => {
    const e: typeof erros = {}
    if (!preparoId) e.lote = 'Escolha o lote de origem'
    if (!(quantidade > 0)) e.quantidade = 'Informe a quantidade'
    else if (lote && quantidade > disponivel + 0.001) e.quantidade = `O lote tem só ${formatarNumero(disponivel)} L disponíveis`
    if (!form.destino.trim()) e.destino = form.tipo_destino === 'Núcleo' ? 'Informe o núcleo de destino' : 'Informe quem recebeu'
    setErros(e)
    return Object.keys(e).length === 0
  }

  const salvar = async () => {
    if (!validar()) {
      toast.error('Revise os campos destacados')
      return
    }
    setSalvando(true)
    const dados = {
      data_saida: form.data_saida,
      preparo_id: preparoId,
      quantidade,
      destino: form.destino.trim(),
      tipo_destino: form.tipo_destino,
      motivo: form.motivo || null,
      observacoes: form.observacoes.trim() || null,
    }

    const { error } = editando
      ? await supabase.from('saidas').update({ ...dados, motivo_alteracao: form.motivoAlteracao.trim() || null }).eq('id', id)
      : await supabase.from('saidas').insert(dados)

    setSalvando(false)
    if (error) {
      toast.error('Erro ao salvar', { description: error.message })
      return
    }
    toast.success(editando ? 'Saída atualizada' : 'Saída registrada')
    router.replace('/estoque/movimentacoes')
  }

  const excluir = async () => {
    setSalvando(true)
    const { error } = await supabase.from('saidas').delete().eq('id', id)
    if (error) {
      setSalvando(false)
      toast.error('Erro ao excluir', { description: error.message })
      return
    }
    toast.success('Saída excluída — o vegetal voltou ao saldo do lote')
    router.replace('/estoque/movimentacoes')
  }

  if (carregando) return <SkeletonFormulario />

  const definirFracao = (fracao: number) =>
    atualizar('quantidade', String(Math.floor(disponivel * fracao * 100) / 100))

  return (
    <FormLayout
      voltar={{ href: '/estoque/movimentacoes', rotulo: 'Estoque' }}
      titulo={editando ? 'Editar saída' : 'Registrar saída'}
      onSubmit={salvar}
      salvando={salvando}
      desabilitado={estoque.carregando}
      rotuloSalvar={editando ? 'Salvar alterações' : 'Registrar saída'}
      acaoTopo={editando && (
        <BotaoExcluir
          titulo="Excluir este registro de saída?"
          descricao="A quantidade volta ao saldo do lote de origem. A exclusão fica registrada na auditoria."
          disabled={salvando}
          onConfirmar={excluir}
        />
      )}
    >
      <BlocoFormulario>
        <Campo rotulo="Data da saída" htmlFor="data-saida" obrigatorio>
          <Input id="data-saida" type="date" className="h-10" required value={form.data_saida} onChange={e => atualizar('data_saida', e.target.value)} />
        </Campo>
      </BlocoFormulario>

      <BlocoFormulario titulo="Lote de origem" descricao="Só lotes com saldo; o mais antigo aparece primeiro.">
        {estoque.carregando ? (
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        ) : opcoes.length === 0 ? (
          <Vazio>Nenhum lote com saldo disponível.</Vazio>
        ) : (
          <RadioGroup
            value={preparoId ? String(preparoId) : ''}
            onValueChange={v => atualizar('preparo_id', Number(v))}
            className="gap-0 divide-y overflow-hidden rounded-xl border"
            aria-label="Lote de origem"
          >
            {opcoes.map(l => {
              const disp = disponivelDe(l)
              return (
                <label
                  key={l.id}
                  htmlFor={`lote-${l.id}`}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem id={`lote-${l.id}`} value={String(l.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{nomeLote(l)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatarData(entradaDe(l))}{l.grau ? ` · Grau ${l.grau}` : ''}{l.tipo === 'Doação' ? ' · Doação' : ''}
                    </span>
                  </span>
                  <span className={cn('text-sm font-semibold tabular-nums', l.percentual < 20 && 'text-amber-600 dark:text-amber-400')}>
                    {formatarNumero(disp)} L
                  </span>
                </label>
              )
            })}
          </RadioGroup>
        )}
        {erros.lote && <p className="text-xs text-destructive" role="alert">{erros.lote}</p>}

        <Campo
          rotulo="Quantidade"
          htmlFor="quantidade"
          obrigatorio
          erro={erros.quantidade}
          ajuda={lote ? `Disponível no lote: ${formatarNumero(disponivel)} L` : undefined}
        >
          <InputUnidade
            id="quantidade"
            placeholder="0,00"
            value={form.quantidade}
            aria-invalid={!!erros.quantidade}
            onChange={e => atualizar('quantidade', e.target.value)}
          />
        </Campo>
        {lote && disponivel > 0 && (
          <div className="flex gap-2">
            {[
              { rotulo: '¼ do lote', fracao: 0.25 },
              { rotulo: '½ do lote', fracao: 0.5 },
              { rotulo: 'Tudo', fracao: 1 },
            ].map(o => (
              <Button key={o.rotulo} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => definirFracao(o.fracao)}>
                {o.rotulo}
              </Button>
            ))}
          </div>
        )}
      </BlocoFormulario>

      <BlocoFormulario titulo="Destino">
        <Segmentado
          rotulo="Tipo de destino"
          valor={form.tipo_destino}
          onChange={v => atualizar('tipo_destino', v)}
          opcoes={[
            { valor: 'Núcleo', rotulo: 'Núcleo' },
            { valor: 'Pessoa', rotulo: 'Pessoa' },
          ]}
        />
        <Sugestoes id="sugestoes-destino" opcoes={form.tipo_destino === 'Núcleo' ? nucleos : []} />
        <Campo
          rotulo={form.tipo_destino === 'Núcleo' ? 'Núcleo de destino' : 'Quem recebeu'}
          htmlFor="destino"
          obrigatorio
          erro={erros.destino}
        >
          <Input
            id="destino"
            list="sugestoes-destino"
            className="h-10"
            placeholder={form.tipo_destino === 'Núcleo' ? 'Buscar ou digitar o núcleo' : 'Nome da pessoa'}
            value={form.destino}
            aria-invalid={!!erros.destino}
            onChange={e => atualizar('destino', e.target.value)}
          />
        </Campo>
        {recentes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Recentes</p>
            <div className="flex flex-wrap gap-2">
              {recentes.map(d => (
                <Button key={d} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => atualizar('destino', d)}>
                  {d}
                </Button>
              ))}
            </div>
          </div>
        )}
      </BlocoFormulario>

      <BlocoFormulario titulo="Motivo">
        <ChipsFiltro
          rotulo="Motivo da saída"
          valor={form.motivo}
          onChange={v => atualizar('motivo', v)}
          opcoes={motivos.map(m => ({ valor: m, rotulo: m }))}
        />
        <Campo rotulo="Observações" htmlFor="observacoes">
          <Textarea
            id="observacoes"
            rows={3}
            placeholder="Ex.: portador, condições do envio"
            value={form.observacoes}
            onChange={e => atualizar('observacoes', e.target.value)}
          />
        </Campo>
      </BlocoFormulario>

      {editando && <CampoMotivo valor={form.motivoAlteracao} onChange={v => atualizar('motivoAlteracao', v)} />}

      {lote && quantidade > 0 && !erros.quantidade && (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
        >
          Lote após a saída: {formatarNumero(Math.max(0, disponivel - quantidade))} L · Estoque total:{' '}
          {formatarNumero(estoqueTotal - variacaoTotal)} L
        </p>
      )}
    </FormLayout>
  )
}
