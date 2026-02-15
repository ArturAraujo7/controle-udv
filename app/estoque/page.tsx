'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Beaker, Plus, AlertCircle, Truck, Droplet, Pencil, Search, Users } from 'lucide-react'

type PreparoComSaldo = {
  id: number
  tipo?: string
  data_preparo: string
  mestre_preparo: string
  nucleo_origem?: string
  quantidade_preparada: number
  grau: string
  status: string
  total_consumido: number
  saldo: number
  user_id?: string
}

export default function GerenciarEstoque() {
  const [preparos, setPreparos] = useState<PreparoComSaldo[]>([])
  const [saldoTotal, setSaldoTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchEstoque() {
      // 1. Busca TUDO: Preparos, Consumos e Saídas
      const { data: dadosPreparos } = await supabase.from('preparos').select('*').order('data_preparo', { ascending: false })

      // Agora buscamos da tabela nova de consumos
      const { data: dadosConsumos } = await supabase.from('consumos_sessao').select('id_preparo, quantidade_consumida')

      const { data: dadosSaidas } = await supabase.from('saidas').select('preparo_id, quantidade')

      let somaTotal = 0

      const listaFinal = dadosPreparos?.map((preparo: any) => {
        // Filtra consumos DESTE preparo
        const consumosDoPreparo = dadosConsumos?.filter(c => c.id_preparo === preparo.id) || []
        const totalSessoes = consumosDoPreparo.reduce((acc, curr) => acc + curr.quantidade_consumida, 0)

        // Filtra saídas/doações DESTE preparo
        const saidasExtras = dadosSaidas?.filter(s => s.preparo_id === preparo.id) || []
        const totalSaidas = saidasExtras.reduce((acc, curr) => acc + curr.quantidade, 0)

        // Total Consumido = Sessões + Saídas
        const totalConsumido = totalSessoes + totalSaidas

        const saldo = preparo.quantidade_preparada - totalConsumido
        if (saldo > 0) somaTotal += saldo

        return { ...preparo, total_consumido: totalConsumido, saldo: saldo }
      }) || []

      setSaldoTotal(somaTotal)
      setPreparos(listaFinal)
      setLoading(false)
    }
    fetchEstoque()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Estoque</h1>
        </div>
        <Link href="/novo-preparo" className="p-2 bg-green-600 rounded-full shadow-lg text-white hover:bg-green-700 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-10">Calculando...</p>
      ) : (
        <div className="space-y-6">

          {/* CARD DESTAQUE TOTAL */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Droplet className="w-32 h-32 text-green-600 dark:text-white" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Saldo Total Disponível</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">{saldoTotal.toFixed(1)}</span>
              <span className="text-xl text-gray-500 font-medium">Litros</span>
            </div>
          </div>

          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Lotes Individuais</h2>

          {/* BARRA DE PESQUISA */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              placeholder="Buscar por mestre, núcleo ou grau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* LISTA DE PREPAROS */}
          <div className="space-y-4">
            {preparos
              .filter(preparo => {
                const searchLower = searchTerm.toLowerCase()
                const mestre = preparo.mestre_preparo?.toLowerCase() || ''
                const nucleo = preparo.nucleo_origem?.toLowerCase() || ''
                const grau = preparo.grau?.toLowerCase() || ''
                return mestre.includes(searchLower) || nucleo.includes(searchLower) || grau.includes(searchLower)
              })
              .map(preparo => {
                const isDoacao = preparo.tipo === 'Doação'

                return (
                  <div key={preparo.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${isDoacao ? 'border-blue-200 dark:border-blue-900/50' : 'border-green-200 dark:border-green-900/30'} relative overflow-hidden group`}>

                    {/* Barra de Progresso */}
                    <div
                      className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${isDoacao ? 'bg-blue-500' : 'bg-green-500'}`}
                      style={{ width: `${(preparo.saldo / preparo.quantidade_preparada) * 100}%` }}
                    />

                    {/* Card clicável leva pro Detalhe */}
                    <Link href={`/estoque/${preparo.id}`} className="block p-4 pb-2">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {/* Badge de Tipo */}
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${isDoacao ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                            }`}>
                            {isDoacao ? <Truck className="w-3 h-3" /> : <Beaker className="w-3 h-3" />}
                            {isDoacao ? 'Doação Externa' : 'Produção Local'}
                          </div>

                          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                            {isDoacao ? preparo.nucleo_origem : `M. ${preparo.mestre_preparo}`}
                          </h3>

                          <div className="flex flex-col mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(preparo.data_preparo).toLocaleDateString('pt-BR')} • Grau {preparo.grau}
                            </span>
                            {isDoacao && (
                              <span className="text-xs text-blue-500/70 dark:text-blue-300/70 mt-0.5">
                                Resp: M. {preparo.mestre_preparo}
                              </span>
                            )}
                            {preparo.user_id && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1" title={`ID: ${preparo.user_id}`}>
                                <Users className="w-3 h-3" /> {preparo.user_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* LADO DIREITO: Saldo */}
                        <div className="text-right flex flex-col items-end gap-2">
                          {/* Botão Editar (Absolute pra não conflitar com o Link principal) */}
                          <object className="absolute top-4 right-2 z-10"> {/* Object/div trick to prevent nesting links */}
                            <Link href={`/editar-preparo/${preparo.id}`} className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-white transition-colors">
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </object>

                          <div className="mt-8"> {/* Espaço pra compensar o botão editar */}
                            <p className={`text-2xl font-bold ${isDoacao ? 'text-blue-600 dark:text-blue-100' : 'text-green-600 dark:text-green-50'}`}>
                              {preparo.saldo.toFixed(1)} <span className="text-sm font-normal text-gray-500">L</span>
                            </p>
                            <p className="text-xs text-gray-500">restantes</p>
                          </div>
                        </div>
                      </div>

                      {/* Detalhes de Consumo */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700/50">
                        <div>
                          Inicial: <strong className="text-gray-700 dark:text-gray-300">{preparo.quantidade_preparada} L</strong>
                        </div>
                        <div>
                          Consumido: <strong className="text-gray-700 dark:text-gray-300">{preparo.total_consumido.toFixed(1)} L</strong>
                        </div>
                      </div>
                    </Link> {/* Fim do Link principal */}

                    {/* Alertas */}

                    {preparo.saldo <= 0 && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-600 uppercase tracking-widest">Esgotado</span>

                        <Link href={`/editar-preparo/${preparo.id}`} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white z-30 pointer-events-auto">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <Link href={`/estoque/${preparo.id}`} className="absolute inset-0 z-20" /> {/* Link invisível pra funcionar o clique no card esgotado */}
                      </div>
                    )}

                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}