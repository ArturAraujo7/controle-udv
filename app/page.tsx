'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Database, History, Droplet, ChevronRight, Users, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

// Tipo para o resumo da sessão na lista
type SessaoResumo = {
  id: number
  data_realizacao: string
  tipo: string
  quantidade_participantes: number
}

export default function Home() {
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)
  const [totalSessoes, setTotalSessoes] = useState<number>(0)
  const [ultimasSessoes, setUltimasSessoes] = useState<SessaoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function fetchData() {
      // 1. Calcula Estoque
      const { data: preparos } = await supabase.from('preparos').select('quantidade_preparada')
      const { data: sessoes } = await supabase.from('sessoes').select('quantidade_consumida, id, data_realizacao, tipo, quantidade_participantes').order('data_realizacao', { ascending: false })

      const totalEntrada = preparos?.reduce((acc, curr) => acc + (curr.quantidade_preparada || 0), 0) || 0
      const totalSaida = sessoes?.reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0) || 0
      
      setEstoqueAtual(totalEntrada - totalSaida)
      setTotalSessoes(sessoes?.length || 0)
      
      if (sessoes) {
        setUltimasSessoes(sessoes.slice(0, 3) as SessaoResumo[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gray-900 p-4 pb-20 transition-colors duration-300">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Controle UDV</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Núcleo Beneficente</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-yellow-400 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center border border-green-200 dark:border-green-800">
            <span className="text-green-700 dark:text-green-300 font-bold">A</span>
          </div>
        </div>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/estoque">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full relative overflow-hidden active:scale-95 transition-all">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
              <Droplet className="w-24 h-24 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
              <Droplet className="w-5 h-5" />
              <span className="font-semibold text-sm">Estoque</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {loading ? '...' : estoqueAtual.toFixed(1)} <span className="text-sm text-gray-400 font-normal">L</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Disponível hoje</p>
          </div>
        </Link>

        <Link href="/sessoes">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full active:scale-95 transition-all">
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
              <span className="font-semibold text-sm">Sessões</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {loading ? '...' : totalSessoes}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Realizadas este ano</p>
          </div>
        </Link>
      </div>

      {/* Ações */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 px-1">Ações</h2>
      <div className="grid grid-cols-1 gap-3 mb-8">
        <Link href="/nova-sessao" className="group">
          <div className="bg-green-700 dark:bg-green-600 p-4 rounded-xl shadow-lg shadow-green-200/50 dark:shadow-none flex items-center justify-between active:scale-95 transition-all">
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

        <Link href="/novo-preparo" className="group">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg">
                <Database className="w-6 h-6 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-gray-800 dark:text-white font-bold">Novo Preparo</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Cadastrar entrada de vegetal</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 dark:text-gray-600" />
          </div>
        </Link>
      </div>

      {/* Histórico Recente */}
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 px-1">Últimas Sessões</h2>
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">Carregando...</p>
        ) : ultimasSessoes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-700 border-dashed">
            <p className="text-gray-400 text-sm">Nenhuma sessão registrada.</p>
          </div>
        ) : (
          ultimasSessoes.map(sessao => (
            <Link key={sessao.id} href={`/editar-sessao/${sessao.id}`}>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between active:scale-95 transition-all hover:shadow-md dark:hover:bg-gray-750">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">
                    {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}
                  </p>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">{sessao.tipo}</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">
                  <Users className="w-3 h-3 text-gray-400 dark:text-gray-300" />
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{sessao.quantidade_participantes}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}