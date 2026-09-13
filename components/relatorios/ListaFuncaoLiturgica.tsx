'use client'
import { useMemo, useState } from 'react'
import { AlertCircle, Check, Copy, Crown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Sessao } from '@/lib/tipos'
import { cn } from '@/lib/utils'

interface ListaFuncaoLiturgicaProps {
  titulo: string
  sessoes: Sessao[]
  funcaoKey: keyof Pick<Sessao, 'dirigente' | 'leitor_documentos' | 'explanador'>
  loading: boolean
}

const PREFIXO_TITULO = /^(M\.|C\.|I\.|Cons\.)\s*/i

export function ListaFuncaoLiturgica({ titulo, sessoes, funcaoKey, loading }: ListaFuncaoLiturgicaProps) {
  const [copiado, setCopiado] = useState(false)

  // Inclui sessões históricas e realizadas
  const ranking = useMemo(() => {
    const contagem = new Map<string, number>()
    // Nome de exibição: as sessões vêm da mais recente para a mais antiga, então o primeiro é o grau mais atual.
    const exibicao = new Map<string, string>()

    for (const sessao of sessoes) {
      const original = sessao[funcaoKey]
      if (!original || original.trim() === '' || original.trim() === '—') continue

      // Pode haver mais de um nome, separados por "/" ou ","
      const nomes = original.split(/[/,]/).map(n => n.trim()).filter(Boolean)
      for (const nome of nomes) {
        const chave = nome.replace(PREFIXO_TITULO, '').trim().toUpperCase()
        contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
        const atual = exibicao.get(chave) ?? ''
        if (!exibicao.has(chave) || (!PREFIXO_TITULO.test(atual) && PREFIXO_TITULO.test(nome))) {
          exibicao.set(chave, nome)
        }
      }
    }

    return [...contagem.entries()]
      .map(([chave, n]) => ({ nome: exibicao.get(chave) || chave, contagem: n }))
      .sort((a, b) => b.contagem - a.contagem)
  }, [sessoes, funcaoKey])

  const copiar = () => {
    if (ranking.length === 0) return
    const texto = `=== ${titulo} ===\n\n` +
      ranking.map((item, i) => `${i + 1}. ${item.nome} - ${item.contagem} vez(es)`).join('\n')
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden py-0 print:break-inside-avoid print:shadow-none">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-sm font-medium print:text-black">{titulo}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={copiar}
          disabled={ranking.length === 0}
          className="print:hidden"
          aria-label={`Copiar lista de ${titulo.toLowerCase()}`}
        >
          {copiado ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </div>

      <div className="max-h-[400px] flex-1 overflow-y-auto print:max-h-none print:overflow-visible">
        {ranking.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum registro no período</p>
          </div>
        ) : (
          <ul className="divide-y">
            {ranking.map((item, i) => {
              const primeiro = i === 0
              return (
                <li key={item.nome} className="flex items-center justify-between gap-3 px-4 py-3 print:break-inside-avoid">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums',
                        primeiro
                          ? 'border-primary bg-primary text-primary-foreground print:border-black print:bg-transparent print:text-black'
                          : 'text-muted-foreground print:border-gray-300'
                      )}
                    >
                      {primeiro ? <Crown className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className={cn('truncate text-sm print:text-black', primeiro && 'font-medium')}>{item.nome}</span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground print:text-black">{item.contagem}×</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
