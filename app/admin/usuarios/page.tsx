'use client'
import { useEffect, useState } from 'react'
import { Check, Copy, Search, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { BadgeUsuario } from '@/components/admin/Badges'
import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/comum/Avatar'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { ResumoLinha } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ListaDados, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useUsuarios } from '@/hooks/useUsuarios'
import { nomeMembro } from '@/lib/membros'
import { PAPEIS, SITUACOES } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { Membro } from '@/lib/tipos'

export default function PaginaUsuarios() {
  return (
    <ExigirAdmin>
      <Usuarios />
    </ExigirAdmin>
  )
}

function Usuarios() {
  const { profile } = useAuth()
  const { carregando, usuarios, completo, erro } = useUsuarios()
  const [membros, setMembros] = useState<Map<number, Membro>>(new Map())
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [convite, setConvite] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase.from('membros').select('*').then(({ data }) => {
      if (ativo) setMembros(new Map(((data ?? []) as Membro[]).map(m => [m.id, m])))
    })
    return () => { ativo = false }
  }, [])

  const pendentes = usuarios.filter(u => u.status === 'pendente')
  const semVinculo = usuarios.filter(u => u.status !== 'desativado' && !u.membro_id)
  const termo = busca.trim().toLowerCase()

  const filtrados = usuarios
    .filter(u =>
      filtro === 'todos' ? u.status !== 'desativado'
        : filtro === 'pendentes' ? u.status === 'pendente'
          : filtro === 'desativados' ? u.status === 'desativado'
            : u.role === filtro && u.status !== 'desativado'
    )
    .filter(u => !termo || [u.full_name, u.email].some(v => v?.toLowerCase().includes(termo)))

  const linkConvite = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'
  const copiarConvite = async () => {
    await navigator.clipboard.writeText(linkConvite)
    setCopiado(true)
    toast.success('Link copiado')
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <Cabecalho
        titulo="Usuários"
        descricao="O papel define quem pode registrar e editar dados."
        acoes={<Button variant="outline" onClick={() => setConvite(true)}><UserPlus /> Convidar</Button>}
      />

      {erro && <div className="mb-4"><Vazio>Não foi possível carregar os usuários: {erro}</Vazio></div>}
      {!carregando && !completo && (
        <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
          Situação, último acesso e vínculo com membros aparecem depois que as migrations de 13/09/2026 forem aplicadas.
        </p>
      )}

      <ResumoLinha
        carregando={carregando}
        itens={[
          { rotulo: 'Usuários', valor: usuarios.filter(u => u.status !== 'desativado').length },
          { rotulo: 'Pendentes', valor: pendentes.length, className: pendentes.length ? 'text-amber-600 dark:text-amber-400' : undefined },
          { rotulo: 'Sem vínculo', valor: semVinculo.length },
        ]}
      />

      {pendentes.length > 0 && (
        <button
          type="button"
          onClick={() => setFiltro('pendentes')}
          className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <span className="font-medium">
            {pendentes.length} {pendentes.length === 1 ? 'pessoa aguarda' : 'pessoas aguardam'} aprovação de acesso
          </span>
          <span className="font-semibold">Revisar ›</span>
        </button>
      )}

      <div className="relative mt-5 mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 pl-9" placeholder="Buscar por nome ou e-mail…" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar usuário" />
      </div>

      <ChipsFiltro
        rotulo="Filtrar usuários"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { valor: 'todos', rotulo: 'Todos' },
          ...PAPEIS.map(p => ({ valor: p.valor, rotulo: p.valor === 'admin' ? 'Admin' : p.rotulo.replace('Mestre ', '') })),
          { valor: 'pendentes', rotulo: 'Pendentes', contagem: pendentes.length },
          { valor: 'desativados', rotulo: 'Desativados' },
        ]}
      />

      <div className="mt-4">
        {carregando ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filtrados.length === 0 ? (
          <Vazio icone={<Users />}>Nenhum usuário neste filtro.</Vazio>
        ) : (
          <ListaCard>
            {filtrados.map(u => {
              const membro = u.membro_id ? membros.get(u.membro_id) : undefined
              return (
                <ItemLista
                  key={u.id}
                  href={`/admin/usuarios/${u.id}`}
                  inicio={<Avatar nome={u.full_name || u.email} arquivo={membro?.foto_arquivo} />}
                  titulo={<>{u.full_name || 'Sem nome'}{u.id === profile?.id && <span className="font-normal text-muted-foreground"> · você</span>}</>}
                  subtitulo={[u.email, membro && `membro: ${nomeMembro(membro)}`].filter(Boolean).join(' · ')}
                  fim={<BadgeUsuario usuario={u} />}
                />
              )
            })}
          </ListaCard>
        )}
      </div>

      <Secao titulo="O que cada papel pode fazer">
        <ListaDados itens={PAPEIS.map(p => ({ rotulo: p.rotulo, valor: <span className="font-normal">{p.descricao}</span> }))} />
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Situações: {Object.values(SITUACOES).join(', ')}. Usuários desativados não entram no app, mas o nome continua nos registros que fizeram.
        </p>
      </Secao>

      <Dialog open={convite} onOpenChange={setConvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar para o Guardião</DialogTitle>
            <DialogDescription>
              Envie o link abaixo. A pessoa cria a conta e aparece aqui como pendente, com papel de Mestre (só leitura),
              até você revisar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={linkConvite} className="h-10" aria-label="Link de acesso" />
            <Button onClick={copiarConvite} variant="outline" className="h-10">
              {copiado ? <Check /> : <Copy />} Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
