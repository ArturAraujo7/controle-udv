'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, SlidersHorizontal, UserRound, Users } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/comum/Avatar'
import { IconeLinha, ItemLista, ListaCard } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { Campo } from '@/components/formularios/Campos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SITUACOES, ehAdmin, rotuloPapel } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'

export default function Perfil() {
  const router = useRouter()
  const { session, profile, recarregarPerfil } = useAuth()
  const [nome, setNome] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  if (!profile) {
    return (
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  const valorNome = nome ?? profile.full_name ?? ''
  const semNome = !profile.full_name

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user.id) return
    if (!valorNome.trim()) {
      toast.error('Informe seu nome')
      return
    }
    setSalvando(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: valorNome.trim(), updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    setSalvando(false)

    if (error) {
      toast.error('Erro ao atualizar o perfil', { description: error.message })
      return
    }
    await recarregarPerfil()
    toast.success('Perfil atualizado')
    if (semNome) router.replace('/')
  }

  return (
    <div className="max-w-lg">
      <Cabecalho titulo="Meu perfil" />

      <Card>
        <CardContent>
          <form onSubmit={salvar} className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar nome={valorNome || profile.email} className="size-12 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{rotuloPapel(profile.role)}</Badge>
                  {profile.status && profile.status !== 'ativo' && <Badge variant="outline">{SITUACOES[profile.status]}</Badge>}
                </div>
              </div>
            </div>

            {semNome && (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                Antes de continuar, informe como você quer ser identificado no Guardião.
              </p>
            )}
            {profile.status === 'pendente' && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Seu acesso aguarda aprovação de um administrador. Enquanto isso, você pode visualizar os dados.
              </p>
            )}

            <Campo rotulo="Nome de exibição" htmlFor="nome" ajuda="Aparece no histórico dos registros que você fizer.">
              <Input id="nome" className="h-10" value={valorNome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" />
            </Campo>

            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="animate-spin" />}
              {salvando ? 'Salvando…' : 'Salvar perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {profile.membro_id && (
        <Secao titulo="Cadastro de membro">
          <ListaCard>
            <ItemLista href={`/membros/${profile.membro_id}`} inicio={<IconeLinha><UserRound /></IconeLinha>} titulo="Minha ficha de membro" subtitulo="Participações e trajetória" />
          </ListaCard>
        </Secao>
      )}

      {ehAdmin(profile) && (
        <Secao titulo="Administração">
          <ListaCard>
            <ItemLista href="/admin/configuracoes" inicio={<IconeLinha><SlidersHorizontal /></IconeLinha>} titulo="Configurações do núcleo" />
            <ItemLista href="/admin/usuarios" inicio={<IconeLinha><Users /></IconeLinha>} titulo="Usuários" />
            <ItemLista href="/admin/auditoria" inicio={<IconeLinha><ShieldCheck /></IconeLinha>} titulo="Auditoria" />
          </ListaCard>
        </Secao>
      )}
    </div>
  )
}
