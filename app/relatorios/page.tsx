'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Calendar, BarChart3, Users, Droplet, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

type Sessao = {
    id: number
    data_realizacao: string
    quantidade_participantes: number
}

type Consumo = {
    quantidade_consumida: number
}

type Saida = {
    quantidade: number
    data_saida: string
}

export default function Relatorios() {
    type SessaoDetalhe = {
        id: number
        data_realizacao: string
        quantidade_participantes: number
        tipo: string
        dirigente: string
    }

    const [loading, setLoading] = useState(false)
    const [showSessoesDetails, setShowSessoesDetails] = useState(false)
    const componentRef = useRef<HTMLDivElement>(null)

    // Datas padrão: Início do ano até hoje
    const today = new Date().toISOString().split('T')[0]
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]

    const [dataInicio, setDataInicio] = useState(startOfYear)
    const [dataFim, setDataFim] = useState(today)

    const [metrics, setMetrics] = useState({
        totalSessoes: 0,
        totalParticipantes: 0,
        totalConsumido: 0,
        mediaPorSessao: 0,
        mediaPorParticipante: 0,
        totalSaidas: 0
    })

    const [metricDetails, setMetricDetails] = useState<{ sessoesLista: SessaoDetalhe[] }>({
        sessoesLista: []
    })

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Relatorio_UDV_${new Date().toISOString().split('T')[0]}`,
    })

    useEffect(() => {
        fetchData()
    }, [dataInicio, dataFim])

    const fetchData = async () => {
        setLoading(true)

        // 1. Buscar Sessões no período
        const { data: sessoesData } = await supabase
            .from('sessoes')
            .select('id, data_realizacao, quantidade_participantes, tipo, dirigente')
            .gte('data_realizacao', `${dataInicio}T00:00:00`)
            .lte('data_realizacao', `${dataFim}T23:59:59`)
            .order('data_realizacao', { ascending: false })

        const sessoes = sessoesData || []

        // 2. Buscar Consumos vinculados a essas sessões
        const sessionIds = sessoes.map(s => s.id)

        let totalConsumidoSessoes = 0

        if (sessionIds.length > 0) {
            const { data: consumosData } = await supabase
                .from('consumos_sessao')
                .select('quantidade_consumida')
                .in('id_sessao', sessionIds)

            totalConsumidoSessoes = consumosData?.reduce((acc, curr) => acc + curr.quantidade_consumida, 0) || 0
        }

        // 3. Buscar Saídas/Doações no período
        const { data: saidasData } = await supabase
            .from('saidas')
            .select('quantidade')
            .gte('data_saida', dataInicio)
            .lte('data_saida', dataFim)

        const totalSaidas = saidasData?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0

        // Cálculos
        const totalSessoes = sessoes.length
        const totalParticipantes = sessoes.reduce((acc, curr) => acc + (curr.quantidade_participantes || 0), 0)

        // CORREÇÃO: O usuário pediu para mostrar APENAS o consumo de sessões no total
        // const totalConsumidoGeral = totalConsumidoSessoes + totalSaidas 

        const mediaPorSessao = totalSessoes > 0 ? totalConsumidoSessoes / totalSessoes : 0
        const mediaPorParticipante = totalParticipantes > 0 ? totalConsumidoSessoes / totalParticipantes : 0

        setMetrics({
            totalSessoes,
            totalParticipantes,
            totalConsumido: totalConsumidoSessoes, // Alterado aqui
            mediaPorSessao,
            mediaPorParticipante,
            totalSaidas
        })

        setMetricDetails({
            sessoesLista: sessoes as SessaoDetalhe[]
        })

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
            <header className="flex items-center gap-4 mb-8 pt-4 print:hidden">
                <Link href="/" className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700 shadow-sm">
                    <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Relatórios
                    </h1>
                </div>
            </header>

            {/* Filtros e Ações (Oculto na impressão) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end print:hidden">
                <div className="w-full">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Início</label>
                    <input
                        type="date"
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500 dark:[color-scheme:dark]"
                    />
                </div>
                <div className="w-full">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">Fim</label>
                    <input
                        type="date"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500 dark:[color-scheme:dark]"
                    />
                </div>
                <button
                    onClick={fetchData}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Calendar className="w-4 h-4" /> Filtrar
                </button>
                <button
                    onClick={handlePrint}
                    className="w-full md:w-auto bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600"
                >
                    <Printer className="w-4 h-4" /> PDF
                </button>
            </div>

            {/* Área de Impressão */}
            <div ref={componentRef} className="print:p-8 print:bg-white print:text-black">

                {/* Cabeçalho apenas para impressão */}
                <div className="hidden print:flex flex-col mb-8 border-b-2 border-blue-600 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Relatório de Atividades</h1>
                            <p className="text-blue-600 font-semibold uppercase tracking-wider text-sm mt-1">Controle UDV - Núcleo Jardim Real</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold">Período Selecionado</p>
                            <p className="text-lg font-bold text-gray-900">{new Date(dataInicio).toLocaleDateString('pt-BR')} <span className="text-gray-400 mx-1">até</span> {new Date(dataFim).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500 animate-pulse">Calculando métricas...</div>
                ) : (
                    <div className="space-y-6">

                        {/* Linha Superior: Cards de Métricas Rápidas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                            {/* Card Total Consumido */}
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden print:bg-none print:bg-white print:border print:border-gray-300 print:text-black print:shadow-none print:break-inside-avoid">
                                <div className="absolute right-0 top-0 p-4 opacity-20 print:hidden"><Droplet className="w-24 h-24" /></div>
                                <p className="text-green-100 font-medium text-sm uppercase tracking-wider mb-1 print:text-gray-500">Total Consumido</p>
                                <h3 className="text-4xl font-bold">{metrics.totalConsumido.toFixed(1)} <span className="text-lg font-normal">L</span></h3>
                                <p className="text-green-100 text-xs mt-2 opacity-80 print:text-gray-400">Apenas consumo em sessões</p>
                            </div>

                            {/* Card Participantes */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden print:border-gray-300 print:shadow-none print:break-inside-avoid">
                                <div className="absolute right-0 top-0 p-4 opacity-5 print:hidden"><Users className="w-24 h-24" /></div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">Participantes</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white print:text-black">{metrics.totalParticipantes}</h3>
                                <p className="text-gray-400 text-xs mt-2">Total acumulado</p>
                            </div>
                        </div>

                        {/* Linha Exclusiva: Sessões Realizadas (Expansível) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden print:border-gray-300 print:shadow-none print:break-inside-avoid">
                            <div className="absolute right-0 top-0 p-4 opacity-5 print:hidden"><Calendar className="w-24 h-24" /></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">Sessões Realizadas</p>
                                    <h3 className="text-4xl font-bold text-gray-900 dark:text-white print:text-black">{metrics.totalSessoes}</h3>
                                    <p className="text-gray-400 text-xs mt-1">No período selecionado</p>
                                </div>

                                <button
                                    onClick={() => setShowSessoesDetails(!showSessoesDetails)}
                                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors focus:outline-none print:hidden flex items-center gap-1 self-start md:self-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg"
                                >
                                    {showSessoesDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                                </button>
                            </div>

                            {/* Detalhes Expansíveis */}
                            <div className={`${showSessoesDetails ? 'block' : 'hidden'} print:block mt-6 border-t border-gray-100 dark:border-gray-700/50 pt-6 animate-in fade-in slide-in-from-top-2 duration-200 print:border-gray-300 print:mt-2`}>
                                <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                                            <tr>
                                                <th className="pb-3 pt-2 pl-2">Data</th>
                                                <th className="pb-3 pt-2">Tipo</th>
                                                <th className="pb-3 pt-2">Dirigente</th>
                                                <th className="pb-3 pt-2 text-right pr-2">Part.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                            {metricDetails.sessoesLista.map((sessao) => (
                                                <tr key={sessao.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="py-3 pl-2 font-medium">{new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}</td>
                                                    <td className="py-3">{sessao.tipo || '-'}</td>
                                                    <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{sessao.dirigente || '-'}</td>
                                                    <td className="py-3 text-right pr-2">{sessao.quantidade_participantes}</td>
                                                </tr>
                                            ))}
                                            {metricDetails.sessoesLista.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-gray-400">Nenhuma sessão encontrada neste período.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Card Médias */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm print:border-gray-300 print:shadow-none print:break-inside-avoid">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2 print:text-black">
                                <BarChart3 className="w-5 h-5 text-blue-500 print:text-black" /> Médias e Estatísticas
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:grid-cols-3">
                                <div className="print:border-l-4 print:border-blue-500 print:pl-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Média p/ Sessão</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">{metrics.mediaPorSessao.toFixed(2)} L</p>
                                </div>
                                <div className="print:border-l-4 print:border-blue-500 print:pl-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Per Capita (aprox)</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">{(metrics.mediaPorParticipante * 1000).toFixed(0)} ml</p>
                                </div>
                                <div className="print:border-l-4 print:border-blue-500 print:pl-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Saídas Externas</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 print:text-black">{metrics.totalSaidas.toFixed(1)} L</p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
                {/* Rodapé APENAS impressão */}
                <div className="hidden print:flex justify-between items-center mt-12 pt-4 border-t border-gray-300 text-xs text-gray-500">
                    <p>Gerado automaticamente em {new Date().toLocaleString('pt-BR')}</p>
                    <p>Controle UDV</p>
                </div>
            </div>

            {/* Rodapé e info de versão (apenas tela) */}
        </div>
    )
}
