'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { SeletorMembro } from '@/app/components/SeletorMembro'
import { useAuth } from '@/components/AuthProvider'
import { BotaoExcluir } from '@/components/BotaoExcluir'
import {
  BlocoFormulario, Campo, CampoMotivo, InputUnidade, Segmentado, SkeletonFormulario, Sugestoes,
} from '@/components/formularios/Campos'
import { FormLayout } from '@/components/formularios/FormLayout'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { useLista } from '@/hooks/useListas'
import { useMembrosSelecao } from '@/hooks/useMembros'
import { calcularSaldos, estoqueDisponivel } from '@/lib/estoque'
import { formatarNumero, hojeISO } from '@/lib/formato'
import { lerNumero, type MembroRef } from '@/lib/sessoes'
import { supabase } from '@/lib/supabaseClient'
import type { Preparo } from '@/lib/tipos'

type Status = 'Disponível' | 'Em Maturação' | 'Esgotado'

type Form = {
  tipo: 'Local' | 'Doação'
  data_preparo: string
  data_chegada: string
  nucleo_origem: string
  mestre: MembroRef
  procedencia_mariri: string
  procedencia_chacrona: string
  quantidade: string
  grau: string
  status: Status
  data_liberacao: string
  observacoes: string
  motivo: string
}

const formVazio = (): Form => ({
  tipo: 'Local',
  data_preparo: hojeISO(),
  data_chegada: hojeISO(),
  nucleo_origem: '',
  mestre: { id: null, nome: '' },
  procedencia_mariri: '',
  procedencia_chacrona: '',
  quantidade: '',
  grau: '',
  status: 'Disponível',
  data_liberacao: '',
  observacoes: '',
  motivo: '',
})

/** Cadastro e edição de preparo (produção local ou doação recebida). */
export function FormularioPreparo({ id }: { id?: number }) {
  const editando = id !== undefined
  const router = useRouter()
  const { session } = useAuth()
  const { membros, adicionar } = useMembrosSelecao()
  const nucleos = useLista('nucleos')
  const estoque = useDadosEstoque()

  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [original, setOriginal] = useState<Preparo | null>(null)
  const [form, setForm] = useState<Form>(formVazio)
  const [erros, setErros] = useState<Partial<Record<'data' | 'mestre' | 'quantidade' | 'nucleo', string>>>({})

  const atualizar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }))

  useEffect(() => {
    if (!editando) return
    let ativo = true
    supabase.from('preparos').select('*').eq('id', id).single().then(({ data, error }) => {
      if (!ativo) return
      if (error || !data) {
        toast.error('Preparo não encontrado')
        router.replace('/estoque')
        return
      }
      const p = data as Preparo
      setOriginal(p)
      setForm({
        tipo: p.tipo === 'Doação' ? 'Doação' : 'Local',
        data_preparo: p.data_preparo,
        data_chegada: p.data_chegada || p.data_preparo,
        nucleo_origem: p.nucleo_origem || '',
        mestre: { id: p.mestre_preparo_id, nome: p.mestre_preparo || '' },
        procedencia_mariri: p.procedencia_mariri || '',
        procedencia_chacrona: p.procedencia_chacrona || '',
        quantidade: String(p.quantidade_preparada),
        grau: p.grau || '',
        status: p.status ?? 'Disponível',
        data_liberacao: p.data_liberacao || '',
        observacoes: p.observacoes || '',
        motivo: '',
      })
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [editando, id, router])

  const estoqueAtual = useMemo(
    () => estoqueDisponivel(calcularSaldos(estoque.preparos, estoque.consumos, estoque.saidas, { hoje: hojeISO() })),
    [estoque.preparos, estoque.consumos, estoque.saidas]
  )

  const quantidade = lerNumero(form.quantidade)
  const doacao = form.tipo === 'Doação'
  const delta = quantidade - (original ? Number(original.quantidade_preparada) : 0)

  const validar = () => {
    const e: typeof erros = {}
    if (!form.data_preparo) e.data = 'Informe a data do preparo'
    if (!form.mestre.nome.trim()) e.mestre = 'Informe o mestre do preparo'
    if (!(quantidade > 0)) e.quantidade = 'Informe a quantidade em litros'
    if (doacao && !form.nucleo_origem.trim()) e.nucleo = 'Informe o núcleo de origem'
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
      tipo: form.tipo,
      data_preparo: form.data_preparo,
      data_chegada: doacao ? form.data_chegada || null : null,
      nucleo_origem: doacao ? form.nucleo_origem.trim() : null,
      mestre_preparo: form.mestre.nome.trim(),
      mestre_preparo_id: form.mestre.id,
      procedencia_mariri: form.procedencia_mariri.trim() || null,
      procedencia_chacrona: form.procedencia_chacrona.trim() || null,
      quantidade_preparada: quantidade,
      grau: form.grau.trim() || null,
      status: form.status,
      data_liberacao: form.status === 'Em Maturação' ? form.data_liberacao || null : null,
      observacoes: form.observacoes.trim() || null,
    }

    const { data, error } = editando
      ? await supabase.from('preparos').update({ ...dados, motivo_alteracao: form.motivo.trim() || null }).eq('id', id).select('id').single()
      : await supabase.from('preparos').insert({ ...dados, user_id: session?.user.id }).select('id').single()

    setSalvando(false)
    if (error || !data) {
      toast.error('Erro ao salvar', { description: error?.message })
      return
    }
    toast.success(editando ? 'Preparo atualizado' : doacao ? 'Doação registrada' : 'Preparo registrado')
    router.replace(`/estoque/${data.id}`)
  }

  const excluir = async () => {
    setSalvando(true)
    const { error } = await supabase.from('preparos').delete().eq('id', id)
    if (error) {
      setSalvando(false)
      toast.error('Não foi possível excluir', {
        description: error.code === '23503'
          ? 'Este lote tem consumos ou saídas registrados. Exclua esses registros antes.'
          : error.message,
      })
      return
    }
    toast.success('Preparo excluído')
    router.replace('/estoque')
  }

  if (carregando) return <SkeletonFormulario />

  return (
    <FormLayout
      voltar={editando ? { href: `/estoque/${id}`, rotulo: 'Lote' } : { href: '/estoque', rotulo: 'Estoque' }}
      titulo={editando ? 'Editar preparo' : 'Novo preparo'}
      onSubmit={salvar}
      salvando={salvando}
      rotuloSalvar={editando ? 'Salvar alterações' : doacao ? 'Registrar doação' : 'Registrar preparo'}
      acaoTopo={editando && (
        <BotaoExcluir
          titulo="Excluir este preparo?"
          descricao="Só é possível excluir lotes sem consumos nem saídas. A exclusão fica registrada na auditoria."
          disabled={salvando}
          onConfirmar={excluir}
        />
      )}
    >
      {editando ? (
        <Badge variant="outline">{doacao ? 'Doação recebida' : 'Produção local'}</Badge>
      ) : (
        <Segmentado
          rotulo="Tipo de entrada"
          valor={form.tipo}
          onChange={v => atualizar('tipo', v)}
          opcoes={[
            { valor: 'Local', rotulo: 'Produção local' },
            { valor: 'Doação', rotulo: 'Doação recebida' },
          ]}
        />
      )}

      {doacao && (
        <BlocoFormulario titulo="Origem da doação">
          <Sugestoes id="sugestoes-nucleos" opcoes={nucleos} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="Data de chegada" htmlFor="data-chegada">
              <Input id="data-chegada" type="date" className="h-10" value={form.data_chegada} onChange={e => atualizar('data_chegada', e.target.value)} />
            </Campo>
            <Campo rotulo="Núcleo de origem" htmlFor="nucleo" obrigatorio erro={erros.nucleo}>
              <Input
                id="nucleo"
                list="sugestoes-nucleos"
                className="h-10"
                placeholder="Ex.: Núcleo Mestre Gabriel"
                value={form.nucleo_origem}
                aria-invalid={!!erros.nucleo}
                onChange={e => atualizar('nucleo_origem', e.target.value)}
              />
            </Campo>
          </div>
        </BlocoFormulario>
      )}

      <BlocoFormulario titulo="Preparo">
        <Campo rotulo="Data do preparo" htmlFor="data-preparo" obrigatorio erro={erros.data}>
          <Input id="data-preparo" type="date" className="h-10" value={form.data_preparo} onChange={e => atualizar('data_preparo', e.target.value)} />
        </Campo>
        <Campo
          rotulo="Mestre do preparo"
          obrigatorio
          erro={erros.mestre}
          ajuda="Busque no cadastro para vincular à ficha do membro, ou digite o nome."
        >
          <SeletorMembro
            placeholder="Buscar membro ou digitar nome"
            value={form.mestre}
            onChange={mestre => atualizar('mestre', mestre)}
            membros={membros}
            onMembroAdicionado={adicionar}
          />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Quantidade" htmlFor="quantidade" obrigatorio erro={erros.quantidade}>
            <InputUnidade
              id="quantidade"
              placeholder="0,0"
              value={form.quantidade}
              aria-invalid={!!erros.quantidade}
              onChange={e => atualizar('quantidade', e.target.value)}
            />
          </Campo>
          <Campo rotulo="Grau" htmlFor="grau">
            <Input id="grau" className="h-10" placeholder="Ex.: 1" value={form.grau} onChange={e => atualizar('grau', e.target.value)} />
          </Campo>
        </div>
      </BlocoFormulario>

      <BlocoFormulario titulo="Procedência">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo rotulo="Mariri" htmlFor="mariri">
            <Input id="mariri" className="h-10" placeholder="Ex.: Seringal Novo" value={form.procedencia_mariri} onChange={e => atualizar('procedencia_mariri', e.target.value)} />
          </Campo>
          <Campo rotulo="Chacrona" htmlFor="chacrona">
            <Input id="chacrona" className="h-10" placeholder="Ex.: Plantio local" value={form.procedencia_chacrona} onChange={e => atualizar('procedencia_chacrona', e.target.value)} />
          </Campo>
        </div>
      </BlocoFormulario>

      <BlocoFormulario titulo="Situação" descricao="Enquanto em maturação, o lote não aparece no consumo das sessões.">
        {editando ? (
          <Select value={form.status} onValueChange={v => atualizar('status', v as Status)}>
            <SelectTrigger className="h-10 w-full" aria-label="Situação do lote"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Disponível">Disponível</SelectItem>
              <SelectItem value="Em Maturação">Em maturação</SelectItem>
              <SelectItem value="Esgotado">Esgotado</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Segmentado
            rotulo="Situação do lote"
            valor={form.status === 'Em Maturação' ? 'Em Maturação' : 'Disponível'}
            onChange={v => atualizar('status', v)}
            opcoes={[
              { valor: 'Disponível', rotulo: 'Disponível' },
              { valor: 'Em Maturação', rotulo: 'Em maturação' },
            ]}
          />
        )}
        {form.status === 'Em Maturação' && (
          <Campo rotulo="Liberação prevista" htmlFor="liberacao" ajuda="Depois dessa data o lote passa a contar no saldo.">
            <Input id="liberacao" type="date" className="h-10" value={form.data_liberacao} onChange={e => atualizar('data_liberacao', e.target.value)} />
          </Campo>
        )}
      </BlocoFormulario>

      <BlocoFormulario titulo="Observações">
        <Textarea
          aria-label="Observações do preparo"
          placeholder="Anotações do preparo"
          rows={3}
          value={form.observacoes}
          onChange={e => atualizar('observacoes', e.target.value)}
        />
      </BlocoFormulario>

      {editando && <CampoMotivo valor={form.motivo} onChange={v => atualizar('motivo', v)} />}

      {!estoque.carregando && quantidade > 0 && form.status === 'Disponível' && delta !== 0 && (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary" role="status">
          Estoque após salvar: {formatarNumero(estoqueAtual + delta)} L ({delta > 0 ? '+' : '−'}{formatarNumero(Math.abs(delta))} L)
        </p>
      )}
    </FormLayout>
  )
}
