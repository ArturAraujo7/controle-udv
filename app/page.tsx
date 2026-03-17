'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Database, History, GlassWater, ChevronRight, Users, LogOut, ArrowUpRight, BarChart3, User, BookOpen, Mic, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ChangelogModal } from '@/components/ChangelogModal'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/components/AuthProvider'

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

type Movimentacao = {
  id: string
  tipo_movimento: 'entrada' | 'saida' | 'consumo' | 'historico'
  data: string
  titulo: string
  subtitulo: string
  quantidade: number
  detalhesSessao?: Sessao
}

export default function Home() {
  const { session } = useAuth()
  const router = useRouter()
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)
  const [totalSessoes, setTotalSessoes] = useState<number>(0)
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para o Modal
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sessionConsumos, setSessionConsumos] = useState<ConsumoDetalhado[]>([])

  useEffect(() => {
    async function fetchData() {
      // 1. Verifica se usuario tem nome definido (Forçar Cadastro)
      const user = session?.user
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
      const { data: preparos } = await supabase.from('preparos').select('id, quantidade_preparada, data_preparo, tipo, grau, nucleo_origem, mestre_preparo')
      // Agora buscamos o consumo na tabela certa
      const { data: consumos } = await supabase.from('consumos_sessao').select('id_sessao, quantidade_consumida')

      // Buscamos sessões com todos os campos necessários para o modal
      const { data: sessoes } = await supabase
        .from('sessoes')
        .select('*') // Trazendo tudo para ter dirigente, explanador, etc.
        .order('data_realizacao', { ascending: false })

      const { data: saidas } = await supabase.from('saidas').select('id, quantidade, data_saida, destino')

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

      // 4. Montar a lista unificada de movimentações
      const movimentos: Movimentacao[] = []

      if (preparos) {
        preparos.forEach(p => {
          const isDoacao = p.tipo === 'Doação'
          movimentos.push({
            id: `preparo-${p.id}`,
            tipo_movimento: 'entrada',
            data: p.data_preparo,
            titulo: isDoacao ? 'Entrada (Doação)' : 'Novo Preparo',
            subtitulo: isDoacao ? `De: ${p.nucleo_origem || 'Outro núcleo'}` : `Grau ${p.grau} - M. ${p.mestre_preparo}`,
            quantidade: p.quantidade_preparada
          })
        })
      }

      if (sessoes) {
        sessoes.forEach(s => {
          const consumosDaSessao = consumos?.filter(c => c.id_sessao === s.id) || []
          const totalConsumidoNaSessao = consumosDaSessao.reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0)

          const isSessaoHistorica = s.quantidade_participantes === 0;

          if (totalConsumidoNaSessao > 0 || isSessaoHistorica) {
            movimentos.push({
              id: `sessao-${s.id}`,
              tipo_movimento: isSessaoHistorica ? 'historico' : 'consumo',
              data: s.data_realizacao,
              titulo: isSessaoHistorica ? `Registro: ${s.tipo || 'Sem Tipo'}` : `Sessão: ${s.tipo || 'Sem Tipo'}`,
              subtitulo: isSessaoHistorica ? `Memória M. ${s.dirigente}` : `${s.quantidade_participantes || 0} participantes`,
              quantidade: totalConsumidoNaSessao,
              detalhesSessao: s
            })
          }
        })
      }

      if (saidas) {
        saidas.forEach(s => {
          if (s.quantidade > 0) {
            movimentos.push({
              id: `saida-${s.id}`,
              tipo_movimento: 'saida',
              data: s.data_saida,
              titulo: 'Saída / Doação',
              subtitulo: `Para: ${s.destino || 'Não informado'}`,
              quantidade: s.quantidade
            })
          }
        })
      }

      // Ordenar do mais recente para o mais antigo e pegar os 5 primeiros
      movimentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      setUltimasMovimentacoes(movimentos.slice(0, 5))

      setLoading(false)
    }
    fetchData()
  }, [session?.user?.id, router])

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
      setSessionConsumos(data as unknown as ConsumoDetalhado[])
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            <Logo className="w-full h-full drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-400 dark:from-gold-400 dark:to-gold-200 tracking-tight">GUARDIÃO</h1>
            <p className="text-xs font-semibold text-celestial-600 dark:text-celestial-400 uppercase tracking-widest">Controle & Memória</p>
          </div>
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gold-200 dark:border-gold-900/50 h-full relative overflow-hidden active:scale-95 transition-all group hover:border-gold-400 dark:hover:border-gold-700">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <GlassWater className="w-24 h-24 text-gold-600 dark:text-gold-500" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-gold-600 dark:text-gold-500">
              <GlassWater className="w-5 h-5" />
              <span className="font-semibold text-sm">Estoque</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : estoqueAtual.toFixed(2).replace('.', ',')} <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">L</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Disponível hoje</p>
          </div>
        </Link>

        <Link href="/sessoes">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-celestial-200 dark:border-celestial-900/50 h-full relative overflow-hidden active:scale-95 transition-all group hover:border-celestial-400 dark:hover:border-celestial-700">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <History className="w-24 h-24 text-celestial-600 dark:text-celestial-500" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-celestial-600 dark:text-celestial-500">
              <History className="w-5 h-5" />
              <span className="font-semibold text-sm">Sessões</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {loading ? '...' : totalSessoes}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Realizadas este ano</p>
          </div>
        </Link>
      </div>

      {/* Ações */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-1">Ações</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">

        {/* Linha 1: Nova Sessão */}
        <Link href="/nova-sessao" className="group">
          <div className="bg-gradient-to-br from-gold-600 to-gold-500 p-4 rounded-xl shadow-lg shadow-gold-900/20 flex flex-col justify-between active:scale-95 transition-all border border-gold-400/50 h-full min-h-[110px]">
            <div className="w-10 h-10 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-inner mb-2">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold leading-tight">Sessão</h3>
              <p className="text-gold-100 text-[10px] font-medium leading-tight mt-0.5">Registrar ata</p>
            </div>
          </div>
        </Link>

        {/* Linha 1: Novo Preparo */}
        <Link href="/novo-preparo" className="group">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 h-full min-h-[110px]">
            <div className="w-10 h-10 bg-gold-50 dark:bg-gold-900/30 rounded-lg flex items-center justify-center mb-2">
              <Database className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold leading-tight">Preparo</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">Nova entrada</p>
            </div>
          </div>
        </Link>

        {/* Linha 2: Saída / Doação */}
        <Link href="/nova-saida" className="group">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 h-full min-h-[110px]">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-2">
              <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold leading-tight">Saída</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">Registrar doação</p>
            </div>
          </div>
        </Link>

        {/* Linha 2: Relatórios */}
        <Link href="/relatorios" className="group">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 h-full min-h-[110px]">
            <div className="w-10 h-10 bg-celestial-50 dark:bg-celestial-900/30 rounded-lg flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-celestial-600 dark:text-celestial-400" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-bold leading-tight">Relatórios</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">Estatísticas gerais</p>
            </div>
          </div>
        </Link>

        {/* Linha 3: Registro Histórico (Full Width) */}
        <Link href="/nova-sessao-historica" className="group col-span-2">
          <div className="bg-amber-600 p-4 rounded-xl shadow-lg flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Registro Histórico</h3>
                <p className="text-amber-100 text-xs">Sessões que aconteceram antes de 2026</p>
              </div>
            </div>
            <ChevronRight className="text-white/50" />
          </div>
        </Link>
      </div>

      {/* Histórico Recente */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Últimas Movimentações</h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Carregando...</p>
        ) : ultimasMovimentacoes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma movimentação registrada.</p>
          </div>
        ) : (
          ultimasMovimentacoes.map(mov => {
            const isEntrada = mov.tipo_movimento === 'entrada'
            const isConsumo = mov.tipo_movimento === 'consumo'
            const isSaida = mov.tipo_movimento === 'saida'
            const isHistorico = mov.tipo_movimento === 'historico'

            return (
              <div
                key={mov.id}
                onClick={() => {
                  if ((isConsumo || isHistorico) && mov.detalhesSessao) {
                    handleOpenModal(mov.detalhesSessao)
                  }
                }}
                className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-all ${(isConsumo || isHistorico) ? 'active:scale-95 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl border ${isEntrada ? 'bg-gold-50 border-gold-100 dark:bg-gold-900/20 dark:border-gold-900/50 text-gold-600 dark:text-gold-400' :
                    isSaida ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50 text-red-600 dark:text-red-400' :
                      isHistorico ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50 text-amber-600 dark:text-amber-400' :
                        'bg-celestial-50 border-celestial-100 dark:bg-celestial-900/20 dark:border-celestial-900/50 text-celestial-600 dark:text-celestial-400'
                    }`}>
                    {isEntrada ? <Database className="w-5 h-5" /> :
                      isSaida ? <ArrowUpRight className="w-5 h-5" /> :
                        isHistorico ? <BookOpen className="w-5 h-5" /> :
                          <History className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      {new Date(mov.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                    <h3 className="font-bold text-gray-900 dark:text-gray-200 leading-tight">{mov.titulo}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{mov.subtitulo}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isHistorico ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Histórica
                    </span>
                  ) : (
                    <span className={`text-sm font-bold ${isEntrada ? 'text-gold-600 dark:text-gold-400' :
                      'text-red-500 dark:text-red-400'
                      }`}>
                      {isEntrada ? '+' : '-'}{mov.quantidade.toFixed(2).replace('.', ',')} <span className="text-[10px] font-normal">L</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL DE DETALHES */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

            {/* Header do Modal */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-celestial-600 dark:text-celestial-400 uppercase tracking-widest mb-1">{selectedSession.tipo}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date(selectedSession.data_realizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  {selectedSession.quantidade_participantes === 0 ? (
                    <span>Registro Histórico (S/ Participantes)</span>
                  ) : (
                    <span>{selectedSession.quantidade_participantes} participantes</span>
                  )}
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
                  <div className="p-2 bg-celestial-100 dark:bg-celestial-900/30 rounded-lg text-celestial-600 dark:text-celestial-400">
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
              {selectedSession.quantidade_participantes === 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-6 rounded-xl text-center">
                  <BookOpen className="w-8 h-8 text-amber-500 dark:text-amber-600 mx-auto mb-3" />
                  <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-1">Registro de Memória Institucional</h3>
                  <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
                    Sessão histórica inserida sem registro quantitativo de participantes ou consumo de vegetal.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <GlassWater className="w-5 h-5 text-gold-600 dark:text-gold-500" />
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
                          <div key={item.id} className="bg-gold-50 dark:bg-gold-900/10 border border-gold-100 dark:border-gold-900/30 p-4 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {item.preparos?.mestre_preparo || 'Mestre Desconhecido'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.preparos?.data_preparo ? new Date(item.preparos.data_preparo).toLocaleDateString('pt-BR') : '-'} • {item.preparos?.grau || '-'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-xl font-bold text-gold-700 dark:text-gold-400">
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
              )}

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