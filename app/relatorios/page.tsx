'use client'
import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer, Droplets, Users, BookOpen, X } from 'lucide-react'

// Hooks
import { useDashboardDados } from '@/hooks/useDashboardDados'

// Componentes
import { ResumoCard } from '@/components/relatorios/ResumoCard'
import { TabelaSessoesPeriodo } from '@/components/relatorios/TabelaSessoesPeriodo'
import { ListaFuncaoLiturgica } from '@/components/relatorios/ListaFuncaoLiturgica'
import { GraficoSessoesPorMes, GraficoSessoesTipo } from '@/components/relatorios/Graficos'
import { TimelineMovimentacoes } from '@/components/relatorios/TimelineMovimentacoes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { formatarNumero } from '@/lib/formato'

export default function RelatoriosPage() {
  const currentYear = new Date().getFullYear().toString()
  const [anoSelecionado, setAnoSelecionado] = useState<string>(currentYear)
  const [showAssistenteInput, setShowAssistenteInput] = useState(false)
  const [dataAssistente, setDataAssistente] = useState('')

  // Hook Global
  const { sessoes, preparos, saidas, consumos, estoqueAtual, loading } = useDashboardDados(anoSelecionado)

  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_Geral_UDV_${anoSelecionado.replace(':', '_')}`,
  })

  const getPeriodoLabel = () => {
    if (anoSelecionado === 'Todos') return 'Histórico total'
    if (anoSelecionado.startsWith('assistente:')) {
      const data = anoSelecionado.split(':')[1]
      const [ano, mes, dia] = data.split('-')
      return `A partir de ${dia}/${mes}/${ano}`
    }
    return `Ano ${anoSelecionado}`
  }
  const periodoLabel = getPeriodoLabel()

  // === CALCULOS DE RESUMO ===
  const sessoesReais = sessoes.filter(s => s.quantidade_participantes > 0)
  const totalSessoes = sessoesReais.length

  const totalParticipantes = sessoesReais.reduce((acc, s) => acc + s.quantidade_participantes, 0)
  const totalConsumido = consumos.reduce((acc, c) => acc + c.quantidade_consumida, 0)

  const mediaPorSessao = totalSessoes > 0 ? totalConsumido / totalSessoes : 0
  const mediaParticipantesSessao = totalSessoes > 0 ? totalParticipantes / totalSessoes : 0
  const mediaPerCapita = totalParticipantes > 0 ? (totalConsumido * 1000) / totalParticipantes : 0

  const anosParaFiltro = ['Todos', currentYear, (parseInt(currentYear) - 1).toString(), (parseInt(currentYear) - 2).toString()]

  // Condição para mostrar dados de vegetal (estoque, consumo, preparo)
  const mostrarDadosVegetal = anoSelecionado === 'Todos' || anoSelecionado.startsWith('assistente:') || parseInt(anoSelecionado) >= 2026

  const usandoFiltroAssistente = anoSelecionado.startsWith('assistente:')

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <Button variant="outline" onClick={handlePrint}>
          <Printer data-slot="icon" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </Button>
      </div>

      <Card className="mb-6 print:hidden">
        <CardContent className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="overflow-x-auto">
            <Tabs
              value={usandoFiltroAssistente ? '' : anoSelecionado}
              onValueChange={ano => {
                setAnoSelecionado(ano)
                setShowAssistenteInput(false)
              }}
            >
              <TabsList>
                {anosParaFiltro.map(ano => (
                  <TabsTrigger key={ano} value={ano}>
                    {ano === 'Todos' ? 'Histórico total' : ano}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            {!(showAssistenteInput || usandoFiltroAssistente) ? (
              <Button variant="ghost" size="sm" onClick={() => setShowAssistenteInput(true)}>
                Relatório do assistente
              </Button>
            ) : (
              <>
                <Input
                  type="date"
                  className="w-auto"
                  aria-label="Data inicial do relatório do assistente"
                  value={dataAssistente}
                  onChange={(e) => setDataAssistente(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!dataAssistente}
                  onClick={() => setAnoSelecionado(`assistente:${dataAssistente}`)}
                >
                  Gerar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cancelar filtro por data"
                  onClick={() => {
                    setShowAssistenteInput(false)
                    if (usandoFiltroAssistente) setAnoSelecionado(currentYear)
                    setDataAssistente('')
                  }}
                >
                  <X />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{
        __html: `@media print { @page { margin: 15mm; } }`
      }} />

      <div ref={componentRef} className="print:p-0 print:bg-white print:text-black">
        <div className="hidden print:flex flex-col items-center justify-center border-b print:border-gray-300 pb-5 mb-8 gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/PDF/header.svg" alt="Guardião" className="h-16 w-auto" />
          <p className="text-[10px] uppercase tracking-widest">
            Período de referência: <span className="font-bold">{periodoLabel}</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* Resumo */}
          <div className={`grid grid-cols-2 ${mostrarDadosVegetal ? 'lg:grid-cols-5' : 'lg:grid-cols-2'} gap-3`}>
            {mostrarDadosVegetal && (
              <div className="col-span-2 lg:col-span-1 h-full">
                <ResumoCard
                  titulo="Estoque atual"
                  valor={loading ? '—' : `${formatarNumero(estoqueAtual)} L`}
                  subtitulo="Saldo real no momento"
                  icone={<Droplets className="w-3.5 h-3.5" />}
                  destaque
                />
              </div>
            )}

            <ResumoCard
              titulo="Sessões"
              valor={loading ? '—' : sessoes.length}
              subtitulo="Total no período"
              icone={<BookOpen className="w-3.5 h-3.5" />}
            />

            <ResumoCard
              titulo={anoSelecionado === 'Todos' ? 'Média de participantes' : 'Participantes'}
              valor={loading ? '—' : (anoSelecionado === 'Todos' ? Math.round(mediaParticipantesSessao) : totalParticipantes)}
              subtitulo={anoSelecionado === 'Todos' ? 'Por sessão oficial' : 'Público acumulado'}
              icone={<Users className="w-3.5 h-3.5" />}
            />

            {mostrarDadosVegetal && (
              <>
                <ResumoCard
                  titulo={anoSelecionado === 'Todos' ? 'Média de consumo' : 'Total consumido'}
                  valor={loading ? '—' : `${formatarNumero(anoSelecionado === 'Todos' ? mediaPorSessao : totalConsumido)} L`}
                  subtitulo={anoSelecionado === 'Todos'
                    ? 'Volume médio por sessão'
                    : `Média de ${formatarNumero(mediaPorSessao)} L por sessão`}
                  icone={<Droplets className="w-3.5 h-3.5" />}
                />

                <ResumoCard
                  titulo="Consumo per capita"
                  valor={loading ? '—' : `${mediaPerCapita.toFixed(0)} ml`}
                  subtitulo="Média por participante"
                  icone={<Droplets className="w-3.5 h-3.5" />}
                />
              </>
            )}
          </div>

          <Separator className="print:hidden" />

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:flex print:justify-center print:break-inside-avoid">
            <Card className="print:hidden">
              <CardContent>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Sessões por mês</h3>
                <GraficoSessoesPorMes sessoes={sessoes} loading={loading} />
              </CardContent>
            </Card>
            <Card className="print:shadow-none print:break-inside-avoid print:w-[75%]">
              <CardContent>
                <h3 className="text-sm font-medium text-muted-foreground mb-4 print:text-black">Tipos de sessão</h3>
                <GraficoSessoesTipo sessoes={sessoes} loading={loading} />
              </CardContent>
            </Card>
          </div>

          <h2 className="text-lg font-semibold tracking-tight print:hidden mt-8">
            Sessões e escalas
          </h2>

          <div className="print:break-before-page">
            <TabelaSessoesPeriodo
              sessoes={sessoes}
              loading={loading}
              anoSelecionado={periodoLabel}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ListaFuncaoLiturgica titulo="Dirigentes" sessoes={sessoes} funcaoKey="dirigente" loading={loading} />
            <ListaFuncaoLiturgica titulo="Leitores" sessoes={sessoes} funcaoKey="leitor_documentos" loading={loading} />
            <ListaFuncaoLiturgica titulo="Explanadores" sessoes={sessoes} funcaoKey="explanador" loading={loading} />
          </div>

          {mostrarDadosVegetal && (
            <>
              <Separator className="print:hidden" />
              <h2 className="text-lg font-semibold tracking-tight mt-8 print:text-black">
                Extrato de rastreabilidade
              </h2>

              <TimelineMovimentacoes
                sessoes={sessoes}
                preparos={preparos}
                saidas={saidas}
                consumos={consumos}
                loading={loading}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}
