'use client'
import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ehSessaoHistorica } from '@/lib/estoque'
import { formatarData } from '@/lib/formato'
import type { Sessao } from '@/lib/tipos'

interface TabelaSessoesPeriodoProps {
  sessoes: Sessao[]
  loading: boolean
  periodo: string
  nucleoNome: string
}

export function TabelaSessoesPeriodo({ sessoes, loading, periodo, nucleoNome }: TabelaSessoesPeriodoProps) {
  const tableRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `Relatorio_Sessoes_${periodo.replace(/\W+/g, '_')}`,
  })

  // Crescente no relatório
  const ordenadas = [...sessoes].sort((a, b) => a.data_realizacao.localeCompare(b.data_realizacao))
  const fallback = (valor: string | null) => (valor && valor.trim() !== '' ? valor : '—')

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  if (sessoes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma sessão registrada no período selecionado.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden py-0 print:border-none print:shadow-none">
      <div className="flex items-center justify-between gap-3 border-b p-4 print:hidden">
        <div>
          <h3 className="font-medium">Relatório de sessões</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{periodo} · {sessoes.length} sessões</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer data-slot="icon" />
          <span className="hidden sm:inline">Imprimir tabela</span>
        </Button>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div ref={tableRef} className="min-w-[800px] print:min-w-0 print:bg-white print:p-0 print:text-black">
          <div className="mb-8 hidden border-b-2 border-black pb-4 print:block">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Registro de Sessões</h1>
            <div className="mt-2 flex justify-between text-sm">
              <p>Centro Espírita Beneficente União do Vegetal — {nucleoNome}</p>
              <p className="font-bold">Período: {periodo}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dirigente</TableHead>
                <TableHead>Leitor(a) de documentos</TableHead>
                <TableHead>Explanador(a)</TableHead>
                <TableHead className="text-center">Part.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenadas.map(sessao => (
                <TableRow key={sessao.id} className="print:break-inside-avoid">
                  <TableCell className="whitespace-nowrap tabular-nums print:text-black">
                    {formatarData(sessao.data_realizacao)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="secondary" className="print:border print:border-gray-400 print:bg-transparent print:text-black">
                      {sessao.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="print:text-black">
                    <span className="font-medium">{fallback(sessao.dirigente)}</span>
                    {sessao.tipo_delegacao && (
                      <span className="mt-0.5 block text-xs text-muted-foreground print:text-black">{sessao.tipo_delegacao}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground print:text-black">{fallback(sessao.leitor_documentos)}</TableCell>
                  <TableCell className="text-muted-foreground print:text-black">{fallback(sessao.explanador)}</TableCell>
                  <TableCell className="text-center font-medium tabular-nums print:text-black">
                    {ehSessaoHistorica(sessao) ? '—' : sessao.quantidade_participantes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-8 hidden border-t border-gray-300 pt-4 text-center text-[10px] print:block">
            {periodo} — gerado em {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </Card>
  )
}
