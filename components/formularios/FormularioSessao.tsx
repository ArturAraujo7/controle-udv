'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { BlocoChamadas, BlocoHistorias, BlocoVisitantes } from '@/components/formularios/BlocosSessao'
import { BlocoFormulario, Campo, CampoMotivo, InputUnidade, SkeletonFormulario } from '@/components/formularios/Campos'
import { FormLayout } from '@/components/formularios/FormLayout'
import { CamposCondutores } from '@/components/sessao/CamposCondutores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { useItensLista, useLista } from '@/hooks/useListas'
import { useMembrosSelecao } from '@/hooks/useMembros'
import { calcularSaldos, estoqueDisponivel, type PreparoComSaldo } from '@/lib/estoque'
import { formatarData, formatarNumero, hojeISO, separarDataHora } from '@/lib/formato'
import { rotuloMestre } from '@/lib/membros'
import {
  CONDUTORES_VAZIOS, FILHOS_VAZIOS, carregarSessaoCompleta, colunasCondutores, condutoresDaSessao,
  lerNumero, novaChave, salvarFilhosSessao, type CondutoresForm, type FilhosSessao,
} from '@/lib/sessoes'
import { supabase } from '@/lib/supabaseClient'
import type { ConsumoSessao } from '@/lib/tipos'

type ConsumoForm = { chave: string; id_preparo: string; quantidade: string }

type Form = {
  data: string
  hora: string
  tipo: string
  participantes: string
  condutores: CondutoresForm
  consumos: ConsumoForm[]
  filhos: FilhosSessao
  observacoes: string
  motivo: string
}

const consumoVazio = (): ConsumoForm => ({ chave: novaChave(), id_preparo: '', quantidade: '' })

const formVazio = (): Form => ({
  data: hojeISO(),
  hora: '20:00',
  tipo: 'Escala',
  participantes: '',
  condutores: CONDUTORES_VAZIOS,
  consumos: [consumoVazio()],
  filhos: FILHOS_VAZIOS,
  observacoes: '',
  motivo: '',
})

const entradaDe = (l: PreparoComSaldo) => (l.tipo === 'Doação' && l.data_chegada) || l.data_preparo
const nomeLote = (l: PreparoComSaldo) => (l.tipo === 'Doação' ? l.nucleo_origem || 'Doação' : rotuloMestre(l.mestre_preparo))
const arredondar = (n: number) => Math.round(n * 100) / 100

/** Nova sessão, edição e duplicação (copia tipo, horário, condução e participantes). */
export function FormularioSessao({ id, duplicarDe }: { id?: number; duplicarDe?: number }) {
  const editando = id !== undefined
  const router = useRouter()
  const { session } = useAuth()
  const { config } = useConfiguracoes()
  const { membros, adicionar } = useMembrosSelecao()
  const estoque = useDadosEstoque()
  const { itens: itensTipos } = useItensLista('tipos_sessao')

  const [carregando, setCarregando] = useState(editando || duplicarDe !== undefined)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<Form>(formVazio)
  const [consumosOriginais, setConsumosOriginais] = useState<ConsumoSessao[]>([])
  const [erros, setErros] = useState<Record<string, string>>({})
  const tipos = useLista('tipos_sessao', form.tipo)

  const atualizar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }))
  const atualizarCondutores = (parcial: Partial<CondutoresForm>) =>
    setForm(f => ({ ...f, condutores: { ...f.condutores, ...parcial } }))

  useEffect(() => {
    const origem = id ?? duplicarDe
    if (origem === undefined) return
    let ativo = true
    carregarSessaoCompleta(origem).then(resultado => {
      if (!ativo) return
      if (!resultado) {
        toast.error('Sessão não encontrada')
        router.replace('/sessoes')
        return
      }
      const { sessao, consumos, filhos } = resultado
      const { data, hora } = separarDataHora(sessao.data_realizacao)
      if (editando) {
        setConsumosOriginais(consumos)
        setForm({
          data,
          hora,
          tipo: sessao.tipo,
          participantes: String(sessao.quantidade_participantes),
          condutores: condutoresDaSessao(sessao),
          consumos: consumos.length
            ? consumos.map(c => ({ chave: novaChave(), id_preparo: String(c.id_preparo), quantidade: String(c.quantidade_consumida) }))
            : [consumoVazio()],
          filhos,
          observacoes: sessao.observacoes || '',
          motivo: '',
        })
      } else {
        setForm(f => ({
          ...f,
          hora,
          tipo: sessao.tipo,
          participantes: String(sessao.quantidade_participantes || ''),
          condutores: condutoresDaSessao(sessao),
        }))
      }
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [id, duplicarDe, editando, router])

  const lotes = useMemo(
    () => calcularSaldos(estoque.preparos, estoque.consumos, estoque.saidas, { hoje: hojeISO(), sessoes: estoque.sessoes }),
    [estoque.preparos, estoque.consumos, estoque.saidas, estoque.sessoes]
  )

  // Na edição, o que esta sessão já consumiu volta a contar como disponível.
  const originalPorLote = useMemo(() => {
    const mapa = new Map<number, number>()
    for (const c of consumosOriginais) mapa.set(c.id_preparo, (mapa.get(c.id_preparo) ?? 0) + Number(c.quantidade_consumida))
    return mapa
  }, [consumosOriginais])

  const disponivelDe = (lote: PreparoComSaldo) => arredondar(lote.saldo + (originalPorLote.get(lote.id) ?? 0))
  const opcoesLote = lotes
    .filter(l => (disponivelDe(l) > 0 && !l.em_maturacao) || originalPorLote.has(l.id))
    .sort((a, b) => entradaDe(a).localeCompare(entradaDe(b)))

  const total = arredondar(form.consumos.reduce((acc, c) => acc + lerNumero(c.quantidade), 0))
  const totalOriginal = arredondar(consumosOriginais.reduce((acc, c) => acc + Number(c.quantidade_consumida), 0))
  const estoqueApos = arredondar(estoqueDisponivel(lotes, config.somar_maturacao_no_saldo) - (total - totalOriginal))

  const usoPorLote = new Map<string, number>()
  for (const c of form.consumos) {
    if (c.id_preparo) usoPorLote.set(c.id_preparo, (usoPorLote.get(c.id_preparo) ?? 0) + lerNumero(c.quantidade))
  }
  const excedeLote = (c: ConsumoForm) => {
    const lote = lotes.find(l => String(l.id) === c.id_preparo)
    return lote ? (usoPorLote.get(c.id_preparo) ?? 0) > disponivelDe(lote) + 0.001 : false
  }

  const tipoExigeExplanador = itensTipos?.find(t => t.nome === form.tipo)?.exige_explanador ?? false

  const validar = () => {
    const e: Record<string, string> = {}
    if (!form.data) e.data = 'Informe a data'
    if (!form.tipo) e.tipo = 'Escolha o tipo de sessão'
    if (form.condutores.dirigentes.length === 0) e.dirigente = 'Informe quem dirigiu'
    if (config.exigir_leitor_explanador && !form.condutores.leitor.nome.trim()) e.leitor = 'Informe quem leu os documentos'
    if ((config.exigir_leitor_explanador || tipoExigeExplanador) && !form.condutores.explanador.nome.trim()) {
      e.explanador = 'Informe quem fez a explanação'
    }
    if (!(lerNumero(form.participantes) > 0)) e.participantes = 'Informe o número de participantes'

    const validos = form.consumos.filter(c => c.id_preparo && lerNumero(c.quantidade) > 0)
    if (validos.length === 0) e.consumos = 'Informe pelo menos um lote e a quantidade servida'
    for (const c of form.consumos) {
      if (excedeLote(c)) e[`consumo-${c.chave}`] = 'Quantidade maior que o saldo do lote'
    }
    setErros(e)
    return Object.keys(e).length === 0
  }

  const salvar = async () => {
    if (!validar()) {
      toast.error('Revise os campos destacados')
      return
    }
    setSalvando(true)

    const dadosSessao = {
      data_realizacao: `${form.data}T${form.hora || '20:00'}:00`,
      tipo: form.tipo,
      ...colunasCondutores(form.condutores),
      quantidade_participantes: Math.round(lerNumero(form.participantes)),
      observacoes: form.observacoes.trim() || null,
    }

    let idSessao = id
    if (editando) {
      const { error } = await supabase
        .from('sessoes')
        .update({ ...dadosSessao, motivo_alteracao: form.motivo.trim() || null })
        .eq('id', id)
      if (error) {
        setSalvando(false)
        toast.error('Erro ao atualizar a sessão', { description: error.message })
        return
      }
    } else {
      const { data, error } = await supabase
        .from('sessoes')
        .insert({ ...dadosSessao, user_id: session?.user.id })
        .select('id')
        .single()
      if (error || !data) {
        setSalvando(false)
        toast.error('Erro ao registrar a sessão', { description: error?.message })
        return
      }
      idSessao = data.id
    }

    const avisos: string[] = []
    const consumos = form.consumos
      .filter(c => c.id_preparo && lerNumero(c.quantidade) > 0)
      .map(c => ({ id_sessao: idSessao!, id_preparo: Number(c.id_preparo), quantidade_consumida: lerNumero(c.quantidade) }))

    const assinatura = (lista: { id_preparo: number; quantidade_consumida: number }[]) =>
      lista.map(c => `${c.id_preparo}:${Number(c.quantidade_consumida)}`).sort().join('|')
    const consumosMudaram = !editando || assinatura(consumos) !== assinatura(consumosOriginais)

    if (consumosMudaram) {
      if (editando) {
        const { error } = await supabase.from('consumos_sessao').delete().eq('id_sessao', idSessao!)
        if (error) avisos.push(error.message)
      }
      if (avisos.length === 0) {
        const { error } = await supabase.from('consumos_sessao').insert(consumos)
        if (error) avisos.push(error.message)
      }
    }

    avisos.push(...await salvarFilhosSessao(idSessao!, form.filhos, editando))
    setSalvando(false)

    if (avisos.length > 0) {
      toast.warning('Sessão salva, mas parte dos dados não foi gravada', { description: avisos[0] })
    } else {
      toast.success(editando ? 'Sessão atualizada' : 'Sessão registrada')
    }
    router.replace(`/sessoes/${idSessao}`)
  }

  if (carregando) return <SkeletonFormulario />

  const { condutores } = form

  return (
    <FormLayout
      voltar={editando ? { href: `/sessoes/${id}`, rotulo: 'Sessão' } : { href: '/sessoes', rotulo: 'Sessões' }}
      titulo={editando ? 'Editar sessão' : 'Nova sessão'}
      onSubmit={salvar}
      salvando={salvando}
      desabilitado={estoque.carregando}
      rotuloSalvar={editando ? 'Salvar alterações' : 'Salvar sessão'}
    >
      {duplicarDe !== undefined && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          Tipo, horário, condução e participantes foram copiados. Confira a data e o vegetal servido.
        </p>
      )}

      <BlocoFormulario titulo="Quando">
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Data" htmlFor="data" obrigatorio erro={erros.data}>
            <Input id="data" type="date" className="h-10" value={form.data} onChange={e => atualizar('data', e.target.value)} />
          </Campo>
          <Campo rotulo="Hora" htmlFor="hora">
            <Input id="hora" type="time" className="h-10" value={form.hora} onChange={e => atualizar('hora', e.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="Tipo de sessão" htmlFor="tipo" obrigatorio erro={erros.tipo}>
          <Select value={form.tipo} onValueChange={v => atualizar('tipo', v)}>
            <SelectTrigger id="tipo" className="h-10 w-full"><SelectValue placeholder="Escolha o tipo" /></SelectTrigger>
            <SelectContent>
              {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
      </BlocoFormulario>

      <BlocoFormulario titulo="Condução">
        <CamposCondutores
          dirigentes={condutores.dirigentes}
          tipoDelegacao={condutores.tipo_delegacao}
          leitor={condutores.leitor}
          explanador={condutores.explanador}
          membros={membros}
          exigirLeitorExplanador={config.exigir_leitor_explanador}
          exigirExplanador={tipoExigeExplanador}
          erros={{ dirigente: erros.dirigente, leitor: erros.leitor, explanador: erros.explanador }}
          onDirigentesChange={dirigentes => atualizarCondutores({ dirigentes })}
          onTipoDelegacaoChange={tipo_delegacao => atualizarCondutores({ tipo_delegacao })}
          onLeitorChange={leitor => atualizarCondutores({ leitor })}
          onExplanadorChange={explanador => atualizarCondutores({ explanador })}
          onMembroAdicionado={adicionar}
        />
        <Campo rotulo="Participantes" htmlFor="participantes" obrigatorio erro={erros.participantes}>
          <Input
            id="participantes"
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="0"
            className="h-10 tabular-nums sm:max-w-40"
            value={form.participantes}
            aria-invalid={!!erros.participantes}
            onChange={e => atualizar('participantes', e.target.value)}
          />
        </Campo>
      </BlocoFormulario>

      <BlocoFormulario
        titulo="Vegetal servido"
        descricao="Lotes com saldo, do mais antigo para o mais novo."
        acao={<span className="text-sm tabular-nums text-muted-foreground">Total {formatarNumero(total)} L</span>}
      >
        {!estoque.carregando && opcoesLote.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum lote com saldo disponível. Registre um preparo antes de lançar a sessão.
          </p>
        )}
        {form.consumos.map((c, i) => {
          const erroLinha = erros[`consumo-${c.chave}`]
          return (
            <div key={c.chave} className="space-y-1">
              <div className="flex items-start gap-2">
                <Select
                  value={c.id_preparo}
                  onValueChange={v => atualizar('consumos', form.consumos.map(x => (x.chave === c.chave ? { ...x, id_preparo: v } : x)))}
                >
                  <SelectTrigger className="h-10 min-w-0 flex-1" aria-label={`Lote ${i + 1}`} aria-invalid={!!erroLinha}>
                    <SelectValue placeholder={estoque.carregando ? 'Carregando lotes…' : 'Escolha o lote'} />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesLote.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {nomeLote(l)} · {formatarData(entradaDe(l))} · {formatarNumero(disponivelDe(l))} L
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-28 shrink-0">
                  <InputUnidade
                    aria-label={`Quantidade do lote ${i + 1}`}
                    placeholder="0,0"
                    value={c.quantidade}
                    aria-invalid={!!erroLinha}
                    onChange={e => atualizar('consumos', form.consumos.map(x => (x.chave === c.chave ? { ...x, quantidade: e.target.value } : x)))}
                  />
                </div>
                {form.consumos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1 shrink-0"
                    aria-label={`Remover lote ${i + 1}`}
                    onClick={() => atualizar('consumos', form.consumos.filter(x => x.chave !== c.chave))}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              {(erroLinha || (excedeLote(c) && c.quantidade)) && (
                <p className="text-xs text-destructive" role="alert">{erroLinha || 'Quantidade maior que o saldo do lote'}</p>
              )}
            </div>
          )
        })}
        {erros.consumos && <p className="text-xs text-destructive" role="alert">{erros.consumos}</p>}
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full border-dashed text-primary"
          onClick={() => atualizar('consumos', [...form.consumos, consumoVazio()])}
        >
          <Plus /> Adicionar lote
        </Button>
        {total > 0 && !estoque.carregando && (
          <p className="text-xs text-muted-foreground" role="status">
            Total servido: {formatarNumero(total)} L · estoque após: {formatarNumero(estoqueApos)} L
          </p>
        )}
      </BlocoFormulario>

      <BlocoChamadas
        itens={form.filhos.chamadas}
        onChange={chamadas => atualizar('filhos', { ...form.filhos, chamadas })}
        membros={membros}
        onMembroAdicionado={adicionar}
      />
      <BlocoHistorias itens={form.filhos.historias} onChange={historias => atualizar('filhos', { ...form.filhos, historias })} />
      <BlocoVisitantes itens={form.filhos.visitantes} onChange={visitantes => atualizar('filhos', { ...form.filhos, visitantes })} />

      <BlocoFormulario titulo="Observações">
        <Textarea
          aria-label="Observações da sessão"
          placeholder="Ocorrências, avisos ou outras anotações da sessão"
          rows={3}
          value={form.observacoes}
          onChange={e => atualizar('observacoes', e.target.value)}
        />
      </BlocoFormulario>

      {editando && <CampoMotivo valor={form.motivo} onChange={v => atualizar('motivo', v)} />}
    </FormLayout>
  )
}
