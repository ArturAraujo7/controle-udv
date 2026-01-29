'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Beaker, Plus, AlertCircle } from 'lucide-react'

type PreparoComSaldo = {
  id: number
  data_preparo: string
  mestre_preparo: string
  quantidade_preparada: number
  grau: string
  status: string
  total_consumido: number
  saldo: number
}

export default function GerenciarEstoque() {
  const [preparos, setPreparos] = useState<PreparoComSaldo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEstoque() {
      const { data: dadosPreparos } = await supabase.from('preparos').select('*').order('data_preparo', { ascending: false })
      const { data: dadosSessoes } = await supabase.from('sessoes').select('id_preparo, quantidade_consumida')
      
      const listaFinal = dadosPreparos?.map((preparo: any) => {
        const consumos = dadosSessoes?.filter(s => s.id_preparo === preparo.id) || []
        const totalConsumido = consumos.reduce((acc, curr) => acc + curr.quantidade_consumida, 0)
        return { ...preparo, total_consumido: totalConsumido, saldo: preparo.quantidade_preparada - totalConsumido }
      }) || []

      setPreparos(listaFinal)
      setLoading(false)
    }
    fetchEstoque()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-20 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Estoque</h1>
        </div>
        <Link href="/novo-preparo" className="p-2 bg-green-600 rounded-full shadow-lg text-white hover:bg-green-700">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Calculando...</p>
      ) : (
        <div className="space-y-4">
          {preparos.map(preparo => (
            <div key={preparo.id} className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-1000" style={{ width: `${(preparo.saldo / preparo.quantidade_preparada) * 100}%` }} />
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">{new Date(preparo.data_preparo).toLocaleDateString('pt-BR')}</p>
                  <h3 className="font-bold text-white text-lg leading-tight">M. {preparo.mestre_preparo}</h3>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">Grau: {preparo.grau}</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{preparo.saldo.toFixed(1)} <span className="text-sm font-normal text-gray-500">L</span></p>
                  <p className="text-xs text-gray-500">restantes</p>
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 flex justify-between items-center text-xs text-gray-400">
                <div className="flex items-center gap-2"><Beaker className="w-4 h-4 text-gray-500" /> <span>Inicial: <strong>{preparo.quantidade_preparada} L</strong></span></div>
                <div>Consumido: <strong>{preparo.total_consumido.toFixed(1)} L</strong></div>
              </div>
              {preparo.saldo < 5 && preparo.saldo > 0 && <div className="mt-3 flex items-center gap-2 text-orange-400 text-xs font-medium"><AlertCircle className="w-4 h-4" /> <span>Estoque baixo!</span></div>}
              {preparo.saldo <= 0 && <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-medium"><AlertCircle className="w-4 h-4" /> <span>Esgotado</span></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}