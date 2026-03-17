import { useMemo } from 'react'
import { Copy, Check, Crown, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { RelatorioSessao } from '@/hooks/useDashboardDados'

interface ListaFuncaoLiturgicaProps {
  titulo: string
  sessoes: RelatorioSessao[]
  funcaoKey: keyof Pick<RelatorioSessao, 'dirigente' | 'leitor_documentos' | 'explanador'>
  loading: boolean
}

export function ListaFuncaoLiturgica({ titulo, sessoes, funcaoKey, loading }: ListaFuncaoLiturgicaProps) {
  const [copied, setCopied] = useState(false)

  // Extrai as sessões REAIS (com participantes)
  const ranking = useMemo(() => {
    const sessoesReais = sessoes.filter(s => s.quantidade_participantes > 0)
    
    // Contagem de frequência
    const map = new Map<string, number>()
    
    sessoesReais.forEach(sessao => {
      const nomeOriginal = sessao[funcaoKey]
      // Ignora se for null, undefined, vazio ou "—" (traço)
      if (nomeOriginal && nomeOriginal.trim() !== '' && nomeOriginal.trim() !== '—') {
        const nomeUpper = nomeOriginal.trim().toUpperCase() // case insensitive
        map.set(nomeUpper, (map.get(nomeUpper) || 0) + 1)
      }
    })

    // Converte mapa para Array ordenado (Descendente)
    return Array.from(map.entries())
      .map(([nome, contagem]) => ({ nome, contagem }))
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
    return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-sm overflow-hidden flex flex-col h-full print:border-gray-300 print:shadow-none print:break-inside-avoid">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 print:bg-white px-5">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm print:text-black uppercase tracking-wider">{titulo}</h3>
        <button
          onClick={handleCopy}
          disabled={ranking.length === 0}
          className="text-gray-400 hover:text-celestial-600 dark:hover:text-celestial-400 transition-colors disabled:opacity-30 print:hidden outline-none focus:ring-2 focus:ring-celestial-500/50 rounded-md p-1"
          title="Copiar lista"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-0 flex-1 overflow-y-auto max-h-[400px] print:max-h-none print:overflow-visible">
        {ranking.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-70">
            <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-xs">Nenhum registro no período</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50 print:divide-gray-200">
            {ranking.map((item, index) => {
              const isFirst = index === 0
              return (
                <li 
                  key={index} 
                  className={`flex justify-between items-center px-5 py-3 ${isFirst ? 'bg-gold-50/30 dark:bg-gold-900/10' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Badge da posição */}
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shadow-sm border ${
                      isFirst 
                        ? 'bg-gradient-to-b from-gold-400 to-gold-600 text-white border-gold-500 shadow-gold-500/20 print:border-black print:text-black print:bg-transparent' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 print:border-gray-300'
                    }`}>
                      {isFirst ? <Crown className="w-3 h-3" /> : index + 1}
                    </span>
                    
                    <span className={`text-sm ${isFirst ? 'font-bold text-gold-700 dark:text-gold-400' : 'font-medium text-gray-700 dark:text-gray-300'} print:text-black`}>
                      {item.nome}
                    </span>
                  </div>
                  
                  <div className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded border ${
                    isFirst 
                      ? 'bg-gold-100/50 text-gold-700 border-gold-200/50 dark:bg-gold-900/20 dark:text-gold-400 dark:border-gold-800/30 print:border-gray-300 print:text-black' 
                      : 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50 print:border-gray-300 print:text-black'
                  }`}>
                    {item.contagem}x
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
