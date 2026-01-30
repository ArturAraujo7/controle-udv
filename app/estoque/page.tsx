'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Beaker, Plus, AlertCircle, Truck, Droplet, Pencil } from 'lucide-react'

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
}

export default function GerenciarEstoque() {
  const [preparos, setPreparos] = useState<PreparoComSaldo[]>([])
  const [saldoTotal, setSaldoTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEstoque() {
      const { data: dadosPreparos } = await supabase.from('preparos').select('*').order('data_preparo', { ascending: false })
      const { data: dadosSessoes } = await supabase.from('sessoes').select('id_preparo, quantidade_consumida')
      
      let somaTotal = 0
      const listaFinal = dadosPreparos?.map((preparo: any) => {
        const consumos = dadosSessoes?.filter(s => s.id_preparo === preparo.id) || []
        const totalConsumido = consumos.reduce((acc, curr) => acc + curr.quantidade_consumida, 0)
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
    <div className="min-h-screen bg-gray-900 p-4 pb-20 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Estoque</h1>
        </div>
        <Link href="/novo-preparo" className="p-2 bg-green-600 rounded-full shadow-lg text-white hover:bg-green-700 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Calculando...</p>
      ) : (
        <div className="space-y-6">
          
          {/* CARD DESTAQUE TOTAL */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Droplet className="w-32 h-32 text-white" />
            </div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Saldo Total Disponível</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-white tracking-tight">{saldoTotal.toFixed(1)}</span>
              <span className="text-xl text-gray-500 font-medium">Litros</span>
            </div>
          </div>

          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Lotes Individuais</h2>

          {/* LISTA DE PREPAROS */}
          <div className="space-y-4">
            {preparos.map(preparo => {
              const isDoacao = preparo.tipo === 'Doação'
              
              return (
                <div key={preparo.id} className={`bg-gray-800 p-4 rounded-xl shadow-sm border ${isDoacao ? 'border-blue-900/50' : 'border-green-900/30'} relative overflow-hidden group`}>
                  
                  {/* Barra de Progresso */}
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${isDoacao ? 'bg-blue-500' : 'bg-green-500'}`} 
                    style={{ width: `${(preparo.saldo / preparo.quantidade_preparada) * 100}%` }}
                  />

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {/* Badge de Tipo */}
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${
                        isDoacao ? 'bg-blue-900/40 text-blue-400' : 'bg-green-900/40 text-green-400'
                      }`}>
                        {isDoacao ? <Truck className="w-3 h-3" /> : <Beaker className="w-3 h-3" />}
                        {isDoacao ? 'Doação Externa' : 'Produção Local'}
                      </div>

                      <h3 className="font-bold text-white text-lg leading-tight">
                        {isDoacao ? preparo.nucleo_origem : `M. ${preparo.mestre_preparo}`}
                      </h3>
                      
                      <div className="flex flex-col mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(preparo.data_preparo).toLocaleDateString('pt-BR')} • Grau {preparo.grau}
                        </span>
                        {isDoacao && (
                          <span className="text-xs text-blue-300/70 mt-0.5">
                            Resp: M. {preparo.mestre_preparo}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* LADO DIREITO: Saldo + Botão de Editar */}
                    <div className="text-right flex flex-col items-end gap-2">
                      <Link href={`/editar-preparo/${preparo.id}`} className="p-2 -mr-2 text-gray-500 hover:text-white transition-colors">
                        <Pencil className="w-4 h-4" />
                      </Link>

                      <div>
                        <p className={`text-2xl font-bold ${isDoacao ? 'text-blue-100' : 'text-green-50'}`}>
                          {preparo.saldo.toFixed(1)} <span className="text-sm font-normal text-gray-500">L</span>
                        </p>
                        <p className="text-xs text-gray-500">restantes</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes de Consumo */}
                  <div className="bg-gray-900/50 rounded-lg p-3 flex justify-between items-center text-xs text-gray-400 border border-gray-700/50">
                    <div>
                      Inicial: <strong className="text-gray-300">{preparo.quantidade_preparada} L</strong>
                    </div>
                    <div>
                      Consumido: <strong className="text-gray-300">{preparo.total_consumido.toFixed(1)} L</strong>
                    </div>
                  </div>

                  {/* Alertas */}
                  {preparo.saldo < 5 && preparo.saldo > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-orange-400 text-xs font-medium animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      <span>Estoque baixo!</span>
                    </div>
                  )}
                  
                  {preparo.saldo <= 0 && (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[1px] flex items-center justify-center">
                       <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-600 uppercase tracking-widest">Esgotado</span>
                       {/* Botão de editar visível mesmo esgotado */}
                       <Link href={`/editar-preparo/${preparo.id}`} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white z-10">
                        <Pencil className="w-4 h-4" />
                      </Link>
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