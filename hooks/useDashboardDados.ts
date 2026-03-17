import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type RelatorioSessao = {
  id: number
  data_realizacao: string
  quantidade_participantes: number // 0 significa Sessão Histórica Memory
  tipo: string
  dirigente: string | null
  leitor_documentos: string | null
  explanador: string | null
}

export type RelatorioConsumo = {
  id: number
  id_sessao: number
  quantidade_consumida: number
}

export type RelatorioPreparo = {
  id: number
  data_preparo: string
  quantidade_preparada: number
  tipo_origem: string // 'proprio', 'doacao', etc
  mestre_preparo: string | null
  nucleo_origem: string | null
}

export type RelatorioSaida = {
  id: number
  data_saida: string
  quantidade: number
  destino: string
  observacao: string | null
}

export function useDashboardDados(anoSelecionado: string) {
  const [loading, setLoading] = useState(true)
  const [sessoes, setSessoes] = useState<RelatorioSessao[]>([])
  const [preparos, setPreparos] = useState<RelatorioPreparo[]>([])
  const [saidas, setSaidas] = useState<RelatorioSaida[]>([])
  const [consumos, setConsumos] = useState<RelatorioConsumo[]>([])

  // Estoque atual Independe de data (é o que tem na panela agora)
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      // Filtros de Data. 'Todos' afeta a query.
      let gteData = '2000-01-01T00:00:00'
      let lteData = '2099-12-31T23:59:59'

      if (anoSelecionado !== 'Todos') {
        gteData = `${anoSelecionado}-01-01T00:00:00`
        lteData = `${anoSelecionado}-12-31T23:59:59`
      }

      // Parallel Requests para agilizar
      const [resSessoes, resPreparos, resSaidas, globalP, globalC, globalS] = await Promise.all([
        supabase
          .from('sessoes')
          .select('id, data_realizacao, quantidade_participantes, tipo, dirigente, leitor_documentos, explanador')
          .gte('data_realizacao', gteData)
          .lte('data_realizacao', lteData)
          .order('data_realizacao', { ascending: false }),
        
        supabase
          .from('preparos')
          .select('id, data_preparo, quantidade_preparada, tipo_origem, mestre_preparo, nucleo_origem')
          .gte('data_preparo', gteData.split('T')[0])
          .lte('data_preparo', lteData.split('T')[0])
          .order('data_preparo', { ascending: false }),

        supabase
          .from('saidas')
          .select('id, data_saida, quantidade, destino, observacao')
          .gte('data_saida', gteData.split('T')[0])
          .lte('data_saida', lteData.split('T')[0])
          .order('data_saida', { ascending: false }),

        // Consultas Globais para descobrir o Estoque Real (ignora o Filtro de Ano)
        supabase.from('preparos').select('quantidade_preparada'),
        supabase.from('consumos_sessao').select('quantidade_consumida'),
        supabase.from('saidas').select('quantidade')
      ])

      const sessoesAgregadas = resSessoes.data || []
      
      // Busca consumos das sessões do PERÍODO para os gráficos (batch para evitar gargalo)
      let consumosSessoes: RelatorioConsumo[] = []
      if (sessoesAgregadas.length > 0) {
        const sessionIds = sessoesAgregadas.map(s => s.id)
        
        // Supabase limit is 1000 items in query "in". Handling if sessions > 1000
        const batchSize = 900
        for (let i = 0; i < sessionIds.length; i += batchSize) {
          const batchIds = sessionIds.slice(i, i + batchSize)
          const { data: cData } = await supabase
            .from('consumos_sessao')
            .select('id, id_sessao, quantidade_consumida')
            .in('id_sessao', batchIds)
          
          if (cData) consumosSessoes = [...consumosSessoes, ...cData]
        }
      }

      setSessoes(sessoesAgregadas)
      setPreparos(resPreparos.data || [])
      setSaidas(resSaidas.data || [])
      setConsumos(consumosSessoes)

      // Calcula Estoque Atual de forma Dinamica: (Tudo que Entrou) - (Sessoes Consumidas) - (Saídas Extras)
      const sumP = globalP.data?.reduce((acc, p) => acc + (p.quantidade_preparada || 0), 0) || 0
      const sumC = globalC.data?.reduce((acc, c) => acc + (c.quantidade_consumida || 0), 0) || 0
      const sumS = globalS.data?.reduce((acc, s) => acc + (s.quantidade || 0), 0) || 0
      
      setEstoqueAtual(sumP - sumC - sumS)

    } catch (error) {
      console.error('Erro ao buscar metadados de relatórios', error)
    } finally {
      setLoading(false)
    }
  }, [anoSelecionado])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { loading, sessoes, preparos, saidas, consumos, estoqueAtual, refetch: fetchData }
}
