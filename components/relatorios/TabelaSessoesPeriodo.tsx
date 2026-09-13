'use client'
import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { RelatorioSessao } from '@/hooks/useDashboardDados'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatarData } from '@/lib/formato'

interface TabelaSessoesPeriodoProps {
  sessoes: RelatorioSessao[]
  loading: boolean
  anoSelecionado: string
}

export function TabelaSessoesPeriodo({ sessoes, loading, anoSelecionado }: TabelaSessoesPeriodoProps) {
  const tableRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    documentTitle: `Relatorio_Sessoes_${anoSelecionado}`,
  })

  // Ordenar crescente para o relatório
  const sessoesOrdenadas = [...sessoes].sort(
    (a, b) => new Date(a.data_realizacao).getTime() - new Date(b.data_realizacao).getTime()
  )

  const fallback = (val: string | null) => (val && val.trim() !== '') ? val : '—'

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
    <Card className="py-0 overflow-hidden print:border-none print:shadow-none">
      <div className="flex items-center justify-between gap-3 p-4 border-b print:hidden">
        <div>
          <h3 className="font-medium">Relatório de sessões</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{anoSelecionado}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer data-slot="icon" />
          <span className="hidden sm:inline">Exportar tabela</span>
        </Button>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <div ref={tableRef} className="print:p-0 print:bg-white print:text-black min-w-[800px] print:min-w-0">
          {/* Cabeçalho exclusivo de impressão */}
          <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Registro de Sessões</h1>
            <div className="flex justify-between text-sm mt-2">
              <p>Centro Espírita Beneficente União do Vegetal — Núcleo Jardim Real</p>
              <p className="font-bold">Período: {anoSelecionado}</p>
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
              {sessoesOrdenadas.map((sessao) => (
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
                      <span className="block text-xs text-muted-foreground mt-0.5 print:text-black">
                        {sessao.tipo_delegacao}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground print:text-black">
                    {fallback(sessao.leitor_documentos)}
                  </TableCell>
                  <TableCell className="text-muted-foreground print:text-black">
                    {fallback(sessao.explanador)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums font-medium print:text-black">
                    {sessao.quantidade_participantes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Rodapé exclusivo de impressão */}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-[10px] text-center">
            {anoSelecionado} — gerado em {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </Card>
  )
}
