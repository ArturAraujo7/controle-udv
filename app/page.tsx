'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Database, History, Droplet, ChevronRight, Users, LogOut, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type SessaoResumo = {
  id: number
  data_realizacao: string
  tipo: string
  quantidade_participantes: number
}

export default function Home() {
  const router = useRouter()
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)
  const [totalSessoes, setTotalSessoes] = useState<number>(0)
  const [ultimasSessoes, setUltimasSessoes] = useState<SessaoResumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // 1. Buscamos todas as tabelas: preparos, consumos_sessao e saidas
      const { data: preparos } = await supabase.from('preparos').select('quantidade_preparada')
      // Agora buscamos o consumo na tabela certa
      const { data: consumos } = await supabase.from('consumos_sessao').select('quantidade_consumida')
      const { data: sessoes } = await supabase.from('sessoes').select('id, data_realizacao, tipo, quantidade_participantes').order('data_realizacao', { ascending: false })
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
        setUltimasSessoes(sessoes.slice(0, 3) as SessaoResumo[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4 pb-20 text-white">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Controle UDV</h1>
          <p className="text-sm text-gray-400">Núcleo Jardim Real</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/estoque">
          <div className="bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-700 h-full relative overflow-hidden active:scale-95 transition-all">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
              <Droplet className="w-24 h-24 text-green-400" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-green-400">
              <Droplet className="w-5 h-5" />
              <span className="font-semibold text-sm">Estoque</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '...' : estoqueAtual.toFixed(1)} <span className="text-sm text-gray-400 font-normal">L</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Disponível hoje</p>
          </div>
        </Link>

        <Link href="/sessoes">
          <div className="bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-700 h-full active:scale-95 transition-all">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <History className="w-5 h-5" />
              <span className="font-semibold text-sm">Sessões</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '...' : totalSessoes}
            </p>
            <p className="text-xs text-gray-500 mt-1">Realizadas este ano</p>
          </div>
        </Link>
      </div>

      {/* Ações */}
      <h2 className="text-lg font-bold text-white mb-4 px-1">Ações</h2>
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
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-red-900/30 p-2 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Saída / Doação</h3>
                <p className="text-gray-400 text-xs">Registrar saída externa</p>
              </div>
            </div>
            <ChevronRight className="text-gray-600" />
          </div>
        </Link>

        <Link href="/novo-preparo" className="group">
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-green-900/30 p-2 rounded-lg">
                <Database className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Novo Preparo</h3>
                <p className="text-gray-400 text-xs">Cadastrar entrada de vegetal</p>
              </div>
            </div>
            <ChevronRight className="text-gray-600" />
          </div>
        </Link>
      </div>

      {/* Histórico Recente */}
      <h2 className="text-lg font-bold text-white mb-4 px-1">Últimas Sessões</h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">Carregando...</p>
        ) : ultimasSessoes.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700 border-dashed">
            <p className="text-gray-400 text-sm">Nenhuma sessão registrada.</p>
          </div>
        ) : (
          ultimasSessoes.map(sessao => (
            <Link key={sessao.id} href={`/editar-sessao/${sessao.id}`}>
              <div className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex items-center justify-between active:scale-95 transition-all hover:bg-gray-750">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}
                  </p>
                  <h3 className="font-bold text-gray-200">{sessao.tipo}</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg">
                  <Users className="w-3 h-3 text-gray-300" />
                  <span className="text-sm font-bold text-gray-300">{sessao.quantidade_participantes}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}