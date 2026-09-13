'use client'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts'
import { RelatorioSessao } from '@/hooks/useDashboardDados'
import { useMemo } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Cores vindas dos tokens do design system (ver app/globals.css):
 * séries = --chart-1..5 · grid/eixos = --border / --muted-foreground · tooltip = --popover
 */
const CORES_SERIE = [
  'var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)',
  'var(--chart-2)', 'var(--chart-4)',
]

const ESTILO_TOOLTIP = {
  backgroundColor: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: '12px',
} as const

const ESTILO_EIXO = { fontSize: 11, fill: 'var(--muted-foreground)' } as const

export function GraficoSessoesPorMes({ sessoes, loading }: { sessoes: RelatorioSessao[], loading: boolean }) {
  const dadosGrafico = useMemo(() => {
    if (!sessoes.length) return []

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const contagemPorMes = new Array(12).fill(0)

    sessoes.forEach(sessao => {
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

  if (loading) return <Skeleton className="h-[280px] w-full" />

  return (
    <div className="h-[280px] w-full print:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={ESTILO_EIXO} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={ESTILO_EIXO} allowDecimals={false} />
          <Tooltip
            contentStyle={ESTILO_TOOLTIP}
            itemStyle={{ color: 'var(--popover-foreground)' }}
            cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Line
            type="monotone"
            dataKey="sessoes"
            name="Sessões"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--chart-1)' }}
            activeDot={{ r: 5, fill: 'var(--chart-1)' }}
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

    sessoes.forEach(sessao => {
      const tipo = sessao.tipo || 'Outro'
      mapa.set(tipo, (mapa.get(tipo) || 0) + 1)
    })

    return Array.from(mapa.entries())
      .map(([name, value]) => ({ name: `${name} (${value})`, value }))
      .sort((a, b) => b.value - a.value)
  }, [sessoes])

  if (loading) return <Skeleton className="h-[280px] w-full" />

  return (
    <div className="h-[280px] w-full print:h-[280px]">
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
              <Cell key={`cell-${index}`} fill={CORES_SERIE[index % CORES_SERIE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={ESTILO_TOOLTIP} itemStyle={{ color: 'var(--popover-foreground)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
