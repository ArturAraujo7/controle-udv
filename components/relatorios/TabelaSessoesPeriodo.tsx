import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { RelatorioSessao } from '@/hooks/useDashboardDados'

interface TabelaSessoesPeriodoProps {
  sessoes: RelatorioSessao[]
  loading: boolean
  anoSelecionado: string
}

export function TabelaSessoesPeriodo({ sessoes, loading, anoSelecionado }: TabelaSessoesPeriodoProps) {
  const tableRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `Relatorio_Sessoes_${anoSelecionado}`,
  })

  // Todas as Sessões (Reais e Históricas)
  const sessoesFiltradas = sessoes
  // Ordenar crescente para o relatório
  const sessoesOrdenadas = [...sessoesFiltradas].sort((a, b) => new Date(a.data_realizacao).getTime() - new Date(b.data_realizacao).getTime())

  const fallback = (val: string | null) => (val && val.trim() !== '') ? val : '—'

  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'escala': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
      case 'escala anual': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
      case 'extra': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'
      case 'instrutiva': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
  }

  if (sessoesFiltradas.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma sessão registrada no período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden print:overflow-visible flex flex-col print:block print:border-none print:shadow-none">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 print:hidden">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Relatório de Sessões ({anoSelecionado})</h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Sessões Oficiais Realizadas</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Exportar Tabela PDF</span>
        </button>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div ref={tableRef} className="print:p-0 print:bg-white print:text-black w-full min-w-[800px] print:min-w-[auto]">
          {/* Header exclusivo de impressão */}
          <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Registro de Sessões</h1>
            <div className="flex justify-between text-sm mt-2 text-gray-600">
              <p>Centro Espírita Beneficente União do Vegetal - Núcleo Jardim Real</p>
              <p className="font-bold">Período: {anoSelecionado}</p>
            </div>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 print:bg-white print:text-black print:border-black">
              <tr>
                <th className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Data</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Tipo</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Dirigente</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Leitor(a) de Documentos</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider">Explanador(a)</th>
                <th className="py-3 px-4 font-bold uppercase text-[10px] tracking-wider text-center">Part.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 print:divide-gray-300">
              {sessoesOrdenadas.map((sessao) => (
                <tr key={sessao.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors print:hover:bg-transparent print:break-inside-avoid">
                  <td className="py-3 px-4 whitespace-nowrap tabular-nums">{new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getBadgeColor(sessao.tipo)} print:border-gray-400 print:text-black print:bg-transparent`}>
                      {sessao.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 print:text-black">{fallback(sessao.dirigente)}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 print:text-black">{fallback(sessao.leitor_documentos)}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 print:text-black">{fallback(sessao.explanador)}</td>
                  <td className="py-3 px-4 text-center tabular-nums text-gray-500 dark:text-gray-400 print:text-black font-semibold">{sessao.quantidade_participantes}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer exclusivo de impressão */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-[10px] text-gray-500 text-center">
            Página de {anoSelecionado} — Gerado em {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  )
}
