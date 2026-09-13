'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import { formatarNumero, rotuloMes } from '@/lib/formato'

/** Mini gráfico do saldo ao fim de cada mês. */
export function SparklineSaldo({
  serie,
  altura = 56,
  formatarRotulo = rotuloMes,
}: {
  serie: { chave: string; saldo: number }[]
  altura?: number
  formatarRotulo?: (chave: string) => string
}) {
  if (serie.length === 0) return null

  return (
    <div style={{ height: altura }} className="w-full" aria-label="Saldo nos últimos meses" role="img">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={serie} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="chave" hide />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={{
              backgroundColor: 'var(--popover)',
              color: 'var(--popover-foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 12,
            }}
            labelFormatter={chave => formatarRotulo(String(chave))}
            formatter={valor => [`${formatarNumero(Number(valor))} L`, 'Saldo']}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#sparkSaldo)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
