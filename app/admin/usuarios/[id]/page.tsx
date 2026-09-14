'use client'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { BadgeUsuario } from '@/components/admin/Badges'
import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/comum/Avatar'
import { ItemLista, ListaCard, ListaDados, Vazio } from '@/components/comum/Lista'
import { LinkSecao, Secao, VoltarLink } from '@/components/comum/Secao'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstrutura } from '@/hooks/useEstrutura'
import { useUsuarios } from '@/hooks/useUsuarios'
import { formatarDataHora, formatarRelativo } from '@/lib/formato'
import { nomeMembro } from '@/lib/membros'
import { PAPEIS, rotuloPapel } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { Membro, Papel, SituacaoUsuario } from '@/lib/tipos'

const SEM_MEMBRO = 'nenhum'

type Atividade = { id: number; mensagem_automatica: string | null; created_at: string }
type CamposPerfil = Partial<{
  role: Papel
  status: SituacaoUsuario
  membro_id: number | null
  nucleo_id: number | null
  regiao_id: number | null
}>

export default function PaginaUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ExigirAdmin>
      <DetalheUsuario id={id} />
    </ExigirAdmin>
  )
}

function DetalheUsuario({ id }: { id: string }) {
  const { profile, nucleo: meuNucleo } = useAuth()
  const { carregando, usuarios, completo, recarregar } = useUsuarios()
  const estrutura = useEstrutura()
  const [membros, setMembros] = useState<Membro[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [troca, setTroca] = useState<{ papel: Papel; destino: string } | null>(null)
  const [confirmarDesativar, setConfirmarDesativar] = useState(false)
  const [nucleoAprovacao, setNucleoAprovacao] = useState('')

  const usuario = usuarios.find(u => u.id === id)
  const ehVoce = profile?.id === id

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('membros').select('*').eq('ativo', true).order('nome'),
      supabase
        .from('activity_logs')
        .select('id, mensagem_automatica, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([m, a]) => {
      if (!ativo) return
      setMembros((m.data ?? []) as Membro[])
      setAtividades((a.data ?? []) as Atividade[])
    })
    return () => { ativo = false }
  }, [id])

  const atualizarPerfil = async (dados: CamposPerfil, sucesso: string) => {
    setOcupado(true)
    const { error } = await supabase.from('profiles').update(dados).eq('id', id)
    setOcupado(false)
    if (error) {
      toast.error('Não foi possível atualizar', { description: error.message })
      return false
    }
    toast.success(sucesso)
    await recarregar()
    return true
  }

  const nucleosAtivos = estrutura.nucleos.filter(n => n.ativo)

  const mudarPapel = (papel: Papel) => {
    if (!usuario || papel === usuario.role) return
    const virandoCentral = papel === 'central'
    const saindoDeCentral = usuario.role === 'central'
    if (virandoCentral) {
      const regiao = usuario.regiao_id ?? estrutura.nucleos.find(n => n.id === usuario.nucleo_id)?.regiao_id ?? estrutura.regioes[0]?.id
      setTroca({ papel, destino: regiao ? String(regiao) : '' })
    } else if (saindoDeCentral) {
      const nucleo = nucleosAtivos.find(n => n.regiao_id === usuario.regiao_id) ?? nucleosAtivos[0]
      setTroca({ papel, destino: nucleo ? String(nucleo.id) : '' })
    } else if (papel === 'admin') {
      setTroca({ papel, destino: '' })
    } else {
      atualizarPerfil({ role: papel }, `Papel alterado para ${rotuloPapel(papel)}`)
    }
  }

  const confirmarTroca = async () => {
    if (!troca || !usuario) return
    const dados: CamposPerfil = { role: troca.papel }
    if (troca.papel === 'central') {
      Object.assign(dados, { regiao_id: Number(troca.destino), nucleo_id: null, membro_id: null })
    } else if (usuario.role === 'central') {
      Object.assign(dados, { nucleo_id: Number(troca.destino), regiao_id: null })
    }
    if (await atualizarPerfil(dados, `Papel alterado para ${rotuloPapel(troca.papel)}`)) setTroca(null)
  }

  const enviarRedefinicao = async () => {
    if (!usuario?.email) return
    setOcupado(true)
    const { error } = await supabase.auth.resetPasswordForEmail(usuario.email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setOcupado(false)
    if (error) toast.error('Não foi possível enviar', { description: error.message })
    else toast.success(`E-mail de redefinição enviado para ${usuario.email}`)
  }

  if (carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-4"><Skeleton className="size-16 rounded-full" /><Skeleton className="h-8 w-48" /></div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!usuario) {
    return (
      <>
        <VoltarLink href="/admin/usuarios" rotulo="Usuários" />
        <Vazio>Usuário não encontrado.</Vazio>
      </>
    )
  }

  const central = usuario.role === 'central'
  const mesmoNucleo = !!usuario.nucleo_id && usuario.nucleo_id === meuNucleo?.id
  const membro = usuario.membro_id ? membros.find(m => m.id === usuario.membro_id) : undefined
  const precisaNucleo = !central && !usuario.nucleo_id
  const nucleoParaAprovar = nucleoAprovacao || (usuario.nucleo_id ? String(usuario.nucleo_id) : '')

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <VoltarLink href="/admin/usuarios" rotulo="Usuários" />

      <div className="mb-5 flex items-center gap-4">
        <Avatar nome={usuario.full_name || usuario.email} arquivo={membro?.foto_arquivo} className="size-16 text-lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{usuario.full_name || 'Sem nome'}</h1>
          <p className="truncate text-sm text-muted-foreground">{usuario.email}</p>
          <div className="mt-1.5"><BadgeUsuario usuario={usuario} /></div>
        </div>
      </div>

      {completo && usuario.status === 'pendente' && (
        <Card className="mb-5 ring-amber-300 dark:ring-amber-500/30">
          <CardContent className="space-y-3">
            <p className="text-sm">
              Esta pessoa criou uma conta e aguarda aprovação.
              {precisaNucleo && ' Escolha o núcleo dela para aprovar.'}
            </p>
            {!central && (
              <Select value={nucleoParaAprovar} onValueChange={setNucleoAprovacao}>
                <SelectTrigger className="h-10 w-full" aria-label="Núcleo"><SelectValue placeholder="Escolha o núcleo" /></SelectTrigger>
                <SelectContent>
                  {nucleosAtivos.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.nome} · {estrutura.nomeRegiao(n.regiao_id)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button
                disabled={ocupado || (!central && !nucleoParaAprovar)}
                onClick={() => atualizarPerfil(
                  central ? { status: 'ativo' } : { status: 'ativo', nucleo_id: Number(nucleoParaAprovar) },
                  'Acesso aprovado'
                )}
              >
                Aprovar acesso
              </Button>
              <Button variant="outline" disabled={ocupado} onClick={() => atualizarPerfil({ status: 'desativado' }, 'Acesso recusado')}>Recusar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Secao titulo="Papel" className="mt-0">
        <RadioGroup
          value={usuario.role}
          onValueChange={v => mudarPapel(v as Papel)}
          disabled={ocupado || ehVoce}
          className="gap-0 divide-y overflow-hidden rounded-xl border bg-card"
          aria-label="Papel do usuário"
        >
          {PAPEIS.map(p => (
            <label key={p.valor} htmlFor={`papel-${p.valor}`} className="flex cursor-pointer items-start gap-3 px-4 py-3 has-[[data-state=checked]]:bg-primary/5">
              <RadioGroupItem id={`papel-${p.valor}`} value={p.valor} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">{p.rotulo}</span>
                <span className="block text-xs text-muted-foreground">{p.descricao}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          {ehVoce ? 'Você não pode mudar o próprio papel.' : 'Tornar administrador geral ou Mestre Central pede confirmação.'}
        </p>
      </Secao>

      {completo && !estrutura.indisponivel && (
        central ? (
          <Secao titulo="Região" acao={usuario.regiao_id ? <LinkSecao href={`/regional?regiao=${usuario.regiao_id}`}>Ver visão regional</LinkSecao> : undefined}>
            <Select
              value={usuario.regiao_id ? String(usuario.regiao_id) : ''}
              onValueChange={v => atualizarPerfil({ regiao_id: Number(v) }, 'Região atualizada')}
              disabled={ocupado}
            >
              <SelectTrigger className="h-10 w-full bg-card" aria-label="Região"><SelectValue placeholder="Escolha a região" /></SelectTrigger>
              <SelectContent>
                {estrutura.regioes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-2 px-1 text-xs text-muted-foreground">O Mestre Central não pertence a um núcleo e vê todos os núcleos desta região.</p>
          </Secao>
        ) : (
          <Secao titulo="Núcleo">
            <Select
              value={usuario.nucleo_id ? String(usuario.nucleo_id) : ''}
              onValueChange={v => atualizarPerfil({ nucleo_id: Number(v), membro_id: null }, 'Núcleo atualizado')}
              disabled={ocupado || ehVoce}
            >
              <SelectTrigger className="h-10 w-full bg-card" aria-label="Núcleo"><SelectValue placeholder="Sem núcleo" /></SelectTrigger>
              <SelectContent>
                {nucleosAtivos.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.nome} · {estrutura.nomeRegiao(n.regiao_id)}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              {ehVoce ? 'Você não pode mudar o próprio núcleo.' : 'Trocar o núcleo remove o vínculo com o cadastro de membro.'}
            </p>
          </Secao>
        )
      )}

      {completo && !central && (
        <Secao titulo="Membro vinculado" acao={membro && <LinkSecao href={`/membros/${membro.id}`}>Ver ficha</LinkSecao>}>
          {mesmoNucleo ? (
            <Select
              value={usuario.membro_id ? String(usuario.membro_id) : SEM_MEMBRO}
              onValueChange={v => atualizarPerfil({ membro_id: v === SEM_MEMBRO ? null : Number(v) }, 'Vínculo atualizado')}
              disabled={ocupado}
            >
              <SelectTrigger className="h-10 w-full bg-card" aria-label="Membro vinculado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_MEMBRO}>Nenhum membro vinculado</SelectItem>
                {membros.map(m => <SelectItem key={m.id} value={String(m.id)}>{nomeMembro(m)}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              O cadastro de membros é por núcleo. O vínculo deste usuário é feito pelo formulário do membro, no núcleo dele.
            </p>
          )}
        </Secao>
      )}

      {completo && (
        <Secao titulo="Acesso">
          <ListaDados
            itens={[
              { rotulo: 'Último acesso', valor: usuario.ultimo_acesso ? formatarDataHora(usuario.ultimo_acesso) : 'Nunca' },
              { rotulo: 'Conta criada', valor: formatarDataHora(usuario.criado_em) },
              { rotulo: 'Login por', valor: usuario.provedor === 'google' ? 'Google' : 'E-mail e senha' },
            ]}
          />
        </Secao>
      )}

      <Secao titulo="Atividade recente" acao={<LinkSecao href={`/admin/auditoria?usuario=${id}`}>Ver na auditoria</LinkSecao>}>
        {atividades.length === 0 ? (
          <Vazio>Nenhuma atividade registrada.</Vazio>
        ) : (
          <ListaCard>
            {atividades.map(a => (
              <ItemLista
                key={a.id}
                href={`/admin/auditoria/${a.id}`}
                titulo={a.mensagem_automatica || 'Alteração'}
                fim={<span className="text-xs text-muted-foreground">{formatarRelativo(a.created_at)}</span>}
              />
            ))}
          </ListaCard>
        )}
      </Secao>

      <div className="mt-6 space-y-2.5">
        {usuario.email && (
          <Button variant="outline" className="h-10 w-full" onClick={enviarRedefinicao} disabled={ocupado}>
            {ocupado ? <Loader2 className="animate-spin" /> : <KeyRound />} Enviar redefinição de senha
          </Button>
        )}
        {completo && !ehVoce && usuario.status !== 'pendente' && (
          usuario.status === 'desativado' ? (
            <Button variant="outline" className="h-10 w-full" onClick={() => atualizarPerfil({ status: 'ativo' }, 'Acesso reativado')} disabled={ocupado}>
              Reativar acesso
            </Button>
          ) : (
            <Button variant="outline" className="h-10 w-full text-destructive hover:text-destructive" onClick={() => setConfirmarDesativar(true)} disabled={ocupado}>
              Desativar acesso
            </Button>
          )
        )}
      </div>

      <AlertDialog open={!!troca} onOpenChange={aberto => { if (!aberto) setTroca(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tornar {usuario.full_name || usuario.email} {troca ? rotuloPapel(troca.papel) : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {troca?.papel === 'admin'
                ? 'O administrador geral gerencia regiões, núcleos, usuários, configurações e auditoria de todos os núcleos.'
                : troca?.papel === 'central'
                  ? 'O Mestre Central deixa de pertencer a um núcleo e passa a ver, sem alterar, todos os núcleos da região escolhida.'
                  : 'Escolha o núcleo em que esta pessoa vai atuar.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {troca && troca.papel !== 'admin' && (
            <Select value={troca.destino} onValueChange={destino => setTroca({ ...troca, destino })}>
              <SelectTrigger className="h-10 w-full" aria-label={troca.papel === 'central' ? 'Região' : 'Núcleo'}>
                <SelectValue placeholder={troca.papel === 'central' ? 'Escolha a região' : 'Escolha o núcleo'} />
              </SelectTrigger>
              <SelectContent>
                {troca.papel === 'central'
                  ? estrutura.regioes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>)
                  : nucleosAtivos.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.nome} · {estrutura.nomeRegiao(n.regiao_id)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={ocupado}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); confirmarTroca() }}
              disabled={ocupado || (!!troca && troca.papel !== 'admin' && !troca.destino)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarDesativar} onOpenChange={setConfirmarDesativar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar o acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa deixa de entrar no Guardião. O nome dela continua nos registros que fez, e dá para reativar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => atualizarPerfil({ status: 'desativado' }, 'Acesso desativado')}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/admin/usuarios" className="underline-offset-4 hover:underline">Voltar para a lista</Link>
      </p>
    </div>
  )
}
