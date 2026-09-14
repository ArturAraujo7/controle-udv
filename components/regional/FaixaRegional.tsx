'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Eye } from 'lucide-react'

import { ListaDados } from '@/components/comum/Lista'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstrutura } from '@/hooks/useEstrutura'
import { formatarNumero } from '@/lib/formato'
import type { NucleoDaRegiao } from '@/lib/regional'
import { cn } from '@/lib/utils'
import { useRegional } from './EscopoRegional'

/** Faixa azul "Visão regional · somente leitura", com a troca de escopo. */
export function FaixaRegional({ nucleo, className }: { nucleo?: NucleoDaRegiao | null; className?: string }) {
  const { dados, carregando } = useRegional()
  const [aberto, setAberto] = useState(false)

  const total = dados?.nucleos.filter(n => n.ativo).length ?? 0

  return (
    <>
      <div
        className={cn(
          'mb-4 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sky-950 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50 print:hidden',
          className
        )}
      >
        <Eye className="size-4 shrink-0 text-sky-700 dark:text-sky-300" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            {nucleo ? 'Vendo um núcleo · somente leitura' : 'Visão regional · somente leitura'}
          </p>
          {carregando ? (
            <Skeleton className="mt-1 h-4 w-40 bg-sky-100 dark:bg-sky-400/20" />
          ) : (
            <p className="truncate text-sm font-medium">
              {nucleo
                ? `${nucleo.nome}${nucleo.cidade ? ` · ${nucleo.cidade}` : ''}`
                : `${dados?.regiao?.nome ?? 'Região'} · ${total} ${total === 1 ? 'núcleo' : 'núcleos'}`}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-sky-800 hover:bg-sky-100 hover:text-sky-900 dark:text-sky-200 dark:hover:bg-sky-400/15"
          onClick={() => setAberto(true)}
          disabled={carregando}
        >
          Trocar <ChevronDown />
        </Button>
      </div>

      <EscopoSheet aberto={aberto} onAbertoChange={setAberto} nucleoAtual={nucleo?.id ?? null} />
    </>
  )
}

/** Folha "Ver dados de": região inteira ou um núcleo. */
function EscopoSheet({
  aberto,
  onAbertoChange,
  nucleoAtual,
}: {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  nucleoAtual: number | null
}) {
  const router = useRouter()
  const { dados, resumo, podeTrocarRegiao, trocarRegiao } = useRegional()
  const estrutura = useEstrutura()

  const escolher = (valor: string) => {
    onAbertoChange(false)
    router.push(valor === 'todos' ? '/regional' : `/regional/nucleos/${valor}`)
  }

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] gap-3 overflow-y-auto rounded-t-3xl border-0 bg-background px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:mx-auto md:max-w-lg"
      >
        <span aria-hidden="true" className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
        <SheetHeader className="flex-row items-center justify-between p-0">
          <SheetTitle className="text-xl font-semibold">Ver dados de</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="sm" className="text-primary">Fechar</Button>
          </SheetClose>
        </SheetHeader>
        <SheetDescription className="sr-only">Escolha a região inteira ou um núcleo.</SheetDescription>

        {podeTrocarRegiao ? (
          <Select
            value={dados?.regiao ? String(dados.regiao.id) : ''}
            onValueChange={v => { trocarRegiao(Number(v)); onAbertoChange(false); router.push('/regional') }}
          >
            <SelectTrigger className="h-11 w-full bg-card" aria-label="Região"><SelectValue placeholder="Escolha a região" /></SelectTrigger>
            <SelectContent>
              {estrutura.regioes.map(r => <SelectItem key={r.id} value={String(r.id)}>Região: {r.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <ListaDados itens={[{ rotulo: 'Sua região', valor: dados?.regiao?.nome ?? '—' }]} />
        )}

        <RadioGroup
          value={nucleoAtual ? String(nucleoAtual) : 'todos'}
          onValueChange={escolher}
          className="gap-0 divide-y overflow-hidden rounded-xl border bg-card"
          aria-label="Escopo"
        >
          <label htmlFor="escopo-todos" className="flex cursor-pointer items-center gap-3 px-4 py-3 has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem id="escopo-todos" value="todos" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Todos os núcleos</span>
              <span className="block text-xs text-muted-foreground">Totais e comparativos da região</span>
            </span>
            {resumo && <span className="text-sm font-semibold tabular-nums">{formatarNumero(resumo.estoque)} L</span>}
          </label>
          {resumo?.resumos.map(r => (
            <label
              key={r.nucleo.id}
              htmlFor={`escopo-${r.nucleo.id}`}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem id={`escopo-${r.nucleo.id}`} value={String(r.nucleo.id)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.nucleo.nome}</span>
                <span className="block text-xs text-muted-foreground">{r.nucleo.cidade || 'Cidade não informada'}</span>
              </span>
              <span className={cn('text-sm font-semibold tabular-nums', r.abaixoMinimo && 'text-amber-600 dark:text-amber-400')}>
                {formatarNumero(r.estoque)} L
              </span>
            </label>
          ))}
        </RadioGroup>

        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-100">
          Somente leitura: você vê tudo da região, mas não registra nem edita.
        </p>
      </SheetContent>
    </Sheet>
  )
}
