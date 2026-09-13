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
import { useUsuarios } from '@/hooks/useUsuarios'
import { formatarDataHora, formatarRelativo } from '@/lib/formato'
import { nomeMembro } from '@/lib/membros'
import { PAPEIS, rotuloPapel } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { Membro, Papel, SituacaoUsuario } from '@/lib/tipos'

const SEM_MEMBRO = 'nenhum'

type Atividade = { id: number; mensagem_automatica: string | null; created_at: string }

export default function PaginaUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <ExigirAdmin>
      <DetalheUsuario id={id} />
    </ExigirAdmin>
  )
}

function DetalheUsuario({ id }: { id: string }) {
  const { profile } = useAuth()
  const { carregando, usuarios, completo, recarregar } = useUsuarios()
  const [membros, setMembros] = useState<Membro[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [confirmarAdmin, setConfirmarAdmin] = useState(false)
  const [confirmarDesativar, setConfirmarDesativar] = useState(false)

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

  const atualizarPerfil = async (dados: Partial<{ role: Papel; status: SituacaoUsuario; membro_id: number | null }>, sucesso: string) => {
    setOcupado(true)
    const { error } = await supabase.from('profiles').update(dados).eq('id', id)
    setOcupado(false)
    if (error) {
      toast.error('Não foi possível atualizar', { description: error.message })
      return
    }
    toast.success(sucesso)
    await recarregar()
  }

  const mudarPapel = (papel: Papel) => {
    if (papel === usuario?.role) return
    if (papel === 'admin') {
      setConfirmarAdmin(true)
      return
    }
    atualizarPerfil({ role: papel }, `Papel alterado para ${rotuloPapel(papel)}`)
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

  const membro = usuario.membro_id ? membros.find(m => m.id === usuario.membro_id) : undefined

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
              Esta pessoa criou uma conta e aguarda aprovação. Enquanto isso, só visualiza os dados.
            </p>
            <div className="flex gap-2">
              <Button disabled={ocupado} onClick={() => atualizarPerfil({ status: 'ativo' }, 'Acesso aprovado')}>Aprovar acesso</Button>
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
          {ehVoce ? 'Você não pode mudar o próprio papel.' : 'Promover a Administrador pede confirmação.'}
        </p>
      </Secao>

      {completo && (
        <Secao titulo="Membro vinculado" acao={membro && <LinkSecao href={`/membros/${membro.id}`}>Ver ficha</LinkSecao>}>
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

      <AlertDialog open={confirmarAdmin} onOpenChange={setConfirmarAdmin}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tornar {usuario.full_name || usuario.email} administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Administradores podem mudar papéis de outros usuários, editar configurações e ver toda a auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => atualizarPerfil({ role: 'admin' }, 'Papel alterado para Administrador')}>
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
