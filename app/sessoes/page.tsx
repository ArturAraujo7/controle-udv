'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Users, Droplet } from 'lucide-react'

type Sessao = {
  id: number
  data_realizacao: string
  tipo: string
  dirigente: string
  quantidade_participantes: number
  quantidade_consumida: number
}

export default function HistoricoSessoes() {
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSessoes() {
      // 1. Busca as sessões
      const { data: dadosSessoes } = await supabase.from('sessoes').select('*').order('data_realizacao', { ascending: false })
      
      // 2. Busca os consumos
      const { data: dadosConsumos } = await supabase.from('consumos_sessao').select('id_sessao, quantidade_consumida')

      // 3. Calcula o total por sessão
      const sessoesComConsumo = dadosSessoes?.map((sessao: any) => {
        const consumosDaSessao = dadosConsumos?.filter(c => c.id_sessao === sessao.id) || []
        const totalConsumido = consumosDaSessao.reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0)
        
        return {
          ...sessao,
          quantidade_consumida: totalConsumido
        }
      }) || []

      setSessoes(sessoesComConsumo)
      setLoading(false)
    }
    fetchSessoes()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold">Histórico de Sessões</h1>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {sessoes.map(sessao => (
            <div key={sessao.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded-md uppercase tracking-wide">
                    {sessao.tipo}
                  </span>
                  <h3 className="font-bold text-white mt-2 text-lg">
                    {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-400">Dirigente: {sessao.dirigente}</p>
                </div>
                <div className="text-right">
                  <Link href={`/editar-sessao/${sessao.id}`} className="p-2 -mr-2 text-gray-500 hover:text-green-400 inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">{sessao.quantidade_participantes} pessoas</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Droplet className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-white">{sessao.quantidade_consumida} L</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}