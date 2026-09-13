'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { BotaoExcluir } from '@/components/BotaoExcluir'
import { Avatar } from '@/components/comum/Avatar'
import {
  BlocoFormulario, Campo, LinhaInterruptor, Segmentado, SkeletonFormulario, Sugestoes,
} from '@/components/formularios/Campos'
import { FormLayout, type AcaoEnvio } from '@/components/formularios/FormLayout'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useLista } from '@/hooks/useListas'
import { enviarArquivo, removerArquivo } from '@/lib/arquivos'
import { hojeISO } from '@/lib/formato'
import { ehAdmin } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { Membro } from '@/lib/tipos'

type Form = {
  nome: string
  nome_exibicao: string
  tipo_vinculo: 'Local' | 'Visitante'
  grau: string
  nucleo_origem: string
  data_ingresso: string
  data_nascimento: string
  ativo: boolean
  fotoArquivo: string | null
  novaFoto: File | null
  usuarioId: string
  dataMudancaGrau: string
}

type UsuarioOpcao = { id: string; full_name: string | null; email: string | null; membro_id: number | null }

const SEM_USUARIO = 'nenhum'

const formVazio = (): Form => ({
  nome: '',
  nome_exibicao: '',
  tipo_vinculo: 'Local',
  grau: 'Sócio',
  nucleo_origem: '',
  data_ingresso: '',
  data_nascimento: '',
  ativo: true,
  fotoArquivo: null,
  novaFoto: null,
  usuarioId: SEM_USUARIO,
  dataMudancaGrau: hojeISO(),
})

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(m|c)\.\s*/, '').trim()

/** Cadastro e edição de membro (substitui o diálogo da lista de membros). */
export function FormularioMembro({ id }: { id?: number }) {
  const editando = id !== undefined
  const router = useRouter()
  const { session, profile } = useAuth()
  const admin = ehAdmin(profile)
  const nucleos = useLista('nucleos')

  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [original, setOriginal] = useState<Membro | null>(null)
  const [usuarioOriginal, setUsuarioOriginal] = useState(SEM_USUARIO)
  const [form, setForm] = useState<Form>(formVazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [outros, setOutros] = useState<Pick<Membro, 'id' | 'nome' | 'nome_exibicao'>[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioOpcao[] | null>(null)
  const graus = useLista('graus', form.grau)

  const atualizar = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm(f => ({ ...f, [campo]: valor }))

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const [lista, perfis, membro] = await Promise.all([
        supabase.from('membros').select('id, nome, nome_exibicao'),
        admin ? supabase.from('profiles').select('id, full_name, email, membro_id').order('full_name') : Promise.resolve(null),
        editando ? supabase.from('membros').select('*').eq('id', id).single() : Promise.resolve(null),
      ])
      if (!ativo) return

      setOutros(((lista.data ?? []) as Pick<Membro, 'id' | 'nome' | 'nome_exibicao'>[]).filter(m => m.id !== id))
      // Sem a coluna membro_id (migration pendente) o vínculo com usuário fica oculto.
      const listaUsuarios = perfis && !perfis.error ? (perfis.data as UsuarioOpcao[]) : null
      setUsuarios(listaUsuarios)

      if (editando) {
        if (!membro || membro.error || !membro.data) {
          toast.error('Membro não encontrado')
          router.replace('/membros')
          return
        }
        const m = membro.data as Membro
        const vinculado = listaUsuarios?.find(u => u.membro_id === m.id)?.id ?? SEM_USUARIO
        setOriginal(m)
        setUsuarioOriginal(vinculado)
        setForm({
          nome: m.nome,
          nome_exibicao: m.nome_exibicao || '',
          tipo_vinculo: m.tipo_vinculo,
          grau: m.grau || '',
          nucleo_origem: m.nucleo_origem || '',
          data_ingresso: m.data_ingresso || '',
          data_nascimento: m.data_nascimento || '',
          ativo: m.ativo,
          fotoArquivo: m.foto_arquivo ?? null,
          novaFoto: null,
          usuarioId: vinculado,
          dataMudancaGrau: hojeISO(),
        })
        setCarregando(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [editando, id, admin, router])

  const previaFoto = useMemo(() => (form.novaFoto ? URL.createObjectURL(form.novaFoto) : null), [form.novaFoto])
  useEffect(() => () => { if (previaFoto) URL.revokeObjectURL(previaFoto) }, [previaFoto])

  const parecido = useMemo(() => {
    const termo = normalizar(form.nome)
    if (termo.length < 5) return null
    return outros.find(m => {
      const nomes = [m.nome, m.nome_exibicao].filter(Boolean).map(n => normalizar(n!))
      return nomes.some(n => n === termo || n.includes(termo) || termo.includes(n))
    }) ?? null
  }, [form.nome, outros])

  const grauMudou = editando && !!original && (original.grau || '') !== form.grau && !!form.grau

  const salvar = async (acao: AcaoEnvio) => {
    const e: Record<string, string> = {}
    if (!form.nome.trim()) e.nome = 'Informe o nome completo'
    if (!form.nome_exibicao.trim()) e.nome_exibicao = 'Informe o nome de exibição'
    if (form.tipo_vinculo === 'Visitante' && !form.nucleo_origem.trim()) e.nucleo = 'Informe o núcleo de origem'
    setErros(e)
    if (Object.keys(e).length > 0) {
      toast.error('Revise os campos destacados')
      return
    }
    setSalvando(true)

    let foto = form.fotoArquivo
    if (form.novaFoto) {
      try {
        foto = await enviarArquivo(form.novaFoto, 'membros')
      } catch (erro) {
        setSalvando(false)
        toast.error('Não foi possível enviar a foto', { description: erro instanceof Error ? erro.message : undefined })
        return
      }
    }

    const dados = {
      nome: form.nome.trim(),
      nome_exibicao: form.nome_exibicao.trim(),
      grau: form.grau || null,
      tipo_vinculo: form.tipo_vinculo,
      nucleo_origem: form.tipo_vinculo === 'Visitante' ? form.nucleo_origem.trim() : null,
      ativo: form.ativo,
      data_ingresso: form.data_ingresso || null,
      data_nascimento: form.data_nascimento || null,
      foto_arquivo: foto,
    }

    const { data, error } = editando
      ? await supabase.from('membros').update(dados).eq('id', id).select('id').single()
      : await supabase.from('membros').insert(dados).select('id').single()

    if (error || !data) {
      setSalvando(false)
      toast.error('Erro ao salvar', { description: error?.message })
      return
    }
    const idMembro = data.id as number
    const avisos: string[] = []

    if (form.novaFoto && form.fotoArquivo) await removerArquivo(form.fotoArquivo)

    if (grauMudou) {
      const { error: erroGrau } = await supabase.from('membros_graus_historico').insert({
        membro_id: idMembro,
        grau_anterior: original!.grau,
        grau_novo: form.grau,
        data: form.dataMudancaGrau || hojeISO(),
        user_id: session?.user.id,
      })
      if (erroGrau) avisos.push(erroGrau.message)
    }

    if (admin && usuarios && form.usuarioId !== usuarioOriginal) {
      if (usuarioOriginal !== SEM_USUARIO) {
        const { error: erro } = await supabase.from('profiles').update({ membro_id: null }).eq('id', usuarioOriginal)
        if (erro) avisos.push(erro.message)
      }
      if (form.usuarioId !== SEM_USUARIO) {
        const { error: erro } = await supabase.from('profiles').update({ membro_id: idMembro }).eq('id', form.usuarioId)
        if (erro) avisos.push(erro.message)
      }
    }

    setSalvando(false)
    if (avisos.length > 0) toast.warning('Membro salvo, mas parte dos dados não foi gravada', { description: avisos[0] })
    else toast.success(editando ? 'Cadastro atualizado' : 'Membro cadastrado')

    if (acao === 'outro') {
      setForm(formVazio())
      setOutros(lista => [...lista, { id: idMembro, nome: dados.nome, nome_exibicao: dados.nome_exibicao }])
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    router.replace(`/membros/${idMembro}`)
  }

  const excluir = async () => {
    setSalvando(true)
    const condutor = `dirigente_id.eq.${id},dirigente_2_id.eq.${id},leitor_documentos_id.eq.${id},explanador_id.eq.${id}`
    const [sessoes, preparos, leituras] = await Promise.all([
      supabase.from('sessoes').select('id', { count: 'exact', head: true }).or(condutor),
      supabase.from('preparos').select('id', { count: 'exact', head: true }).eq('mestre_preparo_id', id),
      supabase.from('leituras').select('id', { count: 'exact', head: true }).eq('leitor_id', id),
    ])
    const participacoes = (sessoes.count ?? 0) + (preparos.count ?? 0) + (leituras.count ?? 0)
    if (participacoes > 0) {
      setSalvando(false)
      toast.error('Este membro tem participações registradas', {
        description: 'Para preservar o histórico, desmarque "Membro ativo" em vez de excluir.',
      })
      return
    }

    const { error } = await supabase.from('membros').delete().eq('id', id)
    if (error) {
      setSalvando(false)
      toast.error('Erro ao excluir', { description: error.message })
      return
    }
    if (form.fotoArquivo) await removerArquivo(form.fotoArquivo)
    toast.success('Cadastro excluído')
    router.replace('/membros')
  }

  if (carregando) return <SkeletonFormulario />

  return (
    <FormLayout
      voltar={editando ? { href: `/membros/${id}`, rotulo: 'Membro' } : { href: '/membros', rotulo: 'Membros' }}
      titulo={editando ? 'Editar membro' : 'Novo membro'}
      onSubmit={salvar}
      salvando={salvando}
      rotuloSalvar={editando ? 'Salvar alterações' : 'Salvar membro'}
      rotuloOutro={editando ? undefined : 'Salvar e cadastrar outro'}
      acaoTopo={editando && (
        <BotaoExcluir
          titulo={`Excluir o cadastro de ${original?.nome ?? 'membro'}?`}
          descricao="Só é possível excluir membros sem participações registradas. Para os demais, desmarque &quot;Membro ativo&quot;."
          disabled={salvando}
          onConfirmar={excluir}
        />
      )}
    >
      <div className="flex flex-col items-center gap-2 pt-1">
        {previaFoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previaFoto} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <Avatar nome={form.nome_exibicao || form.nome} arquivo={form.fotoArquivo} className="size-20 text-xl" />
        )}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-muted">
          <Camera className="size-4" />
          {form.fotoArquivo || form.novaFoto ? 'Trocar foto' : 'Adicionar foto'}
          <input type="file" accept="image/*" className="sr-only" onChange={e => atualizar('novaFoto', e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <BlocoFormulario titulo="Identificação">
        <Campo rotulo="Nome completo" htmlFor="nome" obrigatorio erro={erros.nome}>
          <Input
            id="nome"
            className="h-10"
            placeholder="Nome completo"
            value={form.nome}
            aria-invalid={!!erros.nome}
            onChange={e => atualizar('nome', e.target.value)}
          />
        </Campo>
        <Campo
          rotulo="Nome de exibição"
          htmlFor="nome-exibicao"
          obrigatorio
          erro={erros.nome_exibicao}
          ajuda="É como aparece nas listas, escalas e relatórios."
        >
          <Input
            id="nome-exibicao"
            className="h-10"
            placeholder="Ex.: João Silva"
            value={form.nome_exibicao}
            aria-invalid={!!erros.nome_exibicao}
            onChange={e => atualizar('nome_exibicao', e.target.value)}
          />
        </Campo>
        {parecido && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100" role="status">
            Já existe um membro com nome parecido:{' '}
            <Link href={`/membros/${parecido.id}`} className="font-medium underline underline-offset-2">
              {parecido.nome_exibicao || parecido.nome}
            </Link>
          </p>
        )}
      </BlocoFormulario>

      <BlocoFormulario titulo="Vínculo">
        <Segmentado
          rotulo="Vínculo"
          valor={form.tipo_vinculo}
          onChange={v => atualizar('tipo_vinculo', v)}
          opcoes={[
            { valor: 'Local', rotulo: 'Local' },
            { valor: 'Visitante', rotulo: 'Visitante' },
          ]}
        />
        <Campo rotulo="Grau institucional" htmlFor="grau">
          <Select value={form.grau} onValueChange={v => atualizar('grau', v)}>
            <SelectTrigger id="grau" className="h-10 w-full"><SelectValue placeholder="Selecionar grau" /></SelectTrigger>
            <SelectContent>
              {graus.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
        {grauMudou && (
          <Campo rotulo="Data da mudança de grau" htmlFor="data-grau" ajuda="Fica registrada na trajetória do membro.">
            <Input id="data-grau" type="date" className="h-10" value={form.dataMudancaGrau} onChange={e => atualizar('dataMudancaGrau', e.target.value)} />
          </Campo>
        )}
        {form.tipo_vinculo === 'Visitante' && (
          <Campo rotulo="Núcleo de origem" htmlFor="nucleo" obrigatorio erro={erros.nucleo}>
            <Sugestoes id="sugestoes-nucleos-membro" opcoes={nucleos} />
            <Input
              id="nucleo"
              list="sugestoes-nucleos-membro"
              className="h-10"
              placeholder="Buscar ou digitar o núcleo"
              value={form.nucleo_origem}
              aria-invalid={!!erros.nucleo}
              onChange={e => atualizar('nucleo_origem', e.target.value)}
            />
          </Campo>
        )}
      </BlocoFormulario>

      <BlocoFormulario titulo="Datas">
        <div className="grid grid-cols-2 gap-4">
          <Campo rotulo="Ingresso no núcleo" htmlFor="ingresso">
            <Input id="ingresso" type="date" className="h-10" value={form.data_ingresso} onChange={e => atualizar('data_ingresso', e.target.value)} />
          </Campo>
          <Campo rotulo="Nascimento" htmlFor="nascimento">
            <Input id="nascimento" type="date" className="h-10" value={form.data_nascimento} onChange={e => atualizar('data_nascimento', e.target.value)} />
          </Campo>
        </div>
      </BlocoFormulario>

      {admin && usuarios && (
        <BlocoFormulario titulo="Acesso ao app" descricao="Liga o membro a uma conta do Guardião.">
          <Select value={form.usuarioId} onValueChange={v => atualizar('usuarioId', v)}>
            <SelectTrigger className="h-10 w-full" aria-label="Usuário vinculado"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_USUARIO}>Nenhum usuário vinculado</SelectItem>
              {usuarios.map(u => (
                <SelectItem key={u.id} value={u.id} disabled={!!u.membro_id && u.membro_id !== id}>
                  {u.full_name || u.email}{u.membro_id && u.membro_id !== id ? ' (já vinculado)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BlocoFormulario>
      )}

      <BlocoFormulario>
        <LinhaInterruptor
          id="ativo"
          rotulo="Membro ativo"
          descricao="Inativos saem das listas e seletores, mas o histórico continua."
          checked={form.ativo}
          onCheckedChange={v => atualizar('ativo', v)}
        />
      </BlocoFormulario>
    </FormLayout>
  )
}
