'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { ArquivoAnexo } from '@/components/comum/ArquivoAnexo'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { BlocoChamadas, BlocoHistorias } from '@/components/formularios/BlocosSessao'
import {
  BlocoFormulario, Campo, CampoMotivo, LinhaInterruptor, SkeletonFormulario,
} from '@/components/formularios/Campos'
import { FormLayout, type AcaoEnvio } from '@/components/formularios/FormLayout'
import { CamposCondutores } from '@/components/sessao/CamposCondutores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useLista } from '@/hooks/useListas'
import { useMembrosSelecao } from '@/hooks/useMembros'
import { enviarArquivo, removerArquivo } from '@/lib/arquivos'
import { FONTES_REGISTRO } from '@/lib/constants'
import { hojeISO, separarDataHora } from '@/lib/formato'
import {
  CONDUTORES_VAZIOS, FILHOS_VAZIOS, carregarSessaoCompleta, colunasCondutores, condutoresDaSessao,
  salvarFilhosSessao, type CondutoresForm, type FilhosSessao,
} from '@/lib/sessoes'
import { supabase } from '@/lib/supabaseClient'

type Fonte = '' | (typeof FONTES_REGISTRO)[number]

type Form = {
  data: string
  hora: string
  dataAproximada: boolean
  tipo: string
  condutores: CondutoresForm
  filhos: FilhosSessao
  fonte: Fonte
  ataArquivo: string | null
  novaAta: File | null
  observacoes: string
  motivo: string
}

const formVazio = (): Form => ({
  data: hojeISO(),
  hora: '20:00',
  dataAproximada: false,
  tipo: 'Escala',
  condutores: CONDUTORES_VAZIOS,
  filhos: FILHOS_VAZIOS,
  fonte: '',
  ataArquivo: null,
  novaAta: null,
  observacoes: '',
  motivo: '',
})

/** Registro histórico: sessões anteriores ao controle, sem participantes nem consumo. */
export function FormularioSessaoHistorica({ id }: { id?: number }) {
  const editando = id !== undefined
  const router = useRouter()
  const { session } = useAuth()
  const { membros, adicionar } = useMembrosSelecao()

  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<Form>(formVazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mesmaData, setMesmaData] = useState<{ id: number; tipo: string }[]>([])
  const tipos = useLista('tipos_sessao', form.tipo)

  const atualizar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }))
  const atualizarCondutores = (parcial: Partial<CondutoresForm>) =>
    setForm(f => ({ ...f, condutores: { ...f.condutores, ...parcial } }))

  useEffect(() => {
    if (!editando) return
    let ativo = true
    carregarSessaoCompleta(id).then(resultado => {
      if (!ativo) return
      if (!resultado) {
        toast.error('Registro histórico não encontrado')
        router.replace('/sessoes')
        return
      }
      const { sessao, filhos } = resultado
      const { data, hora } = separarDataHora(sessao.data_realizacao)
      setForm({
        data,
        hora,
        dataAproximada: !!sessao.data_aproximada,
        tipo: sessao.tipo,
        condutores: condutoresDaSessao(sessao),
        filhos,
        fonte: sessao.fonte_registro ?? '',
        ataArquivo: sessao.ata_arquivo ?? null,
        novaAta: null,
        observacoes: sessao.observacoes || '',
        motivo: '',
      })
      setCarregando(false)
    })
    return () => { ativo = false }
  }, [editando, id, router])

  // Aviso de registro duplicado na mesma data
  useEffect(() => {
    if (!form.data) return
    let ativo = true
    supabase
      .from('sessoes')
      .select('id, tipo')
      .gte('data_realizacao', `${form.data}T00:00:00`)
      .lte('data_realizacao', `${form.data}T23:59:59`)
      .then(({ data }) => {
        if (ativo) setMesmaData(((data ?? []) as { id: number; tipo: string }[]).filter(s => s.id !== id))
      })
    return () => { ativo = false }
  }, [form.data, id])

  const salvar = async (acao: AcaoEnvio) => {
    const e: Record<string, string> = {}
    if (!form.data) e.data = 'Informe a data'
    if (!form.tipo) e.tipo = 'Escolha o tipo de sessão'
    setErros(e)
    if (Object.keys(e).length > 0) {
      toast.error('Revise os campos destacados')
      return
    }
    setSalvando(true)

    let ataArquivo = form.ataArquivo
    if (form.novaAta) {
      try {
        ataArquivo = await enviarArquivo(form.novaAta, 'atas')
      } catch (erro) {
        setSalvando(false)
        toast.error('Não foi possível enviar a ata', { description: erro instanceof Error ? erro.message : undefined })
        return
      }
    }

    const dados = {
      data_realizacao: `${form.data}T${form.hora || '20:00'}:00`,
      tipo: form.tipo,
      ...colunasCondutores(form.condutores),
      quantidade_participantes: 0,
      data_aproximada: form.dataAproximada,
      fonte_registro: form.fonte || null,
      ata_arquivo: ataArquivo,
      observacoes: form.observacoes.trim() || null,
    }

    let idSessao = id
    if (editando) {
      const { error } = await supabase
        .from('sessoes')
        .update({ ...dados, motivo_alteracao: form.motivo.trim() || null })
        .eq('id', id)
      if (error) {
        setSalvando(false)
        toast.error('Erro ao atualizar o registro', { description: error.message })
        return
      }
    } else {
      const { data, error } = await supabase.from('sessoes').insert({ ...dados, user_id: session?.user.id }).select('id').single()
      if (error || !data) {
        setSalvando(false)
        toast.error('Erro ao salvar o registro', { description: error?.message })
        return
      }
      idSessao = data.id
    }

    // A ata antiga só sai do armazenamento depois que a nova foi gravada na sessão.
    if (form.novaAta && form.ataArquivo) await removerArquivo(form.ataArquivo)

    const avisos = await salvarFilhosSessao(idSessao!, { ...form.filhos, visitantes: [] }, editando)
    setSalvando(false)

    if (avisos.length > 0) {
      toast.warning('Registro salvo, mas parte dos dados não foi gravada', { description: avisos[0] })
    } else {
      toast.success(editando ? 'Registro atualizado' : 'Registro histórico salvo')
    }

    if (acao === 'outro') {
      // Modo em sequência: mantém tipo, dirigentes e fonte para a próxima ata
      setForm(f => ({
        ...formVazio(),
        data: f.data,
        tipo: f.tipo,
        fonte: f.fonte,
        condutores: { ...CONDUTORES_VAZIOS, dirigentes: f.condutores.dirigentes, tipo_delegacao: f.condutores.tipo_delegacao },
      }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    router.replace(`/sessoes/${idSessao}`)
  }

  if (carregando) return <SkeletonFormulario />

  const { condutores } = form

  return (
    <FormLayout
      voltar={editando ? { href: `/sessoes/${id}`, rotulo: 'Sessão' } : { href: '/sessoes', rotulo: 'Sessões' }}
      titulo={editando ? 'Editar registro histórico' : 'Registro histórico'}
      onSubmit={salvar}
      salvando={salvando}
      rotuloSalvar={editando ? 'Salvar alterações' : 'Salvar registro'}
      rotuloOutro={editando ? undefined : 'Salvar e registrar outro'}
    >
      <div className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        <BookOpen className="mt-0.5 size-4 shrink-0" />
        Para sessões anteriores ao controle no Guardião: sem participantes nem consumo de vegetal.
      </div>

      <BlocoFormulario titulo="Quando">
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Data" htmlFor="data" obrigatorio erro={erros.data}>
            <Input id="data" type="date" className="h-10" value={form.data} onChange={e => atualizar('data', e.target.value)} />
          </Campo>
          <Campo rotulo="Hora" htmlFor="hora">
            <Input id="hora" type="time" className="h-10" value={form.hora} onChange={e => atualizar('hora', e.target.value)} />
          </Campo>
        </div>
        <LinhaInterruptor
          id="data-aproximada"
          rotulo="Data aproximada"
          descricao="Marque quando só se sabe o mês ou o ano (use o dia 1)."
          checked={form.dataAproximada}
          onCheckedChange={v => atualizar('dataAproximada', v)}
        />
        {mesmaData.length > 0 && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100" role="status">
            Já existe registro nesta data:{' '}
            {mesmaData.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ', '}
                <Link href={`/sessoes/${s.id}`} className="font-medium underline underline-offset-2">{s.tipo}</Link>
              </span>
            ))}
          </p>
        )}
        <Campo rotulo="Tipo de sessão" htmlFor="tipo" obrigatorio erro={erros.tipo}>
          <Select value={form.tipo} onValueChange={v => atualizar('tipo', v)}>
            <SelectTrigger id="tipo" className="h-10 w-full"><SelectValue placeholder="Escolha o tipo" /></SelectTrigger>
            <SelectContent>
              {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
      </BlocoFormulario>

      <BlocoFormulario
        titulo="Condução"
        descricao="Não encontrou alguém no cadastro? Digite o nome — dá para vincular ao membro depois, na Auditoria."
      >
        <CamposCondutores
          dirigentes={condutores.dirigentes}
          tipoDelegacao={condutores.tipo_delegacao}
          leitor={condutores.leitor}
          explanador={condutores.explanador}
          membros={membros}
          rotuloDirigente="Quem estava na responsabilidade?"
          onDirigentesChange={dirigentes => atualizarCondutores({ dirigentes })}
          onTipoDelegacaoChange={tipo_delegacao => atualizarCondutores({ tipo_delegacao })}
          onLeitorChange={leitor => atualizarCondutores({ leitor })}
          onExplanadorChange={explanador => atualizarCondutores({ explanador })}
          onMembroAdicionado={adicionar}
        />
      </BlocoFormulario>

      <BlocoChamadas
        itens={form.filhos.chamadas}
        onChange={chamadas => atualizar('filhos', { ...form.filhos, chamadas })}
        membros={membros}
        onMembroAdicionado={adicionar}
      />
      <BlocoHistorias itens={form.filhos.historias} onChange={historias => atualizar('filhos', { ...form.filhos, historias })} />

      <BlocoFormulario titulo="Fonte do registro">
        <ChipsFiltro
          rotulo="Origem do registro"
          valor={form.fonte}
          onChange={v => atualizar('fonte', v)}
          opcoes={[
            { valor: '', rotulo: 'Não informada' },
            ...FONTES_REGISTRO.map(f => ({ valor: f, rotulo: f })),
          ]}
        />

        {form.ataArquivo && !form.novaAta && <ArquivoAnexo caminho={form.ataArquivo} rotulo="Abrir ata anexada" />}

        {form.novaAta ? (
          <div className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{form.novaAta.name}</span>
            <Button type="button" variant="ghost" size="icon" aria-label="Remover arquivo" onClick={() => atualizar('novaAta', null)}>
              <X />
            </Button>
          </div>
        ) : (
          <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted/50">
            <Paperclip className="size-5" />
            {form.ataArquivo ? 'Trocar foto ou digitalização da ata' : 'Anexar foto ou digitalização da ata'}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={e => atualizar('novaAta', e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </BlocoFormulario>

      <BlocoFormulario titulo="Observações">
        <Textarea
          aria-label="Observações do registro"
          placeholder="Contexto, lacunas, quem relatou"
          rows={3}
          value={form.observacoes}
          onChange={e => atualizar('observacoes', e.target.value)}
        />
      </BlocoFormulario>

      {editando && <CampoMotivo valor={form.motivo} onChange={v => atualizar('motivo', v)} />}
    </FormLayout>
  )
}
