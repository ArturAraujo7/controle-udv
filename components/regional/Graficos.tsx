'use client'

import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const CORES = ['var(--chart-1)', 'var(--chart-5)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-4)']

/** Cor fixa de cada núcleo (pela posição na lista da região). */
export function corDoNucleo(indice: number) {
  return CORES[((indice % CORES.length) + CORES.length) % CORES.length]
}

const ESTILO_TOOLTIP = {
  backgroundColor: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: 12,
} as const

const ESTILO_EIXO = { fontSize: 11, fill: 'var(--muted-foreground)' } as const

/** "2026-09" → "set" */
export function rotuloMesCurto(chave: string) {
  const [ano, mes] = chave.split('-').map(Number)
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

/** Uma linha por núcleo ao longo dos meses. */
export function GraficoLinhasNucleos({
  meses,
  series,
  formatarValor,
  altura = 220,
}: {
  meses: string[]
  series: { nome: string; indice: number; valores: number[] }[]
  formatarValor: (valor: number) => string
  altura?: number
}) {
  const linhas = meses.map((chave, i) => ({
    mes: rotuloMesCurto(chave),
    ...Object.fromEntries(series.map(s => [s.nome, s.valores[i] ?? 0])),
  }))

  return (
    <div style={{ height: altura }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={linhas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={ESTILO_EIXO} />
          <YAxis axisLine={false} tickLine={false} tick={ESTILO_EIXO} />
          <Tooltip contentStyle={ESTILO_TOOLTIP} formatter={valor => formatarValor(Number(valor))} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          {series.map(s => (
            <Line key={s.nome} type="monotone" dataKey={s.nome} stroke={corDoNucleo(s.indice)} strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Barras empilhadas por núcleo, mês a mês. */
export function GraficoBarrasNucleos({
  meses,
  series,
  formatarValor,
  altura = 220,
}: {
  meses: string[]
  series: { nome: string; indice: number; valores: number[] }[]
  formatarValor: (valor: number) => string
  altura?: number
}) {
  const linhas = meses.map((chave, i) => ({
    mes: rotuloMesCurto(chave),
    ...Object.fromEntries(series.map(s => [s.nome, s.valores[i] ?? 0])),
  }))

  return (
    <div style={{ height: altura }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={linhas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={ESTILO_EIXO} />
          <YAxis axisLine={false} tickLine={false} tick={ESTILO_EIXO} allowDecimals={false} />
          <Tooltip contentStyle={ESTILO_TOOLTIP} cursor={{ fill: 'var(--muted)' }} formatter={valor => formatarValor(Number(valor))} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Bar
              key={s.nome}
              dataKey={s.nome}
              stackId="nucleos"
              fill={corDoNucleo(s.indice)}
              radius={i === series.length - 1 ? [3, 3, 0, 0] : undefined}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Uma barra por núcleo (ex.: consumo por pessoa). */
export function GraficoComparativo({
  dados,
  formatarValor,
  altura = 220,
}: {
  dados: { nome: string; valor: number }[]
  formatarValor: (valor: number) => string
  altura?: number
}) {
  return (
    <div style={{ height: altura }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={ESTILO_EIXO} />
          <YAxis type="category" dataKey="nome" width={110} axisLine={false} tickLine={false} tick={ESTILO_EIXO} />
          <Tooltip contentStyle={ESTILO_TOOLTIP} cursor={{ fill: 'var(--muted)' }} formatter={valor => formatarValor(Number(valor))} />
          <Bar dataKey="valor" name="Valor" fill="var(--chart-1)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Últimos 12 meses (inclui o atual) ou os 12 meses de um ano, em "YYYY-MM". */
export function mesesDoPeriodo(agora: Date, ano?: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = ano ? new Date(ano, i, 1) : new Date(agora.getFullYear(), agora.getMonth() - 11 + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
