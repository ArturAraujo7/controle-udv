'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Database, History, Droplet, ChevronRight, Users, LogOut, ArrowUpRight, BarChart3, User, BookOpen, Mic, X, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChangelogModal } from '@/components/ChangelogModal'

type Sessao = {
  id: number
  data_realizacao: string
  tipo: string
  dirigente: string
  quantidade_participantes: number
  quantidade_consumida: number // Calculado no front
  user_id?: string
  explanador?: string
  leitor_documentos?: string
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

export default function Home() {
  const router = useRouter()
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)
  const [totalSessoes, setTotalSessoes] = useState<number>(0)
  const [ultimasSessoes, setUltimasSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para o Modal
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sessionConsumos, setSessionConsumos] = useState<ConsumoDetalhado[]>([])

  useEffect(() => {
    async function fetchData() {
      // 1. Verifica se usuario tem nome definido (Forçar Cadastro)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (!profile?.full_name) {
          router.push('/perfil')
          return // Interrompe o carregamento da dash
        }
      }

      // 2. Buscamos todas as tabelas: preparos, consumos_sessao e saidas
      const { data: preparos } = await supabase.from('preparos').select('quantidade_preparada')
      // Agora buscamos o consumo na tabela certa
      const { data: consumos } = await supabase.from('consumos_sessao').select('quantidade_consumida')

      // Buscamos sessões com todos os campos necessários para o modal
      const { data: sessoes } = await supabase
        .from('sessoes')
        .select('*') // Trazendo tudo para ter dirigente, explanador, etc.
        .order('data_realizacao', { ascending: false })

      const { data: saidas } = await supabase.from('saidas').select('quantidade')

      // 2. Calculamos os totais
      const totalEntrada = preparos?.reduce((acc, curr) => acc + (curr.quantidade_preparada || 0), 0) || 0
      // Soma da tabela de consumos
      const totalConsumoSessoes = consumos?.reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0) || 0
      const totalSaidasExtras = saidas?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0

      // 3. Atualizamos a conta final
      // Estoque = Tudo que entrou - (O que bebeu na sessão + O que saiu/doou)
      setEstoqueAtual(totalEntrada - totalConsumoSessoes - totalSaidasExtras)

      const anoAtual = new Date().getFullYear()
      const sessoesDoAno = sessoes?.filter(s => new Date(s.data_realizacao).getFullYear() === anoAtual)

      setTotalSessoes(sessoesDoAno?.length || 0)

      if (sessoes) {
        setUltimasSessoes(sessoes.slice(0, 3) as Sessao[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
      <ChangelogModal />
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle UDV</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Núcleo Jardim Real</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/perfil"
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm"
            title="Meu Perfil"
          >
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm"
            title="Sair"
          >
            <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/estoque">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-full relative overflow-hidden active:scale-95 transition-all">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
              <Droplet className="w-24 h-24 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
              <Droplet className="w-5 h-5" />
              <span className="font-semibold text-sm">Estoque</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : estoqueAtual.toFixed(1)} <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">L</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Disponível hoje</p>
          </div>
        </Link>

        <Link href="/sessoes">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-full active:scale-95 transition-all">
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
              <span className="font-semibold text-sm">Sessões</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : totalSessoes}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Realizadas este ano</p>
          </div>
        </Link>
      </div>

      {/* Ações */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Ações</h2>
      <div className="grid grid-cols-1 gap-3 mb-8">
        <Link href="/nova-sessao" className="group">
          <div className="bg-green-600 p-4 rounded-xl shadow-lg flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Nova Sessão</h3>
                <p className="text-green-100 text-xs">Registrar ata e consumo</p>
              </div>
            </div>
            <ChevronRight className="text-white/50" />
          </div>
        </Link>

        <Link href="/nova-saida" className="group">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">Saída / Doação</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Registrar saída externa</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 dark:text-gray-600" />
          </div>
        </Link>

        <Link href="/novo-preparo" className="group">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">Novo Preparo</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Cadastrar entrada de vegetal</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 dark:text-gray-600" />
          </div>
        </Link>

        <Link href="/relatorios" className="group">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">Relatórios</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Estatísticas e Médias</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 dark:text-gray-600" />
          </div>
        </Link>
      </div>

      {/* Histórico Recente */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Últimas Sessões</h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Carregando...</p>
        ) : ultimasSessoes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma sessão registrada.</p>
          </div>
        ) : (
          ultimasSessoes.map(sessao => (
            <div
              key={sessao.id}
              onClick={() => handleOpenModal(sessao)}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
            >
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium mb-1">
                  {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}
                </p>
                <h3 className="font-bold text-gray-900 dark:text-gray-200">{sessao.tipo}</h3>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                <Users className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{sessao.quantidade_participantes}</span>
              </div>
            </div>
          ))
        )}
      </div>

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
                    <User className="w-3 h-3" /> Registrado por: <span className="font-mono">{selectedSession.user_id}</span>
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  )
}