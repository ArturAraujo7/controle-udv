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

      // 2. Busca consumos deste preparo (na tabela nova)
      const { data: consumos, error: errConsumos } = await supabase
        .from('consumos_sessao')
        .select(`
          quantidade_consumida,
          sessoes (
            id,
            data_realizacao,
            tipo,
            dirigente,
            quantidade_participantes
          )
        `)
        .eq('id_preparo', id)

      if (errConsumos) {
        console.error('Erro ao buscar consumos:', errConsumos)
      }

      // 3. Busca saídas/doações deste preparo
      const { data: saidas, error: errSaidas } = await supabase
        .from('saidas')
        .select('*')
        .eq('preparo_id', id)
        .order('data_saida', { ascending: false })

      if (errSaidas) {
        console.error('Erro ao buscar saídas:', errSaidas)
      }

      // 4. Formata a lista de sessões a partir dos consumos
      const listaSessoes = consumos?.map((c: any) => {
        const sessao = c.sessoes
        if (!sessao) return null

        return {
          id: `sessao-${sessao.id}`,
          realId: sessao.id,
          tipo: 'Sessão',
          titulo: sessao.dirigente || sessao.tipo,
          data: sessao.data_realizacao,
          quantidade: c.quantidade_consumida,
          subtitulo: `${sessao.quantidade_participantes} participantes`,
          isSaida: false
        }
      }).filter(item => item !== null) || []

      // 5. Formata lista de saídas
      const listaSaidas = saidas?.map(s => ({
        id: `saida-${s.id}`,
        realId: s.id,
        tipo: 'Doação / Saída',
        titulo: s.destino,
        data: s.data_saida,
        quantidade: s.quantidade,
        subtitulo: s.observacoes || 'Saída externa',
        isSaida: true
      })) || []

      // 6. Unifica e ordena por data (mais recente primeiro)
      const historicoUnificado = [...listaSessoes, ...listaSaidas].sort((a: any, b: any) =>
        new Date(b.data).getTime() - new Date(a.data).getTime()
      )

      setHistorico(historicoUnificado)
      setLoading(false)
    }
    loadData()
  }, [id, router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
      <div className="animate-pulse">Carregando histórico...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-gray-900 dark:text-white pb-20 transition-colors duration-300">

      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/estoque" className="p-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Detalhes do Vegetal</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Lote #{id.slice(0, 6)}</p>
        </div>
      </div>

      {/* Card Principal do Vegetal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-5 text-gray-900 dark:text-white">
          <FlaskConical size={100} />
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${preparo.status === 'Disponível' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                preparo.status === 'Esgotado' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
              }`}>
              {preparo.status}
            </span>
          </div>
          <Link
            href={`/editar-preparo/${id}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold underline"
          >
            Editar
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mestre</p>
            <p className="font-semibold text-gray-900 dark:text-white">{preparo.mestre_preparo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Grau</p>
            <p className="font-semibold text-gray-900 dark:text-white">{preparo.grau}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Qtd. Inicial</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{preparo.quantidade_preparada} L</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Qtd. Atual</p>
            <p className="font-bold text-gray-900 dark:text-white text-lg">
              {(preparo.quantidade_preparada - historico.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0)).toFixed(1)} L
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Mariri</span>
            <span className="text-gray-700 dark:text-gray-300">{preparo.procedencia_mariri || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Chacrona</span>
            <span className="text-gray-700 dark:text-gray-300">{preparo.procedencia_chacrona || '-'}</span>
          </div>
        </div>
      </div>

      {/* Histórico de Consumo e Saídas */}
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <History className="w-4 h-4" /> Histórico de Movimentação
      </h2>

      {historico.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <p>Nenhuma movimentação registrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historico.map((item) => (
            <Link
              key={item.id}
              href={item.isSaida ? `/editar-saida/${item.realId}` : `/editar-sessao/${item.realId}`}
              className="block group"
            >
              <div className={`p-4 rounded-xl border flex justify-between items-center transition-all shadow-sm hover:shadow-md ${item.isSaida
                  ? 'bg-red-50 dark:bg-gray-800/50 border-red-100 dark:border-red-900/30 group-hover:border-red-400 dark:group-hover:border-red-500/50'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-500/50'
                }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {item.isSaida && <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">SAÍDA</span>}
                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{item.titulo}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`flex items-center justify-end gap-1 font-bold ${item.isSaida ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-300'
                    }`}>
                    <Droplets className="w-3 h-3" />
                    -{Number(item.quantidade).toFixed(1)} L
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center justify-end gap-1">
                    {item.isSaida ? (
                      <span className="italic">{item.subtitulo}</span>
                    ) : (
                      <>
                        <Users className="w-3 h-3" />
                        {item.subtitulo}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}