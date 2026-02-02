'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Calendar, Droplets, FlaskConical, Users, History } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DetalheEstoque({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [preparo, setPreparo] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // 1. Busca dados do Preparo
      const { data: prep, error: errPrep } = await supabase
        .from('preparos')
        .select('*')
        .eq('id', id)
        .single()

      if (errPrep) {
        alert('Preparo não encontrado')
        router.push('/estoque')
        return
      }
      setPreparo(prep)

      // 2. Busca sessões onde esse preparo foi usado
      const { data: sessoes, error: errSess } = await supabase
        .from('sessoes')
        .select('*')
        .eq('id_preparo', id) // CORRIGIDO: id_preparo
        .order('data_realizacao', { ascending: false }) // CORRIGIDO: data_realizacao

      if (sessoes) setHistorico(sessoes)
      
      setLoading(false)
    }
    loadData()
  }, [id, router])

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando histórico...</div>

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white pb-20">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/estoque" className="p-2 bg-gray-800 rounded-full border border-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Detalhes do Vegetal</h1>
          <p className="text-xs text-gray-400">Lote #{id.slice(0,6)}</p>
        </div>
      </div>

      {/* Card Principal do Vegetal */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <FlaskConical size={100} />
        </div>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
              preparo.status === 'Disponível' ? 'bg-green-900/30 text-green-400 border-green-800' :
              preparo.status === 'Esgotado' ? 'bg-red-900/30 text-red-400 border-red-800' :
              'bg-yellow-900/30 text-yellow-400 border-yellow-800'
            }`}>
              {preparo.status}
            </span>
          </div>
          <Link 
            href={`/editar-preparo/${id}`}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold underline"
          >
            Editar
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Mestre</p>
            <p className="font-semibold">{preparo.mestre_preparo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Grau</p>
            <p className="font-semibold">{preparo.grau}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Qtd. Inicial</p>
            <p className="font-semibold text-gray-300">{preparo.quantidade_preparada} L</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Qtd. Atual (Estimada)</p>
            {/* Aqui poderiamos calcular subtraindo o consumo, mas por enquanto vamos deixar fixo ou calcular simples */}
            <p className="font-bold text-white text-lg">
              {(preparo.quantidade_preparada - historico.reduce((acc, s) => acc + (Number(s.quantidade_consumida) || 0), 0)).toFixed(1)} L
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3 mt-2 grid grid-cols-2 gap-2 text-xs">
           <div>
             <span className="text-gray-500 block">Mariri</span>
             <span className="text-gray-300">{preparo.procedencia_mariri || '-'}</span>
           </div>
           <div>
             <span className="text-gray-500 block">Chacrona</span>
             <span className="text-gray-300">{preparo.procedencia_chacrona || '-'}</span>
           </div>
        </div>
      </div>

      {/* Histórico de Consumo */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <History className="w-4 h-4" /> Histórico de Consumo
      </h2>

      {historico.length === 0 ? (
        <div className="text-center py-10 text-gray-600 bg-gray-800/30 rounded-xl border border-dashed border-gray-800">
          <p>Nenhum consumo registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historico.map((sessao) => (
            <div key={sessao.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{sessao.dirigente}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-red-400 font-bold">
                  <Droplets className="w-3 h-3" />
                  -{sessao.quantidade_consumida} L
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                  <Users className="w-3 h-3" />
                  {sessao.quantidade_participantes} pessoas
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}