'use client'
import { useMemo } from 'react'
import { Copy, Check, Crown, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { RelatorioSessao } from '@/hooks/useDashboardDados'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ListaFuncaoLiturgicaProps {
  titulo: string
  sessoes: RelatorioSessao[]
  funcaoKey: keyof Pick<RelatorioSessao, 'dirigente' | 'leitor_documentos' | 'explanador'>
  loading: boolean
}

export function ListaFuncaoLiturgica({ titulo, sessoes, funcaoKey, loading }: ListaFuncaoLiturgicaProps) {
  const [copied, setCopied] = useState(false)

  // Inclui as sessões históricas e reais
  const ranking = useMemo(() => {
    const sessoesSelecionadas = sessoes
    
    // Contagem de frequência
    const map = new Map<string, number>()
    // Armazena o melhor nome para exibição (o mais recente ou o que contém o grau mais alto)
    const displayMap = new Map<string, string>()
    
    sessoesSelecionadas.forEach(sessao => {
      const nomeOriginal = sessao[funcaoKey]
      // Ignora se for null, undefined, vazio ou "—" (traço)
      if (nomeOriginal && nomeOriginal.trim() !== '' && nomeOriginal.trim() !== '—') {
        // Divide o nome caso haja mais de um (separados por / ou ,)
        const nomes = nomeOriginal.split(/[/,]/).map(n => n.trim()).filter(n => n !== '')
        
        nomes.forEach(nome => {
          // Remove prefixos comuns (M., C., I., Cons., etc) ignorando case
          const nomeSemTitulo = nome.replace(/^(M\.|C\.|I\.|Cons\.)\s*/i, '').trim()
          const nomeUpper = nomeSemTitulo.toUpperCase() // case insensitive
          
          map.set(nomeUpper, (map.get(nomeUpper) || 0) + 1)
          
          // Lógica para manter o nome de exibição mais adequado:
          // Como as sessões vêm da mais recente para a mais antiga, o primeiro nome lido é sempre o grau mais atual.
          const titleRegex = /^(M\.|C\.|I\.|Cons\.)\s*/i
          const currentDisplay = displayMap.get(nomeUpper) || ''
          
          // Se não existe, ou se existe mas o gravado não tem título e a iteração atual possui título (ex: esqueceu de botar o grau na sessão atual)
          if (!displayMap.has(nomeUpper) || (!titleRegex.test(currentDisplay) && titleRegex.test(nome))) {
            displayMap.set(nomeUpper, nome)
          }
        })
      }
    })

    // Converte mapa para Array ordenado (Descendente)
    return Array.from(map.entries())
      .map(([nomeNormalized, contagem]) => ({ 
        nome: displayMap.get(nomeNormalized) || nomeNormalized, // Usa o nome com título para o ranking
        contagem 
      }))
      .sort((a, b) => b.contagem - a.contagem)
  }, [sessoes, funcaoKey])

  const handleCopy = () => {
    if (ranking.length === 0) return

    const texto = `=== Ranking: ${titulo} ===\n\n` + 
      ranking.map((item, index) => `${index + 1}. ${item.nome} - ${item.contagem} vez(es)`).join('\n')
    
    navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  return (
    <Card className="py-0 overflow-hidden flex flex-col h-full print:shadow-none print:break-inside-avoid">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium text-sm print:text-black">{titulo}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          disabled={ranking.length === 0}
          className="print:hidden"
          aria-label={`Copiar lista de ${titulo.toLowerCase()}`}
        >
          {copied ? <Check className="text-primary" /> : <Copy />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] print:max-h-none print:overflow-visible">
        {ranking.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum registro no período</p>
          </div>
        ) : (
          <ul className="divide-y">
            {ranking.map((item, index) => {
              const isFirst = index === 0
              return (
                <li
                  key={index}
                  className="flex justify-between items-center gap-3 px-4 py-3 print:break-inside-avoid"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-medium tabular-nums shrink-0 border',
                      isFirst
                        ? 'bg-primary text-primary-foreground border-primary print:bg-transparent print:text-black print:border-black'
                        : 'text-muted-foreground print:border-gray-300'
                    )}>
                      {isFirst ? <Crown className="w-3 h-3" /> : index + 1}
                    </span>
                    <span className={cn('text-sm truncate print:text-black', isFirst && 'font-medium')}>
                      {item.nome}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 print:text-black">
                    {item.contagem}×
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
