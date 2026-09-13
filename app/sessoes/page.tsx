'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BookOpen, CalendarDays, Plus, Search } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { DataBloco } from '@/components/comum/DataBloco'
import { ResumoLinha } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { SUBNAV_SESSOES, SubNav } from '@/components/layout/SubNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { agruparPorMes, ehSessaoHistorica, totalPorSessao } from '@/lib/estoque'
import { anoDe, formatarData, formatarHora, formatarNumero, rotuloMes } from '@/lib/formato'
import { podeEditar } from '@/lib/permissoes'

type Categoria = 'todas' | 'realizadas' | 'historicas'

const PASSO = 40

export default function Sessoes() {
  const { profile } = useAuth()
  const editor = podeEditar(profile)
  const { carregando, erro, sessoes, consumos } = useDadosEstoque()
  const [agora] = useState(() => new Date())
  const [ano, setAno] = useState(String(agora.getFullYear()))
  const [tipo, setTipo] = useState('todos')
  const [categoria, setCategoria] = useState<Categoria>('todas')
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(PASSO)

  const porSessao = useMemo(() => totalPorSessao(consumos), [consumos])
  const ordenadas = useMemo(
    () => [...sessoes].sort((a, b) => b.data_realizacao.localeCompare(a.data_realizacao) || b.id - a.id),
    [sessoes]
  )

  const anos = [...new Set([agora.getFullYear(), ...ordenadas.map(s => anoDe(s.data_realizacao))])].sort((a, b) => b - a)
  const tipos = [...new Set(sessoes.map(s => s.tipo))].sort((a, b) => a.localeCompare(b))

  const doAno = ordenadas.filter(s => ano === 'todos' || anoDe(s.data_realizacao) === Number(ano))
  const realizadas = doAno.filter(s => !ehSessaoHistorica(s))
  const consumoTotal = realizadas.reduce((acc, s) => acc + (porSessao.get(s.id) ?? 0), 0)
  const participantesTotal = realizadas.reduce((acc, s) => acc + s.quantidade_participantes, 0)

  const termo = busca.trim().toLowerCase()
  const filtradas = doAno
    .filter(s => tipo === 'todos' || s.tipo === tipo)
    .filter(s => categoria === 'todas' || (categoria === 'historicas') === ehSessaoHistorica(s))
    .filter(s =>
      !termo ||
      [s.tipo, s.dirigente, s.leitor_documentos, s.explanador, formatarData(s.data_realizacao)]
        .some(v => v?.toLowerCase().includes(termo))
    )

  const grupos = agruparPorMes(filtradas.slice(0, limite), s => s.data_realizacao)
  const mudarFiltro = <T,>(setter: (v: T) => void) => (valor: T) => { setter(valor); setLimite(PASSO) }

  return (
    <>
      <Cabecalho
        titulo="Sessões"
        acoes={editor && (
          <div className="hidden gap-2 md:flex">
            <Button variant="outline" asChild>
              <Link href="/nova-sessao-historica"><BookOpen /> Registro histórico</Link>
            </Button>
            <Button asChild>
              <Link href="/nova-sessao"><Plus /> Nova sessão</Link>
            </Button>
          </div>
        )}
      />
      <SubNav itens={SUBNAV_SESSOES} />

      {erro && <div className="mb-4"><Vazio>Não foi possível carregar as sessões: {erro}</Vazio></div>}

      <ResumoLinha
        carregando={carregando}
        itens={[
          { rotulo: ano === 'todos' ? 'Sessões no total' : `Sessões em ${ano}`, valor: realizadas.length },
          { rotulo: 'Média de participantes', valor: realizadas.length ? Math.round(participantesTotal / realizadas.length) : 0 },
          { rotulo: 'Consumo médio', valor: `${formatarNumero(realizadas.length ? consumoTotal / realizadas.length : 0)} L` },
        ]}
      />

      <div className="relative mt-5 mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pl-9"
          placeholder="Buscar por dirigente, leitor, tipo ou data…"
          value={busca}
          onChange={e => mudarFiltro(setBusca)(e.target.value)}
          aria-label="Buscar sessão"
        />
      </div>

      <div className="space-y-3">
        <ChipsFiltro
          rotulo="Categoria"
          valor={categoria}
          onChange={mudarFiltro(setCategoria)}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas' },
            { valor: 'realizadas', rotulo: 'Realizadas' },
            { valor: 'historicas', rotulo: 'Registros históricos' },
          ]}
        />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select value={ano} onValueChange={mudarFiltro(setAno)}>
            <SelectTrigger className="w-full md:w-40" aria-label="Ano"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os anos</SelectItem>
              {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={mudarFiltro(setTipo)}>
            <SelectTrigger className="w-full md:w-52" aria-label="Tipo de sessão"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5">
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
          </div>
        ) : filtradas.length === 0 ? (
          <Vazio
            icone={<CalendarDays />}
            acao={sessoes.length === 0 && editor && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" asChild><Link href="/nova-sessao">Registrar primeira sessão</Link></Button>
                <Button variant="ghost" asChild><Link href="/nova-sessao-historica">Registro histórico</Link></Button>
              </div>
            )}
          >
            {sessoes.length === 0 ? 'Nenhuma sessão registrada ainda.' : 'Nenhuma sessão neste filtro.'}
          </Vazio>
        ) : (
          <div className="space-y-6">
            {grupos.map(grupo => (
              <section key={grupo.chave}>
                <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{rotuloMes(grupo.chave)}</h2>
                  <span className="text-xs text-muted-foreground">
                    {grupo.itens.length} {grupo.itens.length === 1 ? 'sessão' : 'sessões'}
                  </span>
                </div>
                <ListaCard>
                  {grupo.itens.map(s => {
                    const historica = ehSessaoHistorica(s)
                    return (
                      <ItemLista
                        key={s.id}
                        href={`/sessoes/${s.id}`}
                        inicio={<DataBloco iso={s.data_realizacao} />}
                        sobre={historica ? <Badge variant="outline">Histórica</Badge> : undefined}
                        titulo={s.tipo}
                        subtitulo={[s.dirigente, !historica && `${s.quantidade_participantes} participantes`].filter(Boolean).join(' · ') || '—'}
                        fim={
                          historica ? undefined : (
                            <ValorLinha valor={`${formatarNumero(porSessao.get(s.id) ?? 0)} L`} detalhe={formatarHora(s.data_realizacao)} />
                          )
                        }
                      />
                    )
                  })}
                </ListaCard>
              </section>
            ))}

            {filtradas.length > limite && (
              <Button variant="outline" className="w-full" onClick={() => setLimite(l => l + PASSO)}>
                Mostrar mais ({filtradas.length - limite} restantes)
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
