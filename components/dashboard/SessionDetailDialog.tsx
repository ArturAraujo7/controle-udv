'use client'

import Link from 'next/link'
import { BookOpen, Droplets, Mic, User } from 'lucide-react'

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarLitros } from '@/lib/formato'

export type SessaoDetalhe = {
  id: number
  data_realizacao: string
  tipo: string
  dirigente: string
  quantidade_participantes: number
  user_id?: string
  explanador?: string
  leitor_documentos?: string
}

export type ConsumoDetalhado = {
  id: number
  quantidade_consumida: number
  preparos: {
    data_preparo: string
    mestre_preparo: string
    grau: string
  }
}

function Pessoa({ icone: Icone, papel, nome }: { icone: typeof User; papel: string; nome?: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Icone className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{papel}</p>
        <p className="text-sm font-medium truncate">{nome || '—'}</p>
      </div>
    </div>
  )
}

export function SessionDetailDialog({
  sessao,
  consumos,
  loading,
  registradoPor,
  onOpenChange,
}: {
  sessao: SessaoDetalhe | null
  consumos: ConsumoDetalhado[]
  loading: boolean
  /** Nome de quem registrou a sessão, quando conhecido. */
  registradoPor?: string
  onOpenChange: (aberto: boolean) => void
}) {
  if (!sessao) return null

  const ehHistorica = sessao.quantidade_participantes === 0

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sessao.tipo} ·{' '}
            {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </DialogTitle>
          <DialogDescription>
            {ehHistorica
              ? 'Registro histórico — sem participantes ou consumo.'
              : `${sessao.quantidade_participantes} participantes`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Pessoa icone={User} papel="Dirigente" nome={sessao.dirigente} />
            <div className="grid grid-cols-2 gap-3">
              <Pessoa icone={BookOpen} papel="Leitor" nome={sessao.leitor_documentos} />
              <Pessoa icone={Mic} papel="Explanação" nome={sessao.explanador} />
            </div>
          </div>

          {ehHistorica ? (
            <div className="rounded-md border border-dashed p-5 text-center">
              <BookOpen className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Memória institucional</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sessão histórica registrada sem dados quantitativos de participação ou consumo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" /> O que foi servido
              </h3>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : consumos.length > 0 ? (
                consumos.map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.preparos?.mestre_preparo || 'Mestre não informado'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.preparos?.data_preparo
                          ? new Date(item.preparos.data_preparo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                          : '—'}{' '}
                        · {item.preparos?.grau || '—'}
                      </p>
                    </div>
                    <span className="text-base font-semibold tabular-nums shrink-0 ml-3">
                      {formatarLitros(item.quantidade_consumida)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Nenhum consumo registrado nesta sessão.
                </p>
              )}
            </div>
          )}

          <div>
            <Button variant="outline" asChild className="w-full">
              <Link href={ehHistorica ? `/editar-sessao-historica/${sessao.id}` : `/editar-sessao/${sessao.id}`}>
                Editar dados da sessão
              </Link>
            </Button>
            {registradoPor && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Registrado por {registradoPor}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
