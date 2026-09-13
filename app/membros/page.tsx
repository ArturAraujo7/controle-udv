'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/comum/Avatar'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { SUBNAV_SESSOES, SubNav } from '@/components/layout/SubNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useLista } from '@/hooks/useListas'
import { buscarTodos } from '@/lib/consultas'
import { nomeMembro } from '@/lib/membros'
import { podeEditar } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { Membro, Sessao } from '@/lib/tipos'

type SessaoCondutores = Pick<Sessao, 'id' | 'data_realizacao' | 'dirigente_id' | 'dirigente_2_id' | 'leitor_documentos_id' | 'explanador_id'>
type Ordem = 'grau' | 'nome' | 'atuantes'

export default function Membros() {
  const { profile } = useAuth()
  const editor = podeEditar(profile)
  const graus = useLista('graus')

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [sessoes, setSessoes] = useState<SessaoCondutores[]>([])
  const [agora] = useState(() => new Date())
  const [filtro, setFiltro] = useState('todos')
  const [ordem, setOrdem] = useState<Ordem>('grau')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([
      buscarTodos<Membro>((de, ate) => supabase.from('membros').select('*').order('id').range(de, ate)),
      buscarTodos<SessaoCondutores>((de, ate) =>
        supabase
          .from('sessoes')
          .select('id, data_realizacao, dirigente_id, dirigente_2_id, leitor_documentos_id, explanador_id')
          .order('id')
          .range(de, ate)
      ),
    ])
      .then(([m, s]) => {
        if (!ativo) return
        setMembros(m)
        setSessoes(s)
        setCarregando(false)
      })
      .catch(e => {
        if (!ativo) return
        setErro(e instanceof Error ? e.message : 'Erro ao carregar')
        setCarregando(false)
      })
    return () => { ativo = false }
  }, [])

  const ano = String(agora.getFullYear())
  const atuacao = useMemo(() => {
    const dirigiu = new Map<number, number>()
    const total = new Map<number, number>()
    const somar = (mapa: Map<number, number>, id: number | null) => { if (id) mapa.set(id, (mapa.get(id) ?? 0) + 1) }
    for (const s of sessoes) {
      if (!s.data_realizacao.startsWith(ano)) continue
      somar(dirigiu, s.dirigente_id)
      somar(dirigiu, s.dirigente_2_id)
      for (const id of new Set([s.dirigente_id, s.dirigente_2_id, s.leitor_documentos_id, s.explanador_id])) somar(total, id)
    }
    return { dirigiu, total }
  }, [sessoes, ano])

  const ativos = membros.filter(m => m.ativo)
  const contagem = (fn: (m: Membro) => boolean) => membros.filter(fn).length

  const termo = busca.trim().toLowerCase()
  const filtrados = membros
    .filter(m =>
      filtro === 'inativos' ? !m.ativo
        : !m.ativo ? false
          : filtro === 'todos' ? true
            : filtro === 'visitantes' ? m.tipo_vinculo === 'Visitante'
              : m.grau === filtro
    )
    .filter(m => !termo || [m.nome, m.nome_exibicao, m.grau, m.nucleo_origem].some(v => v?.toLowerCase().includes(termo)))
    .sort((a, b) => {
      if (ordem === 'atuantes') {
        const diff = (atuacao.total.get(b.id) ?? 0) - (atuacao.total.get(a.id) ?? 0)
        if (diff) return diff
      }
      if (ordem === 'grau') {
        const peso = (m: Membro) => { const i = graus.indexOf(m.grau ?? ''); return i === -1 ? graus.length : i }
        const diff = peso(a) - peso(b)
        if (diff) return diff
      }
      return (a.nome_exibicao || a.nome).localeCompare(b.nome_exibicao || b.nome)
    })

  return (
    <>
      <Cabecalho
        titulo="Sessões"
        acoes={editor && (
          <Button asChild className="hidden md:inline-flex">
            <Link href="/membros/novo"><Plus /> Novo membro</Link>
          </Button>
        )}
      />
      <SubNav itens={SUBNAV_SESSOES} />

      {erro && <div className="mb-4"><Vazio>Não foi possível carregar os membros: {erro}</Vazio></div>}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pl-9"
          placeholder="Buscar membro…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          aria-label="Buscar membro"
        />
      </div>

      <ChipsFiltro
        rotulo="Filtrar membros"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { valor: 'todos', rotulo: 'Todos', contagem: ativos.length },
          ...graus.map(g => ({ valor: g, rotulo: g, contagem: contagem(m => m.ativo && m.grau === g) })),
          { valor: 'visitantes', rotulo: 'Visitantes', contagem: contagem(m => m.ativo && m.tipo_vinculo === 'Visitante') },
          { valor: 'inativos', rotulo: 'Inativos', contagem: contagem(m => !m.ativo) },
        ]}
      />

      <div className="mt-4 mb-2.5 flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">
          {carregando ? '…' : `${filtrados.length} ${filtrados.length === 1 ? 'membro' : 'membros'}`}
        </p>
        <Select value={ordem} onValueChange={v => setOrdem(v as Ordem)}>
          <SelectTrigger size="sm" className="min-w-40" aria-label="Ordenar"><SelectValue /></SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="grau">Ordenar por grau</SelectItem>
            <SelectItem value="nome">Ordenar por nome</SelectItem>
            <SelectItem value="atuantes">Mais atuantes no ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[60px] rounded-xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <Vazio
          icone={<Users />}
          acao={membros.length === 0 && editor && (
            <Button variant="outline" asChild><Link href="/membros/novo">Cadastrar primeiro membro</Link></Button>
          )}
        >
          {membros.length === 0 ? 'Nenhum membro cadastrado ainda.' : 'Nenhum membro neste filtro.'}
        </Vazio>
      ) : (
        <ListaCard>
          {filtrados.map(m => {
            const dirigiu = atuacao.dirigiu.get(m.id) ?? 0
            return (
              <ItemLista
                key={m.id}
                href={`/membros/${m.id}`}
                inicio={<Avatar nome={m.nome_exibicao || m.nome} arquivo={m.foto_arquivo} />}
                titulo={nomeMembro(m)}
                subtitulo={[
                  m.grau || 'Sem grau',
                  m.tipo_vinculo === 'Visitante' && `Visitante${m.nucleo_origem ? ` · ${m.nucleo_origem}` : ''}`,
                  !m.ativo && 'Inativo',
                ].filter(Boolean).join(' · ')}
                fim={dirigiu > 0 ? <ValorLinha valor={`${dirigiu}×`} detalhe="dirigiu no ano" /> : undefined}
              />
            )
          })}
        </ListaCard>
      )}

      {editor && (
        <Button variant="outline" asChild className="mt-4 h-11 w-full border-dashed text-primary md:hidden">
          <Link href="/membros/novo"><Plus /> Adicionar membro</Link>
        </Button>
      )}
    </>
  )
}
