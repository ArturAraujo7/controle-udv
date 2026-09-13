'use client'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/** Rótulo + controle + texto de ajuda. */
export function Campo({
  rotulo,
  htmlFor,
  obrigatorio,
  ajuda,
  erro,
  className,
  children,
}: {
  rotulo: string
  htmlFor?: string
  obrigatorio?: boolean
  ajuda?: React.ReactNode
  erro?: string | null
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {rotulo}
        {obrigatorio && <span className="text-destructive" aria-hidden="true">*</span>}
      </Label>
      {children}
      {erro ? (
        <p className="text-xs text-destructive" role="alert">{erro}</p>
      ) : (
        ajuda && <p className="text-xs text-muted-foreground">{ajuda}</p>
      )}
    </div>
  )
}

/** Cartão que agrupa campos relacionados. */
export function BlocoFormulario({
  titulo,
  descricao,
  acao,
  className,
  children,
}: {
  titulo?: string
  descricao?: React.ReactNode
  acao?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      {titulo && (
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          {descricao && <CardDescription>{descricao}</CardDescription>}
          {acao && <CardAction>{acao}</CardAction>}
        </CardHeader>
      )}
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

/** Interruptor com rótulo e descrição. */
export function LinhaInterruptor({
  id,
  rotulo,
  descricao,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  rotulo: string
  descricao?: string
  checked: boolean
  onCheckedChange: (valor: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="leading-snug">{rotulo}</Label>
        {descricao && <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

/** Campo numérico com a unidade à direita (ex.: litros). */
export function InputUnidade({
  unidade = 'L',
  className,
  ...props
}: React.ComponentProps<typeof Input> & { unidade?: string }) {
  return (
    <div className="relative">
      <Input type="number" inputMode="decimal" step="0.01" min="0" className={cn('h-10 pr-9 tabular-nums', className)} {...props} />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{unidade}</span>
    </div>
  )
}

/** Motivo gravado junto com a edição (aparece na auditoria). */
export function CampoMotivo({ valor, onChange }: { valor: string; onChange: (valor: string) => void }) {
  return (
    <BlocoFormulario titulo="Motivo da alteração" descricao="Opcional. Fica registrado no histórico de alterações.">
      <Textarea
        aria-label="Motivo da alteração"
        placeholder="Ex.: corrigido o número de participantes conforme a ata"
        value={valor}
        onChange={e => onChange(e.target.value)}
        rows={2}
      />
    </BlocoFormulario>
  )
}

export function SkeletonFormulario() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 md:mx-0">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}

/** Sugestões para campos de texto a partir de uma lista (ex.: núcleos conhecidos). */
export function Sugestoes({ id, opcoes }: { id: string; opcoes: string[] }) {
  return (
    <datalist id={id}>
      {opcoes.map(o => <option key={o} value={o} />)}
    </datalist>
  )
}

/** Alternância entre poucas opções (ex.: Produção local / Doação recebida). */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { valor: T; rotulo: string }[]
  valor: T
  onChange: (valor: T) => void
  rotulo: string
}) {
  return (
    <Tabs value={valor} onValueChange={v => onChange(v as T)}>
      <TabsList className="w-full" aria-label={rotulo}>
        {opcoes.map(o => (
          <TabsTrigger key={o.valor} value={o.valor} className="flex-1">{o.rotulo}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
