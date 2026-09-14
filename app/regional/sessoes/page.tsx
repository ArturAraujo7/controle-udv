'use client'
import { useMemo, useState } from 'react'
import { CalendarDays, Search } from 'lucide-react'

import { DataBloco } from '@/components/comum/DataBloco'
import { ResumoLinha } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { BadgeNucleo, CarregandoRegional } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { GraficoBarrasNucleos, mesesDoPeriodo } from '@/components/regional/Graficos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { agruparPorMes, ehSessaoHistorica, totalPorSessao } from '@/lib/estoque'
import { anoDe, formatarData, formatarNumero, rotuloMes } from '@/lib/formato'

const PASSO = 40

export default function SessoesRegionais() {
  const { dados, agora, nomeNucleo } = useRegional()
  const [ano, setAno] = useState(String(agora.getFullYear()))
  const [nucleo, setNucleo] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(PASSO)

  const base = useMemo(() => {
    if (!dados) return null
    return {
      porSessao: totalPorSessao(dados.consumos),
      ordenadas: [...dados.sessoes].sort((a, b) => b.data_realizacao.localeCompare(a.data_realizacao) || b.id - a.id),
    }
  }, [dados])

  if (!dados || !base) return <><Cabecalho titulo="Sessões" /><CarregandoRegional /></>

  const { porSessao, ordenadas } = base
  const anos = [...new Set([agora.getFullYear(), ...ordenadas.map(s => anoDe(s.data_realizacao))])].sort((a, b) => b - a)
  const tipos = [...new Set(dados.sessoes.map(s => s.tipo))].sort((a, b) => a.localeCompare(b))

  const doAno = ordenadas.filter(s => ano === 'todos' || anoDe(s.data_realizacao) === Number(ano))
  const realizadas = doAno.filter(s => !ehSessaoHistorica(s))
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  const nucleosAtivos = dados.nucleos.filter(n => n.ativo)
  const comSessaoNoMes = new Set(dados.sessoes.filter(s => !ehSessaoHistorica(s) && s.data_realizacao.startsWith(mesAtual)).map(s => s.nucleo_id))

  const termo = busca.trim().toLowerCase()
  const filtradas = doAno
    .filter(s => nucleo === 'todos' || String(s.nucleo_id) === nucleo)
    .filter(s => tipo === 'todos' || s.tipo === tipo)
    .filter(s => !termo || [s.tipo, s.dirigente, s.leitor_documentos, s.explanador, formatarData(s.data_realizacao)].some(v => v?.toLowerCase().includes(termo)))

  const meses = mesesDoPeriodo(agora, ano === 'todos' ? undefined : Number(ano))
  const series = nucleosAtivos
    .filter(n => nucleo === 'todos' || String(n.id) === nucleo)
    .map(n => ({
      nome: n.nome,
      indice: dados.nucleos.findIndex(x => x.id === n.id),
      valores: meses.map(chave => dados.sessoes.filter(s => s.nucleo_id === n.id && !ehSessaoHistorica(s) && s.data_realizacao.startsWith(chave)).length),
    }))

  const mudar = <T,>(setter: (v: T) => void) => (valor: T) => { setter(valor); setLimite(PASSO) }

  return (
    <>
      <Cabecalho titulo="Sessões" />
      <FaixaRegional />

      <ResumoLinha
        itens={[
          { rotulo: ano === 'todos' ? 'Sessões no total' : `Sessões em ${ano}`, valor: realizadas.length },
          { rotulo: 'Média de participantes', valor: realizadas.length ? Math.round(realizadas.reduce((a, s) => a + s.quantidade_participantes, 0) / realizadas.length) : 0 },
          { rotulo: 'Núcleos com sessão no mês', valor: `${comSessaoNoMes.size}/${nucleosAtivos.length}` },
        ]}
      />

      <div className="relative mt-5 mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 pl-9" placeholder="Buscar por dirigente, leitor, tipo ou data…" value={busca} onChange={e => mudar(setBusca)(e.target.value)} aria-label="Buscar sessão" />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <Select value={ano} onValueChange={mudar(setAno)}>
          <SelectTrigger className="h-10 w-full" aria-label="Ano"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={nucleo} onValueChange={mudar(setNucleo)}>
          <SelectTrigger className="h-10 w-full" aria-label="Núcleo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os núcleos</SelectItem>
            {dados.nucleos.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={mudar(setTipo)}>
          <SelectTrigger className="col-span-2 h-10 w-full md:col-span-1" aria-label="Tipo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {series.some(s => s.valores.some(v => v > 0)) && (
        <Card className="mt-4">
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Sessões por núcleo, mês a mês</p>
            <GraficoBarrasNucleos meses={meses} series={series} formatarValor={v => `${v} ${v === 1 ? 'sessão' : 'sessões'}`} />
          </CardContent>
        </Card>
      )}

      <div className="mt-5">
        {filtradas.length === 0 ? (
          <Vazio icone={<CalendarDays />}>Nenhuma sessão neste filtro.</Vazio>
        ) : (
          <div className="space-y-6">
            {agruparPorMes(filtradas.slice(0, limite), s => s.data_realizacao).map(grupo => (
              <section key={grupo.chave}>
                <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{rotuloMes(grupo.chave)}</h2>
                  <span className="text-xs text-muted-foreground">{grupo.itens.length} {grupo.itens.length === 1 ? 'sessão' : 'sessões'}</span>
                </div>
                <ListaCard>
                  {grupo.itens.map(s => {
                    const historica = ehSessaoHistorica(s)
                    return (
                      <ItemLista
                        key={s.id}
                        href={`/regional/sessoes/${s.id}`}
                        inicio={<DataBloco iso={s.data_realizacao} />}
                        sobre={
                          <>
                            <BadgeNucleo nome={nomeNucleo(s.nucleo_id)} />
                            {historica && <Badge variant="outline">Histórica</Badge>}
                          </>
                        }
                        titulo={s.tipo}
                        subtitulo={[s.dirigente, !historica && `${s.quantidade_participantes} participantes`].filter(Boolean).join(' · ') || '—'}
                        fim={historica ? undefined : <ValorLinha valor={`${formatarNumero(porSessao.get(s.id) ?? 0)} L`} />}
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
