'use client'
import Link from 'next/link'
import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, History, Pencil } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/comum/Avatar'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { Indicador } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ListaDados, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Secao, VoltarLink } from '@/components/comum/Secao'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { buscarTodos } from '@/lib/consultas'
import { baixarCSV } from '@/lib/csv'
import { agruparPorMes, calcularSaldos, ehSessaoHistorica } from '@/lib/estoque'
import { anoDe, formatarData, formatarDiaMes, formatarNumero, formatarRelativo, hojeISO, rotuloMes } from '@/lib/formato'
import { nomeMembro } from '@/lib/membros'
import { podeEditar } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { ConsumoSessao, Membro, MudancaGrau, Preparo, Saida, Sessao } from '@/lib/tipos'

type Papel = 'dirigente' | 'delegacao' | 'leitor' | 'explanador' | 'preparo'
type FiltroPapel = 'todas' | 'dirigente' | 'leitor' | 'explanador' | 'preparo'
type Periodo = 'ano' | 'anterior' | 'todos'

const ROTULO_PAPEL: Record<Papel, string> = {
  dirigente: 'Dirigiu',
  delegacao: 'Dirigiu · delegação',
  leitor: 'Leu documentos',
  explanador: 'Fez explanação',
  preparo: 'Mestre do preparo',
}

type Participacao = {
  chave: string
  papel: Papel
  sessaoId: number | null
  data: string
  titulo: string
  subtitulo: string
  href: string
}

type SessaoMembro = Pick<
  Sessao,
  'id' | 'data_realizacao' | 'tipo' | 'dirigente' | 'dirigente_id' | 'dirigente_2_id' | 'leitor_documentos_id' |
  'explanador_id' | 'leitor_documentos' | 'explanador' | 'quantidade_participantes' | 'tipo_delegacao'
>

type LeituraSessao = {
  id: number
  documento: string
  sessoes: { id: number; data_realizacao: string; tipo: string } | null
}

type Dados = {
  membro: Membro
  sessoes: SessaoMembro[]
  preparos: Preparo[]
  leituras: LeituraSessao[]
  graus: MudancaGrau[]
  usuario: { full_name: string | null; email: string | null } | null
  todas: Pick<Sessao, 'id' | 'data_realizacao' | 'quantidade_participantes'>[]
  consumos: ConsumoSessao[]
  saidas: Saida[]
}

export default function FichaMembro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idMembro = Number(id)
  const router = useRouter()
  const { profile } = useAuth()
  const editor = podeEditar(profile)

  const [dados, setDados] = useState<Dados | null>(null)
  const [agora] = useState(() => new Date())
  const [periodo, setPeriodo] = useState<Periodo>('ano')
  const [filtroPapel, setFiltroPapel] = useState<FiltroPapel>('todas')
  const [completo, setCompleto] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: membro, error } = await supabase.from('membros').select('*').eq('id', idMembro).single()
      if (!ativo) return
      if (error || !membro) {
        toast.error('Membro não encontrado')
        router.replace('/membros')
        return
      }

      const condutor = `dirigente_id.eq.${idMembro},dirigente_2_id.eq.${idMembro},leitor_documentos_id.eq.${idMembro},explanador_id.eq.${idMembro}`
      const [sessoes, preparos, leituras, graus, usuario, todas] = await Promise.all([
        supabase
          .from('sessoes')
          .select('id, data_realizacao, tipo, dirigente, dirigente_id, dirigente_2_id, leitor_documentos_id, explanador_id, leitor_documentos, explanador, quantidade_participantes, tipo_delegacao')
          .or(condutor),
        supabase.from('preparos').select('*').eq('mestre_preparo_id', idMembro),
        supabase.from('leituras').select('id, documento, sessoes ( id, data_realizacao, tipo )').eq('leitor_id', idMembro),
        supabase.from('membros_graus_historico').select('*').eq('membro_id', idMembro).order('data', { ascending: false }),
        supabase.from('profiles').select('full_name, email').eq('membro_id', idMembro).maybeSingle(),
        buscarTodos<Dados['todas'][number]>((de, ate) =>
          supabase.from('sessoes').select('id, data_realizacao, quantidade_participantes').order('id').range(de, ate)
        ).catch(() => []),
      ])

      const listaPreparos = (preparos.data ?? []) as Preparo[]
      const ids = listaPreparos.map(p => p.id)
      let consumos: ConsumoSessao[] = []
      let saidas: Saida[] = []
      if (ids.length > 0) {
        const [c, s] = await Promise.all([
          supabase.from('consumos_sessao').select('id, id_sessao, id_preparo, quantidade_consumida').in('id_preparo', ids),
          supabase.from('saidas').select('*').in('preparo_id', ids),
        ])
        consumos = (c.data ?? []) as ConsumoSessao[]
        saidas = (s.data ?? []) as Saida[]
      }
      if (!ativo) return

      setDados({
        membro: membro as Membro,
        sessoes: (sessoes.data ?? []) as SessaoMembro[],
        preparos: listaPreparos,
        leituras: (leituras.data ?? []) as unknown as LeituraSessao[],
        graus: (graus.data ?? []) as MudancaGrau[],
        usuario: usuario.error ? null : usuario.data,
        todas,
        consumos,
        saidas,
      })
    }
    carregar()
    return () => { ativo = false }
  }, [idMembro, router])

  const participacoes = useMemo(() => {
    if (!dados) return []
    const lista: Participacao[] = []

    for (const s of dados.sessoes) {
      const base = { sessaoId: s.id, data: s.data_realizacao, titulo: `${s.tipo} · ${formatarData(s.data_realizacao)}`, href: `/sessoes/${s.id}` }
      const historica = ehSessaoHistorica(s)
      const publico = historica ? 'Registro histórico' : `${s.quantidade_participantes} participantes`
      if (s.dirigente_id === idMembro) {
        lista.push({ ...base, chave: `d-${s.id}`, papel: 'dirigente', subtitulo: [publico, s.leitor_documentos && `Leitor: ${s.leitor_documentos}`].filter(Boolean).join(' · ') })
      }
      if (s.dirigente_2_id === idMembro) {
        lista.push({ ...base, chave: `d2-${s.id}`, papel: 'delegacao', subtitulo: s.tipo_delegacao || 'Delegação' })
      }
      if (s.leitor_documentos_id === idMembro) {
        lista.push({ ...base, chave: `l-${s.id}`, papel: 'leitor', subtitulo: `Dirigente: ${s.dirigente || '—'}` })
      }
      if (s.explanador_id === idMembro) {
        lista.push({ ...base, chave: `e-${s.id}`, papel: 'explanador', subtitulo: `Dirigente: ${s.dirigente || '—'}` })
      }
    }

    // Leituras registradas por documento que ainda não aparecem como "leitor" da sessão
    const leitorEm = new Set(lista.filter(p => p.papel === 'leitor').map(p => p.sessaoId))
    for (const l of dados.leituras) {
      if (!l.sessoes || leitorEm.has(l.sessoes.id)) continue
      leitorEm.add(l.sessoes.id)
      lista.push({
        chave: `lt-${l.id}`,
        papel: 'leitor',
        sessaoId: l.sessoes.id,
        data: l.sessoes.data_realizacao,
        titulo: `${l.sessoes.tipo} · ${formatarData(l.sessoes.data_realizacao)}`,
        subtitulo: l.documento,
        href: `/sessoes/${l.sessoes.id}`,
      })
    }

    for (const p of dados.preparos) {
      lista.push({
        chave: `p-${p.id}`,
        papel: 'preparo',
        sessaoId: null,
        data: p.data_preparo,
        titulo: `Preparo · ${formatarData(p.data_preparo)}`,
        subtitulo: [p.grau && `Grau ${p.grau}`, `${formatarNumero(p.quantidade_preparada)} L`].filter(Boolean).join(' · '),
        href: `/estoque/${p.id}`,
      })
    }

    return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [dados, idMembro])

  const anoAtual = agora.getFullYear()
  const noPeriodo = (data: string) =>
    periodo === 'todos' ? true : anoDe(data) === (periodo === 'ano' ? anoAtual : anoAtual - 1)

  const resumo = useMemo(() => {
    if (!dados) return null
    const doPeriodo = participacoes.filter(p => noPeriodo(p.data))
    const contar = (...papeis: Papel[]) => doPeriodo.filter(p => papeis.includes(p.papel)).length
    const preparosPeriodo = dados.preparos.filter(p => noPeriodo(p.data_preparo))
    const conduzidas = new Set(doPeriodo.filter(p => p.sessaoId !== null && p.papel !== 'preparo').map(p => p.sessaoId))
    const totalSessoes = dados.todas.filter(s => !ehSessaoHistorica(s) && noPeriodo(s.data_realizacao)).length

    // Gráfico: 12 meses do ano escolhido, ou últimos 12 meses em "todo o período"
    const meses = Array.from({ length: 12 }, (_, i) => {
      const d = periodo === 'todos'
        ? new Date(anoAtual, agora.getMonth() - 11 + i, 1)
        : new Date(periodo === 'ano' ? anoAtual : anoAtual - 1, i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    const grafico = meses.map(chave => {
      const doMes = participacoes.filter(p => p.data.slice(0, 7) === chave)
      const n = (...papeis: Papel[]) => doMes.filter(p => papeis.includes(p.papel)).length
      const [a, m] = chave.split('-').map(Number)
      return {
        mes: new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        Dirigiu: n('dirigente', 'delegacao'),
        Leitura: n('leitor'),
        Explanação: n('explanador'),
        Preparo: n('preparo'),
      }
    })

    return {
      dirigiu: contar('dirigente', 'delegacao'),
      leu: contar('leitor'),
      explanou: contar('explanador'),
      preparos: preparosPeriodo.length,
      litros: preparosPeriodo.reduce((a, p) => a + Number(p.quantidade_preparada), 0),
      presenca: totalSessoes ? Math.round((conduzidas.size / totalSessoes) * 100) : null,
      ultimaVez: participacoes.find(p => p.papel !== 'preparo')?.data ?? null,
      grafico,
      temGrafico: grafico.some(g => g.Dirigiu + g.Leitura + g.Explanação + g.Preparo > 0),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, participacoes, periodo, anoAtual, agora])

  if (!dados || !resumo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-4"><Skeleton className="size-16 rounded-full" /><Skeleton className="h-8 w-48" /></div>
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const { membro } = dados
  const lotes = calcularSaldos(dados.preparos, dados.consumos, dados.saidas, { hoje: hojeISO(agora) })
    .sort((a, b) => b.data_preparo.localeCompare(a.data_preparo))

  const historicoFiltrado = participacoes.filter(p =>
    filtroPapel === 'todas' ? true
      : filtroPapel === 'dirigente' ? p.papel === 'dirigente' || p.papel === 'delegacao'
        : p.papel === filtroPapel
  )
  const visiveis = completo ? historicoFiltrado : historicoFiltrado.slice(0, 20)

  const documentos = [...dados.leituras.reduce((mapa, l) => mapa.set(l.documento, (mapa.get(l.documento) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const exportar = () => {
    baixarCSV(`historico-${(membro.nome_exibicao || membro.nome).replace(/\s+/g, '-').toLowerCase()}`, [
      ['Data', 'Função', 'Registro', 'Detalhe'],
      ...participacoes.map(p => [formatarData(p.data), ROTULO_PAPEL[p.papel], p.titulo, p.subtitulo]),
    ])
  }

  const coresPapel: Record<Papel, string> = {
    dirigente: 'border-primary/40 text-primary',
    delegacao: 'border-primary/40 text-primary',
    leitor: '',
    explanador: '',
    preparo: 'border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-300',
  }

  return (
    <>
      <VoltarLink href="/membros" rotulo="Membros" />

      <div className="mb-5 flex items-center gap-4">
        <Avatar nome={membro.nome_exibicao || membro.nome} arquivo={membro.foto_arquivo} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{nomeMembro(membro)}</h1>
          {membro.nome_exibicao && membro.nome_exibicao !== membro.nome && (
            <p className="truncate text-sm text-muted-foreground">{membro.nome}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {membro.grau && <Badge variant="secondary">{membro.grau}</Badge>}
            <Badge variant="outline">{membro.tipo_vinculo}</Badge>
            <Badge variant={membro.ativo ? 'default' : 'outline'}>{membro.ativo ? 'Ativo' : 'Inativo'}</Badge>
          </div>
        </div>
        {editor && (
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href={`/membros/${membro.id}/editar`}><Pencil /> Editar</Link>
          </Button>
        )}
      </div>

      <ChipsFiltro
        rotulo="Período"
        valor={periodo}
        onChange={setPeriodo}
        opcoes={[
          { valor: 'ano', rotulo: String(anoAtual) },
          { valor: 'anterior', rotulo: String(anoAtual - 1) },
          { valor: 'todos', rotulo: 'Todo o período' },
        ]}
      />

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador rotulo="Dirigiu" valor={resumo.dirigiu} unidade={resumo.dirigiu === 1 ? 'sessão' : 'sessões'} />
        <Indicador rotulo="Leu documentos" valor={resumo.leu} unidade={resumo.leu === 1 ? 'sessão' : 'sessões'} />
        <Indicador rotulo="Fez explanação" valor={resumo.explanou} unidade={resumo.explanou === 1 ? 'sessão' : 'sessões'} />
        <Indicador rotulo="Mestre de preparo" valor={resumo.preparos} unidade={`· ${formatarNumero(resumo.litros)} L`} />
      </div>

      <p className="mt-3 px-1 text-xs text-muted-foreground">
        {resumo.presenca !== null && `Conduziu ${resumo.presenca}% das sessões do período`}
        {resumo.presenca !== null && resumo.ultimaVez && ' · '}
        {resumo.ultimaVez && `última participação ${formatarRelativo(resumo.ultimaVez, agora)}`}
      </p>

      {resumo.temGrafico && (
        <Card className="mt-4">
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Participações por mês</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumo.grafico} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Dirigiu" stackId="p" fill="var(--chart-1)" />
                  <Bar dataKey="Leitura" stackId="p" fill="var(--chart-3)" />
                  <Bar dataKey="Explanação" stackId="p" fill="var(--chart-2)" />
                  <Bar dataKey="Preparo" stackId="p" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Secao titulo="Histórico de participação" acao={`${participacoes.length} registros`}>
        <ChipsFiltro
          rotulo="Função"
          valor={filtroPapel}
          onChange={v => { setFiltroPapel(v); setCompleto(false) }}
          className="mb-3"
          opcoes={[
            { valor: 'todas', rotulo: 'Todas' },
            { valor: 'dirigente', rotulo: 'Dirigente' },
            { valor: 'leitor', rotulo: 'Leitor' },
            { valor: 'explanador', rotulo: 'Explanador' },
            { valor: 'preparo', rotulo: 'Preparo' },
          ]}
        />
        {historicoFiltrado.length === 0 ? (
          <Vazio icone={<History />}>Nenhuma participação registrada.</Vazio>
        ) : (
          <div className="space-y-5">
            {agruparPorMes(visiveis, p => p.data).map(grupo => (
              <section key={grupo.chave}>
                <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {rotuloMes(grupo.chave)}
                </h3>
                <ListaCard>
                  {grupo.itens.map(p => (
                    <ItemLista
                      key={p.chave}
                      href={p.href}
                      sobre={<Badge variant="outline" className={coresPapel[p.papel]}>{ROTULO_PAPEL[p.papel]}</Badge>}
                      titulo={p.titulo}
                      subtitulo={p.subtitulo}
                    />
                  ))}
                </ListaCard>
              </section>
            ))}
            {historicoFiltrado.length > visiveis.length && (
              <Button variant="outline" className="w-full" onClick={() => setCompleto(true)}>
                Ver histórico completo ({historicoFiltrado.length})
              </Button>
            )}
          </div>
        )}
      </Secao>

      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        {lotes.length > 0 && (
          <Secao titulo="Preparos conduzidos" acao={`Total ${formatarNumero(lotes.reduce((a, l) => a + Number(l.quantidade_preparada), 0))} L`}>
            <ListaCard>
              {lotes.map(l => (
                <ItemLista
                  key={l.id}
                  href={`/estoque/${l.id}`}
                  titulo={`${formatarData(l.data_preparo)}${l.grau ? ` · Grau ${l.grau}` : ''}`}
                  subtitulo={[l.procedencia_mariri, l.procedencia_chacrona].filter(Boolean).join(' · ') || undefined}
                  fim={
                    <ValorLinha
                      valor={`${formatarNumero(l.quantidade_preparada)} L`}
                      detalhe={l.saldo > 0 ? `saldo ${formatarNumero(l.saldo)} L` : 'esgotado'}
                    />
                  }
                />
              ))}
            </ListaCard>
          </Secao>
        )}

        {documentos.length > 0 && (
          <Secao titulo="Documentos que mais leu">
            <ListaCard>
              {documentos.map(([doc, n]) => (
                <ItemLista key={doc} titulo={doc} fim={<ValorLinha valor={`${n}×`} />} />
              ))}
            </ListaCard>
          </Secao>
        )}

        {(dados.graus.length > 0 || membro.data_ingresso) && (
          <Secao titulo="Trajetória">
            <ListaCard>
              {dados.graus.map(g => (
                <ItemLista
                  key={g.id}
                  titulo={g.grau_anterior ? `${g.grau_anterior} → ${g.grau_novo}` : g.grau_novo}
                  subtitulo={formatarData(g.data)}
                />
              ))}
              {membro.data_ingresso && <ItemLista titulo="Ingresso no núcleo" subtitulo={formatarData(membro.data_ingresso)} />}
            </ListaCard>
          </Secao>
        )}

        <Secao titulo="Dados cadastrais">
          <ListaDados
            itens={[
              { rotulo: 'Nome completo', valor: membro.nome },
              { rotulo: 'Nome de exibição', valor: membro.nome_exibicao || '—' },
              { rotulo: 'Grau', valor: membro.grau || '—' },
              { rotulo: 'Vínculo', valor: membro.tipo_vinculo },
              ...(membro.tipo_vinculo === 'Visitante' ? [{ rotulo: 'Núcleo de origem', valor: membro.nucleo_origem || '—' }] : []),
              { rotulo: 'Situação', valor: membro.ativo ? 'Ativo' : 'Inativo' },
              ...(membro.data_nascimento ? [{ rotulo: 'Aniversário', valor: formatarDiaMes(membro.data_nascimento) }] : []),
              { rotulo: 'Usuário do app', valor: dados.usuario?.email || dados.usuario?.full_name || '—' },
              { rotulo: 'Cadastrado em', valor: formatarData(membro.created_at) },
            ]}
          />
        </Secao>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:flex">
        {editor && (
          <Button variant="outline" asChild className="h-10">
            <Link href={`/membros/${membro.id}/editar`}><Pencil /> Editar membro</Link>
          </Button>
        )}
        <Button variant="outline" className={editor ? 'h-10' : 'col-span-2 h-10'} onClick={exportar} disabled={participacoes.length === 0}>
          <Download /> Exportar histórico
        </Button>
      </div>
    </>
  )
}
