'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft, BarChart3, Printer, Droplets, Users, BookOpen, Layers } from 'lucide-react'

// Hooks
import { useDashboardDados } from '@/hooks/useDashboardDados'

// Componentes
import { ResumoCard } from '@/components/relatorios/ResumoCard'
import { TabelaSessoesPeriodo } from '@/components/relatorios/TabelaSessoesPeriodo'
import { ListaFuncaoLiturgica } from '@/components/relatorios/ListaFuncaoLiturgica'
import { GraficoSessoesPorMes, GraficoSessoesTipo } from '@/components/relatorios/Graficos'
import { TimelineMovimentacoes } from '@/components/relatorios/TimelineMovimentacoes'

export default function RelatoriosPage() {
  const router = useRouter()
  
  const currentYear = new Date().getFullYear().toString()
  const [anoSelecionado, setAnoSelecionado] = useState<string>(currentYear)
  
  // Hook Global
  const { sessoes, preparos, saidas, consumos, estoqueAtual, loading } = useDashboardDados(anoSelecionado)
  
  const componentRef = useRef<HTMLDivElement>(null)
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_Geral_UDV_${anoSelecionado}`,
  })

  // === CALCULOS DE RESUMO (Seções Superiores) ===
  const sessoesReais = sessoes.filter(s => s.quantidade_participantes > 0)
  const totalSessoes = sessoesReais.length
  
  // Totais
  const totalParticipantes = sessoesReais.reduce((acc, s) => acc + s.quantidade_participantes, 0)
  const totalConsumido = consumos.reduce((acc, c) => acc + c.quantidade_consumida, 0)
  const totalPreparado = preparos.reduce((acc, p) => acc + p.quantidade_preparada, 0)
  const totalSaidas = saidas.reduce((acc, s) => acc + s.quantidade, 0)
  
  // Médias
  const mediaPorSessao = totalSessoes > 0 ? totalConsumido / totalSessoes : 0
  const mediaParticipantesSessao = totalSessoes > 0 ? totalParticipantes / totalSessoes : 0
  const mediaPerCapita = totalParticipantes > 0 ? (totalConsumido * 1000) / totalParticipantes : 0

  const AnosParaFiltro = ['Todos', currentYear, (parseInt(currentYear) - 1).toString(), (parseInt(currentYear) - 2).toString()]

  // Condição para mostrar dados de vegetal (estoque, consumo, preparo)
  const mostrarDadosVegetal = anoSelecionado === 'Todos' || parseInt(anoSelecionado) >= 2026;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
      
      <header className="flex items-center gap-4 mb-8 pt-4 print:hidden">
        <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition outline-none">
            <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
                <BarChart3 className="w-6 h-6 text-celestial-600 dark:text-celestial-400" />
                DMC Dashboard
            </h1>
        </div>
      </header>

      {/* Controle Central de Filtro */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div className="flex w-full md:w-auto overflow-x-auto gap-2 no-scrollbar pb-1">
          {AnosParaFiltro.map(ano => (
            <button
              key={ano}
              onClick={() => setAnoSelecionado(ano)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border ${
                anoSelecionado === ano
                  ? 'bg-celestial-600 border-celestial-600 text-white shadow-celestial-600/20 shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {ano === 'Todos' ? 'Histórico Total' : `Ano ${ano}`}
            </button>
          ))}
        </div>
        
        <button
            onClick={handlePrint}
            className="w-full md:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider text-xs whitespace-nowrap shrink-0"
        >
            <Printer className="w-4 h-4" /> Exportar PDF Completo
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 15mm; }
        }
      `}} />
      <div ref={componentRef} className="print:p-0 print:bg-white print:text-black">
        {/* Print Header */}
        <div className="hidden print:flex flex-col items-center justify-center border-b print:border-gray-300 pb-5 mb-8 gap-3">
            <img src="/PDF/header.svg" alt="Cabeçalho Guardião" className="h-16 w-auto drop-shadow-sm" />
            <p className="text-[10px] font-medium uppercase tracking-widest print:text-gray-400">
              Período de Referência: <span className="font-bold print:text-gray-600">{anoSelecionado === 'Todos' ? 'Histórico Completo' : anoSelecionado}</span>
            </p>
        </div>

        <div className="space-y-6">
          {/* Seção 2: Resumo Rápido */}
          <div className={`grid grid-cols-2 ${mostrarDadosVegetal ? 'lg:grid-cols-5' : 'lg:grid-cols-2'} gap-3`}>
            {mostrarDadosVegetal && (
              <div className="col-span-2 lg:col-span-1 h-full">
                <ResumoCard 
                  titulo="Estoque Atual" 
                  valor={`${estoqueAtual.toFixed(2).replace('.', ',')} L`} 
                  subtitulo="Estoque real no momento" 
                  icone={<Droplets className="w-12 h-12 text-gold-500/20" />} 
                  destaque 
                />
              </div>
            )}
            
            <ResumoCard 
              titulo="Sessões" 
              valor={loading ? '--' : sessoes.length} 
              subtitulo={`Totais do Período`} 
              icone={<BookOpen className="w-12 h-12 text-gray-900 dark:text-gray-100 opacity-5" />} 
            />
            
            <ResumoCard 
              titulo={anoSelecionado === 'Todos' ? "Média de Participantes" : "Participantes"} 
              valor={loading ? '--' : (anoSelecionado === 'Todos' ? Math.round(mediaParticipantesSessao) : totalParticipantes)} 
              subtitulo={anoSelecionado === 'Todos' ? "Por sessão oficial" : "Público acumulado"} 
              icone={<Users className="w-12 h-12 text-gray-900 dark:text-gray-100 opacity-5" />} 
            />
            
            {mostrarDadosVegetal && (
              <>
                <ResumoCard 
                  titulo={anoSelecionado === 'Todos' ? "Média de Consumo" : "Total Consumido"} 
                  valor={loading ? '--' : (anoSelecionado === 'Todos' ? `${mediaPorSessao.toFixed(2).replace('.', ',')} L` : `${totalConsumido.toFixed(2).replace('.', ',')} L`)} 
                  subtitulo={anoSelecionado === 'Todos' ? "Volume médio por sessão" : `Média ${mediaPorSessao.toFixed(2).replace('.', ',')}L/Sessão`} 
                  icone={<Droplets className="w-12 h-12 text-gray-900 dark:text-gray-100 opacity-5" />} 
                />
                
                <ResumoCard 
                  titulo="Consumo Per Capita" 
                  valor={loading ? '--' : `${mediaPerCapita.toFixed(0)} ml`} 
                  subtitulo={`Média por participante`} 
                  icone={<Droplets className="w-12 h-12 text-gray-900 dark:text-gray-100 opacity-5" />} 
                />
              </>
            )}
          </div>

          <hr className="my-8 border-gray-200 dark:border-gray-800 print:hidden"/>

          {/* Seção 3: Sessões Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:flex print:justify-center print:break-inside-avoid">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm print:hidden">
              <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs mb-4 tracking-wider print:text-black">Sessões por Mês</h3>
              <GraficoSessoesPorMes sessoes={sessoes} loading={loading} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm print:border-gray-300 print:shadow-none print:break-inside-avoid print:w-[75%] print:text-center">
              <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs mb-4 tracking-wider print:text-black">Tipos de Sessão</h3>
              <GraficoSessoesTipo sessoes={sessoes} loading={loading} />
            </div>
          </div>

          {/* Seção 4: Relatório de Sessões (O Ouro do Dashboard) */}
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-celestial-600 to-celestial-400 print:hidden mt-8 mb-4">
            Relatório de Sessões & Escalas
          </h2>
          
          <div className="print:break-before-page">
            <TabelaSessoesPeriodo 
               sessoes={sessoes} 
               loading={loading} 
               anoSelecionado={anoSelecionado} 
            />
          </div>

          {/* Três Quadros Litúrgicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <ListaFuncaoLiturgica titulo="Dirigentes" sessoes={sessoes} funcaoKey="dirigente" loading={loading} />
            <ListaFuncaoLiturgica titulo="Leitores" sessoes={sessoes} funcaoKey="leitor_documentos" loading={loading}/>
            <ListaFuncaoLiturgica titulo="Explanadores" sessoes={sessoes} funcaoKey="explanador" loading={loading}/>
          </div>

          <hr className="my-8 border-gray-200 dark:border-gray-800 print:hidden"/>

          {mostrarDadosVegetal && (
            <>
              {/* Seção 6: Rastreabilidade / Movimentações */}
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400 print:text-black mt-8 mb-4 print:mt-6 print:mb-2">
                Extrato de Rastreabilidade
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
    </div>
  )
}

