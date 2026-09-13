'use client'
import { useMemo } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'
import { totalPorSessao } from '@/lib/estoque'
import { formatarNumero } from '@/lib/formato'
import type { ConsumoSessao, Sessao } from '@/lib/tipos'

/**
 * Cores vindas dos tokens do design system (ver app/globals.css):
 * séries = --chart-1..5 · grid/eixos = --border / --muted-foreground · tooltip = --popover
 */
const CORES_SERIE = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-2)', 'var(--chart-4)']

const ESTILO_TOOLTIP = {
  backgroundColor: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: '12px',
} as const

const ESTILO_EIXO = { fontSize: 11, fill: 'var(--muted-foreground)' } as const

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** Mês (0–11) direto da string ISO, sem deslocar por fuso. */
const mesDe = (iso: string) => Number(iso.slice(5, 7)) - 1

function SemDados() {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
      Sem dados no período
    </div>
  )
}

export function GraficoSessoesPorMes({ sessoes, loading }: { sessoes: Sessao[]; loading: boolean }) {
  const dados = useMemo(() => {
    const contagem = new Array(12).fill(0)
    for (const s of sessoes) contagem[mesDe(s.data_realizacao)]++
    return MESES.map((nome, i) => ({ nome, sessoes: contagem[i] }))
  }, [sessoes])

  if (loading) return <Skeleton className="h-[240px] w-full" />
  if (sessoes.length === 0) return <SemDados />

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={ESTILO_EIXO} dy={8} />
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

export function GraficoConsumoMensal({
  sessoes,
  consumos,
  loading,
}: {
  sessoes: Sessao[]
  consumos: ConsumoSessao[]
  loading: boolean
}) {
  const dados = useMemo(() => {
    const porSessao = totalPorSessao(consumos)
    const litros = new Array(12).fill(0)
    for (const s of sessoes) litros[mesDe(s.data_realizacao)] += porSessao.get(s.id) ?? 0
    return MESES.map((nome, i) => ({ nome, litros: Math.round(litros[i] * 100) / 100 }))
  }, [sessoes, consumos])

  if (loading) return <Skeleton className="h-[240px] w-full" />
  if (!dados.some(d => d.litros > 0)) return <SemDados />

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={ESTILO_EIXO} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={ESTILO_EIXO} />
          <Tooltip
            contentStyle={ESTILO_TOOLTIP}
            cursor={{ fill: 'var(--muted)' }}
            formatter={valor => [`${formatarNumero(Number(valor))} L`, 'Consumo']}
          />
          <Bar dataKey="litros" name="Consumo" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GraficoSessoesTipo({ sessoes, loading }: { sessoes: Sessao[]; loading: boolean }) {
  const dados = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const s of sessoes) mapa.set(s.tipo || 'Outro', (mapa.get(s.tipo || 'Outro') ?? 0) + 1)
    return [...mapa.entries()]
      .map(([nome, valor]) => ({ name: `${nome} (${valor})`, value: valor }))
      .sort((a, b) => b.value - a.value)
  }, [sessoes])

  if (loading) return <Skeleton className="h-[240px] w-full" />
  if (dados.length === 0) return <SemDados />

  return (
    <div className="h-[240px] w-full print:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dados} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={2} dataKey="value" stroke="none">
            {dados.map((_, i) => <Cell key={i} fill={CORES_SERIE[i % CORES_SERIE.length]} />)}
          </Pie>
          <Tooltip contentStyle={ESTILO_TOOLTIP} itemStyle={{ color: 'var(--popover-foreground)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
