'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Users, Droplet, Search, X, Calendar, User, BookOpen, Mic, RefreshCw } from 'lucide-react'

type Sessao = {
  id: number
  data_realizacao: string
  tipo: string
  dirigente: string
  quantidade_participantes: number
  quantidade_consumida: number
  user_id?: string
  explanador?: string
  leitor_documentos?: string
  user_name?: string
}

type ConsumoDetalhado = {
  id: number
  quantidade_consumida: number
  preparos: {
    data_preparo: string
    mestre_preparo: string
    grau: string
  }
}

export default function HistoricoSessoes() {
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Estado para o Modal
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sessionConsumos, setSessionConsumos] = useState<ConsumoDetalhado[]>([])

  useEffect(() => {
    async function fetchSessoes() {
      // 1. Busca as sessões
      const { data: dadosSessoes } = await supabase.from('sessoes').select('*').order('data_realizacao', { ascending: false })

      // 2. Busca os consumos (apenas totais para a lista)
      const { data: dadosConsumos } = await supabase.from('consumos_sessao').select('id_sessao, quantidade_consumida')

      // 3. Busca perfis de usuários
      const userIds = Array.from(new Set(dadosSessoes?.map((s: any) => s.user_id).filter(Boolean))) || []
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)

      // 4. Calcula o total por sessão e adiciona nome do usuário
      const sessoesComConsumo = dadosSessoes?.map((sessao: any) => {
        const consumosDaSessao = dadosConsumos?.filter(c => c.id_sessao === sessao.id) || []
        const totalConsumido = consumosDaSessao.reduce((acc: number, curr: any) => acc + (curr.quantidade_consumida || 0), 0)
        const profile = profiles?.find((p: any) => p.id === sessao.user_id)

        return {
          ...sessao,
          quantidade_consumida: totalConsumido,
          user_name: profile?.full_name
        }
      }) || []

      setSessoes(sessoesComConsumo)
      setLoading(false)
    }
    fetchSessoes()
  }, [])

  const handleOpenModal = async (sessao: Sessao) => {
    setSelectedSession(sessao)
    setLoadingDetails(true)
    setSessionConsumos([])

    // Busca os detalhes do consumo incluindo info do preparo
    const { data, error } = await supabase
      .from('consumos_sessao')
      .select(`
        id,
        quantidade_consumida,
        preparos (
          data_preparo,
          mestre_preparo,
          grau
        )
      `)
      .eq('id_sessao', sessao.id)

    if (data) {
      setSessionConsumos(data as any)
    } else if (error) {
      console.error('Erro ao buscar detalhes:', error)
    }

    setLoadingDetails(false)
  }

  const handleCloseModal = () => {
    setSelectedSession(null)
    setSessionConsumos([])
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold">Histórico de Sessões</h1>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-10 animate-pulse">Carregando sessões...</p>
      ) : (
        <div className="space-y-4">
          {/* BARRA DE PESQUISA */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all text-gray-900 dark:text-white"
              placeholder="Buscar por dirigente, tipo ou data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {sessoes.filter(sessao => {
            const searchLower = searchTerm.toLowerCase()
            const dirigente = sessao.dirigente?.toLowerCase() || ''
            const tipo = sessao.tipo?.toLowerCase() || ''
            const data = new Date(sessao.data_realizacao).toLocaleDateString('pt-BR').toLowerCase()
            return dirigente.includes(searchLower) || tipo.includes(searchLower) || data.includes(searchLower)
          }).map(sessao => (
            <div
              key={sessao.id}
              onClick={() => handleOpenModal(sessao)}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md uppercase tracking-wide">
                    {sessao.tipo}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-2 text-lg">
                    {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dirigente: {sessao.dirigente}</p>
                  {sessao.user_id && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1" title={`ID: ${sessao.user_id}`}>
                      <Users className="w-3 h-3" /> {sessao.user_name || sessao.user_id.slice(0, 8) + '...'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="p-2 text-gray-400 dark:text-gray-500">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{sessao.quantidade_participantes} pessoas</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Droplet className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{sessao.quantidade_consumida} L</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

            {/* Header do Modal */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">{selectedSession.tipo}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date(selectedSession.data_realizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{selectedSession.quantidade_participantes} participantes</span>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* Grid de Pessoas */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Dirigente</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedSession.dirigente || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Leitor</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{selectedSession.leitor_documentos || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Explanação</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{selectedSession.explanador || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Consumo */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Droplet className="w-5 h-5 text-green-600 dark:text-green-500" />
                  O que foi servido
                </h3>

                {loadingDetails ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionConsumos.length > 0 ? (
                      sessionConsumos.map((item) => (
                        <div key={item.id} className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-4 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {item.preparos?.mestre_preparo || 'Mestre Desconhecido'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.preparos?.data_preparo ? new Date(item.preparos.data_preparo).toLocaleDateString('pt-BR') : '-'} • {item.preparos?.grau || '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="block text-xl font-bold text-green-700 dark:text-green-400">
                              {item.quantidade_consumida} <span className="text-sm font-normal">L</span>
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 italic py-4">Nenhum registro de consumo encontrado.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botão de Editar */}
              <div className="pt-2">
                <Link href={`/editar-sessao/${selectedSession.id}`} className="block w-full text-center py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-colors">
                  Editar Dados da Sessão
                </Link>
                {selectedSession.user_id && (
                  <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-4 flex items-center justify-center gap-1">
                    <User className="w-3 h-3" /> Registrado por: <span className="font-mono">{selectedSession.user_name || selectedSession.user_id}</span>
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}