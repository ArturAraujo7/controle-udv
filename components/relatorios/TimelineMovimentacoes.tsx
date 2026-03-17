import { useMemo, useState } from 'react'
import { RelatorioSessao, RelatorioPreparo, RelatorioSaida, RelatorioConsumo } from '@/hooks/useDashboardDados'
import { ArrowDownLeft, ArrowUpRight, History, Database, ArrowRight, ArrowLeft } from 'lucide-react'

// Representação unificada para a Timeline
type Movimentacao = {
  id: string
  data: string
  tipo: 'entrada' | 'saida' | 'consumo' | 'historico'
  etiqueta_tipo: string
  descricao_principal: string
  descricao_secundaria: string
  quantidade: number
  badgeColor: string
  Icon: React.ElementType
}

interface TimelineMovimentacoesProps {
  sessoes: RelatorioSessao[]
  preparos: RelatorioPreparo[]
  saidas: RelatorioSaida[]
  consumos: RelatorioConsumo[]
  loading: boolean
}

export function TimelineMovimentacoes({ sessoes, preparos, saidas, consumos, loading }: TimelineMovimentacoesProps) {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 20

  const movimentacoes = useMemo(() => {
    const arr: Movimentacao[] = []

    // 1. Preparos (Entradas)
    preparos.forEach(p => {
      arr.push({
        id: `p-${p.id}`,
        data: p.data_preparo, // A data do BD do preparo já vem como Date String (ou ISO sem T00)
        tipo: 'entrada',
        etiqueta_tipo: p.tipo_origem === 'doacao' ? 'Doação Recebida' : 'Preparo Local',
        descricao_principal: p.nucleo_origem ? `Origem: ${p.nucleo_origem}` : (p.mestre_preparo ? `Resp: ${p.mestre_preparo}` : 'Entrada Nova'),
        descricao_secundaria: `Lote #${p.id}`,
        quantidade: p.quantidade_preparada,
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        Icon: ArrowDownLeft
      })
    })

    // 2. Saídas (Doações Externas)
    saidas.forEach(s => {
      arr.push({
        id: `s-${s.id}`,
        data: s.data_saida,
        tipo: 'saida',
        etiqueta_tipo: 'Saída Autorizada',
        descricao_principal: `Destino: ${s.destino}`,
        descricao_secundaria: s.observacao ? `Obs: ${s.observacao}` : '',
        quantidade: s.quantidade,
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        Icon: ArrowUpRight
      })
    })

    // 3. Consumos atrelados a Sessões
    sessoes.forEach(sessao => {
      // Diferenciar sessões reais de memórias
      if (sessao.quantidade_participantes === 0) {
        // Registro Histórico -> Não conta litros consumidos na lógica
        arr.push({
          id: `h-${sessao.id}`,
          data: sessao.data_realizacao, // Timestamp de Sessão
          tipo: 'historico',
          etiqueta_tipo: 'Memória Institucional',
          descricao_principal: `${sessao.tipo}`,
          descricao_secundaria: `Dirigente: ${sessao.dirigente || '—'}`,
          quantidade: 0,
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          Icon: History
        })
      } else {
        // Sessão Real -> Buscar Consumo
        const cons = consumos.filter(c => c.id_sessao === sessao.id)
        const somaConsumo = cons.reduce((acc, c) => acc + c.quantidade_consumida, 0)
        
        arr.push({
          id: `c-${sessao.id}`,
          data: sessao.data_realizacao,
          tipo: 'consumo',
          etiqueta_tipo: `Sessão ${sessao.tipo}`,
          descricao_principal: `Dirigente: ${sessao.dirigente || '—'}`,
          descricao_secundaria: `${sessao.quantidade_participantes} pessoas`,
          quantidade: somaConsumo,
          badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
          Icon: Database
        })
      }
    })

    // Ordernar cronológico decrescente
    return arr.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  }, [preparos, saidas, sessoes, consumos])

  if (loading) return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>

  if (movimentacoes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
        <History className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma movimentação registrada no período.</p>
      </div>
    )
  }

  const totalPaginas = Math.ceil(movimentacoes.length / itensPorPagina)
  const itensPaginados = movimentacoes.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden flex flex-col h-full print:border-gray-300 print:shadow-none print:break-inside-avoid">
       <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-900 dark:text-white print:text-black">Rastreabilidade</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Timeline consolidada</p>
      </div>

      <div className="p-4 flex-1">
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
          {itensPaginados.map((item) => (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Icon Marker */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-celestial-500 text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 print:border-gray-300">
                <item.Icon className="w-5 h-5" />
              </div>
              
              {/* Card Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700/60 shadow-sm group-hover:border-celestial-300 dark:group-hover:border-celestial-700 transition-colors print:border-gray-300">
                
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${item.badgeColor} print:border-gray-400 print:text-black print:bg-transparent`}>
                      {item.etiqueta_tipo}
                    </span>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white print:text-black">{item.descricao_principal}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.descricao_secundaria}</p>
                  </div>
                  
                  {item.tipo !== 'historico' && (
                    <div className="text-right">
                      <span className={`text-lg font-black tracking-tight ${item.tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'} print:text-black`}>
                        {item.tipo === 'entrada' ? '+' : '-'}{item.quantidade.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs font-bold text-gray-400 ml-1">L</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center print:hidden">
            <button 
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Pág {paginaAtual} / {totalPaginas}
            </span>
            <button 
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
        </div>
      )}
    </div>
  )
}
