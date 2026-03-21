import { ReactNode } from 'react'

interface ResumoCardProps {
  titulo: string
  valor: string | number
  subtitulo: string
  icone: ReactNode
  destaque?: boolean
}

export function ResumoCard({ titulo, valor, subtitulo, icone, destaque = false }: ResumoCardProps) {
  if (destaque) {
    return (
      <div className="h-full bg-gradient-to-br from-gold-600 to-amber-700 rounded-xl p-5 text-white shadow-lg shadow-gold-900/10 relative overflow-hidden print:bg-none print:bg-white print:border print:border-gray-300 print:text-black print:shadow-none print:break-inside-avoid">
        <div className="absolute -right-4 -top-4 p-4 opacity-10 print:hidden scale-150">
          {icone}
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <p className="text-gold-50 font-semibold text-xs uppercase tracking-wider mb-2 print:text-gray-500">{titulo}</p>
          <h3 className="text-3xl font-black mb-1">{valor}</h3>
          <p className="text-gold-100 text-[10px] font-medium opacity-90 print:text-gray-400">{subtitulo}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/60 shadow-sm relative overflow-hidden print:border-gray-300 print:shadow-none print:break-inside-avoid">
      <div className="absolute right-0 top-0 p-4 opacity-5 print:hidden">
        {icone}
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <p className="text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">{titulo}</p>
        <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 print:text-black">{valor}</h3>
        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-medium mt-1">{subtitulo}</p>
      </div>
    </div>
  )
}
