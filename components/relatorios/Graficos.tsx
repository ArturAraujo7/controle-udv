import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts'
import { RelatorioSessao } from '@/hooks/useDashboardDados'
import { useMemo } from 'react'

const GOLD_COLOR = '#CA8A04' // Tailwind gold-600
const BLUE_COLOR = '#0284c7' // Tailwind sky-600
const EMERALD_COLOR = '#059669' // Tailwind emerald-600
const AMBER_COLOR = '#d97706' // Tailwind amber-600

export function GraficoSessoesPorMes({ sessoes, loading }: { sessoes: RelatorioSessao[], loading: boolean }) {
  const dadosGrafico = useMemo(() => {
    if (!sessoes.length) return []
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const contagemPorMes = new Array(12).fill(0)
    
    // Contar APENAS SESSÕES REAIS
    sessoes
      .forEach(sessao => {
        const data = new Date(sessao.data_realizacao)
        const mesIndex = data.getMonth() // 0 to 11
        if (!isNaN(mesIndex)) {
            contagemPorMes[mesIndex]++
        }
      })

    return meses.map((nome, i) => ({
      nome,
      sessoes: contagemPorMes[i]
    }))
  }, [sessoes])

  if (loading) return <div className="h-[250px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>

  return (
    <div className="h-[250px] w-full print:h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="nome" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#6b7280' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#6b7280' }} 
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
            itemStyle={{ color: GOLD_COLOR }}
            cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Line 
            type="monotone" 
            dataKey="sessoes" 
            name="Sessões"
            stroke={GOLD_COLOR} 
            strokeWidth={3} 
            dot={{ r: 3, fill: GOLD_COLOR, strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 5, fill: GOLD_COLOR }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GraficoSessoesTipo({ sessoes, loading }: { sessoes: RelatorioSessao[], loading: boolean }) {
  const dadosGrafico = useMemo(() => {
    if (!sessoes.length) return []
    
    const mapa = new Map<string, number>()
    
    sessoes
      .forEach(sessao => {
        const tipo = sessao.tipo || 'Outro'
        mapa.set(tipo, (mapa.get(tipo) || 0) + 1)
      })

    return Array.from(mapa.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
  }, [sessoes])

  if (loading) return <div className="h-[250px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>

  const COLORS = [GOLD_COLOR, BLUE_COLOR, EMERALD_COLOR, AMBER_COLOR, '#64748b', '#ec4899', '#8b5cf6']

  return (
    <div className="h-[250px] w-full print:h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dadosGrafico}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {dadosGrafico.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
