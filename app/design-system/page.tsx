'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Home, Package, CalendarDays, Users, BarChart3, Plus, Trash2,
  Loader2, MoreHorizontal, Info, Droplets, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react'

import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

/* ─── Logo antigo (cópia local só para o comparativo antes→depois) ─── */
function LegacyLogo({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id="dsGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" /><stop offset="45%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="dsSky" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" /><stop offset="50%" stopColor="#0EA5E9" /><stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <path d="M50 6 C50 6, 82 8, 88 28 C94 48, 80 72, 50 94 C20 72, 6 48, 12 28 C18 8, 50 6, 50 6 Z" fill="none" stroke="url(#dsGold)" strokeWidth="5.5" strokeLinejoin="round" />
      <path d="M50 24 C57 33, 66 44, 66 56 C66 67, 59 74, 50 74 C41 74, 34 67, 34 56 C34 44, 43 33, 50 24 Z" fill="url(#dsSky)" />
      <path d="M50 41 L51.8 48.2 L59 50 L51.8 51.8 L50 59 L48.2 51.8 L41 50 L48.2 48.2 Z" fill="#FFFFFF" opacity="0.95" />
    </svg>
  )
}

/* ─── Helpers locais da vitrine ─── */
function Section({ id, title, subtitle, children }: {
  id: string; title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-6 scroll-mt-20">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Swatch({ cls, name, hex }: { cls: string; name: string; hex?: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-14 rounded-md border ${cls}`} />
      <p className="text-xs font-medium">{name}</p>
      {hex && <p className="text-xs text-muted-foreground font-mono">{hex}</p>}
    </div>
  )
}

const VERDE = [
  ['50', '#F2F7F4', 'bg-verde-50'], ['100', '#E1EDE5', 'bg-verde-100'],
  ['200', '#C4DBCC', 'bg-verde-200'], ['300', '#9BC0A9', 'bg-verde-300'],
  ['400', '#6C9F80', 'bg-verde-400'], ['500', '#4A805F', 'bg-verde-500'],
  ['600', '#35664A', 'bg-verde-600'], ['700', '#2A523C', 'bg-verde-700'],
  ['800', '#234433', 'bg-verde-800'], ['900', '#1D382B', 'bg-verde-900'],
  ['950', '#0F211A', 'bg-verde-950'],
] as const

const STONE = [
  ['50', 'bg-stone-50'], ['100', 'bg-stone-100'], ['200', 'bg-stone-200'],
  ['300', 'bg-stone-300'], ['400', 'bg-stone-400'], ['500', 'bg-stone-500'],
  ['600', 'bg-stone-600'], ['700', 'bg-stone-700'], ['800', 'bg-stone-800'],
  ['900', 'bg-stone-900'], ['950', 'bg-stone-950'],
] as const

const SESSOES_DEMO = [
  { data: '02/08/2026', tipo: 'Escala', dirigente: 'M. Antônio Ferreira', participantes: 48, consumo: '4,8 L' },
  { data: '19/07/2026', tipo: 'Instrutiva', dirigente: 'M. Carlos Andrade', participantes: 32, consumo: '3,1 L' },
  { data: '05/07/2026', tipo: 'Escala Anual', dirigente: 'M. Antônio Ferreira', participantes: 61, consumo: '6,2 L' },
]

export default function DesignSystemPage() {
  const [salvando, setSalvando] = useState(false)

  const demoSalvar = () => {
    setSalvando(true)
    setTimeout(() => {
      setSalvando(false)
      toast.success('Preparo registrado com sucesso', {
        description: '15 litros · Mestre Antônio Ferreira',
      })
    }, 1200)
  }

  return (
    <TooltipProvider>
      <div className="bg-background min-h-screen">
        {/* Topbar da vitrine */}
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 sm:px-8 h-14">
            <div className="flex items-center gap-2.5">
              <Logo className="w-6 h-6 text-primary" />
              <span className="font-semibold tracking-tight">Guardião</span>
              <Badge variant="secondary" className="ml-1">Design System v2</Badge>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto space-y-14 pb-24">

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Proposta de identidade — Guardião v2</h1>
            <p className="text-sm text-muted-foreground max-w-prose">
              Minimalista, institucional: base neutra stone e um único acento — o verde
              mariri. Sem gradientes, sem dourado/celestial. Alterne o tema no canto
              superior direito e navegue pelas seções antes de aprovar.
            </p>
          </div>

          {/* ═══ 1. MARCA ═══ */}
          <Section id="marca" title="Marca" subtitle="Escudo (guarda) + nervura de folha (mariri/chacrona). Traço único, herda a cor do contexto.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardDescription>Antes</CardDescription></CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <LegacyLogo className="w-20 h-20" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardDescription>Depois</CardDescription></CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <Logo className="w-20 h-20 text-primary" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="flex flex-wrap items-end gap-8 pt-6">
                {[['w-4 h-4', '16px'], ['w-6 h-6', '24px'], ['w-12 h-12', '48px'], ['w-24 h-24', '96px']].map(([cls, label]) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <Logo className={`${cls} text-primary`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
                <Separator orientation="vertical" className="h-16 hidden sm:block" />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <Logo className="w-6 h-6 text-primary" />
                    <span className="text-lg font-semibold tracking-tight">Guardião</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Logo className="w-6 h-6 text-foreground" />
                    <div className="leading-tight">
                      <p className="text-lg font-semibold tracking-tight">Guardião</p>
                      <p className="text-xs text-muted-foreground">Controle &amp; Memória</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* ═══ 2. CORES ═══ */}
          <Section id="cores" title="Cores" subtitle="Rampa verde mariri, neutros stone e tokens semânticos (mudam com o tema).">
            <div className="space-y-4">
              <p className="text-sm font-medium">Verde mariri</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                {VERDE.map(([n, hex, cls]) => (
                  <Swatch key={n} cls={cls} name={n} hex={hex} />
                ))}
              </div>
              <p className="text-sm font-medium pt-2">Neutros (stone)</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                {STONE.map(([n, cls]) => (
                  <Swatch key={n} cls={cls} name={n} />
                ))}
              </div>
              <p className="text-sm font-medium pt-2">Tokens semânticos</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Swatch cls="bg-background" name="background" />
                <Swatch cls="bg-card" name="card" />
                <Swatch cls="bg-muted" name="muted" />
                <Swatch cls="bg-primary" name="primary" />
                <Swatch cls="bg-secondary" name="secondary" />
                <Swatch cls="bg-destructive" name="destructive" />
                <Swatch cls="bg-chart-3" name="chart-3" />
                <Swatch cls="bg-chart-5" name="chart-5 (terra)" />
              </div>
            </div>
          </Section>

          {/* ═══ 3. TIPOGRAFIA ═══ */}
          <Section id="tipografia" title="Tipografia" subtitle="Inter em toda a interface. Hierarquia por peso e tamanho — sem gradientes em texto.">
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <p className="text-2xl font-semibold tracking-tight">Estoque do Vegetal</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">text-2xl font-semibold tracking-tight — título de página</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Movimentações recentes</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">text-sm font-medium — label de seção</p>
                </div>
                <div>
                  <p className="text-sm">O preparo de agosto foi conduzido pelo Mestre Antônio com mariri da região e chacrona do plantio local.</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">text-sm — corpo</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight">42,5</span>
                  <span className="text-sm text-muted-foreground">litros disponíveis</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono -mt-3">tabular-nums — quantidades sempre alinham dígito a dígito</p>
              </CardContent>
            </Card>
          </Section>

          {/* ═══ 4. COMPONENTES ═══ */}
          <Section id="componentes" title="Componentes" subtitle="shadcn/ui sobre Radix — acessíveis por teclado, focus ring verde, um raio de borda único.">

            {/* Botões */}
            <Card>
              <CardHeader><CardTitle className="text-base">Botões</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button><Plus data-slot="icon" /> Nova Sessão</Button>
                <Button variant="outline">Registrar Preparo</Button>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive"><Trash2 data-slot="icon" /> Excluir</Button>
                <Button variant="link">Ver histórico</Button>
                <Button disabled><Loader2 data-slot="icon" className="animate-spin" /> Salvando…</Button>
                <Button size="sm" variant="outline">Pequeno</Button>
                <Button size="icon" variant="outline" aria-label="Mais opções"><MoreHorizontal /></Button>
              </CardContent>
            </Card>

            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formulário — Registrar preparo</CardTitle>
                <CardDescription>Labels associados, obrigatórios marcados, erro inline no lugar de alert().</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="ds-mestre">Mestre responsável <span className="text-destructive">*</span></Label>
                  <Select>
                    <SelectTrigger id="ds-mestre" className="w-full"><SelectValue placeholder="Selecione o mestre" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="antonio">M. Antônio Ferreira</SelectItem>
                      <SelectItem value="carlos">M. Carlos Andrade</SelectItem>
                      <SelectItem value="jose">M. José Ribamar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-qtd">Quantidade (litros) <span className="text-destructive">*</span></Label>
                  <Input id="ds-qtd" type="number" placeholder="0,0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-data">Data do preparo</Label>
                  <Input id="ds-data" type="date" defaultValue="2026-09-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-erro">Campo com erro</Label>
                  <Input id="ds-erro" aria-invalid defaultValue="-3" className="border-destructive focus-visible:ring-destructive/30" />
                  <p className="text-xs text-destructive">A quantidade precisa ser maior que zero.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ds-obs">Observações</Label>
                  <Textarea id="ds-obs" placeholder="Procedência do mariri, condições do preparo…" rows={2} />
                </div>
              </CardContent>
              <CardFooter className="gap-3">
                <Button onClick={demoSalvar} disabled={salvando}>
                  {salvando && <Loader2 data-slot="icon" className="animate-spin" />}
                  {salvando ? 'Salvando…' : 'Salvar preparo'}
                </Button>
                <Button variant="ghost">Cancelar</Button>
              </CardFooter>
            </Card>

            {/* Cards de stat */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Estoque atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">42,5 <span className="text-base font-normal text-muted-foreground">L</span></p>
                  <p className="text-xs text-muted-foreground mt-1">3 preparos disponíveis</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Sessões no ano</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">37</p>
                  <p className="text-xs text-muted-foreground mt-1">média de 44 participantes</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40">
                <CardHeader className="pb-2">
                  <CardDescription className="text-primary flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Card destacado</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Borda <code className="font-mono text-xs">primary/40</code> para chamar atenção sem gradiente.</p>
                </CardContent>
              </Card>
            </div>

            {/* Badges */}
            <Card>
              <CardHeader><CardTitle className="text-base">Badges de status</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2.5">
                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Disponível</Badge>
                <Badge variant="secondary">Esgotado</Badge>
                <Badge variant="outline">Doação recebida</Badge>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20" variant="outline">Saída</Badge>
                <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20" variant="outline">Em maturação</Badge>
                <Badge><ArrowDownToLine data-slot="icon" /> Entrada</Badge>
                <Badge variant="destructive"><ArrowUpFromLine data-slot="icon" /> Consumo</Badge>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card>
              <CardHeader><CardTitle className="text-base">Tabela — Sessões do período</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden sm:table-cell">Dirigente</TableHead>
                      <TableHead className="text-right">Participantes</TableHead>
                      <TableHead className="text-right">Consumo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SESSOES_DEMO.map(s => (
                      <TableRow key={s.data}>
                        <TableCell className="tabular-nums">{s.data}</TableCell>
                        <TableCell><Badge variant="secondary">{s.tipo}</Badge></TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{s.dirigente}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.participantes}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{s.consumo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Dialogs + feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Diálogos e feedback</CardTitle>
                <CardDescription>Substitutos dos 41 alert() e 5 confirm() do navegador.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild><Button variant="outline">Detalhe de sessão (Dialog)</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sessão de Escala — 02/08/2026</DialogTitle>
                      <DialogDescription>Dirigida por M. Antônio Ferreira · 48 participantes</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between rounded-md border p-3">
                        <span className="text-muted-foreground">Preparo consumido</span>
                        <span className="font-medium tabular-nums">4,8 L · Preparo de julho</span>
                      </div>
                      <div className="flex justify-between rounded-md border p-3">
                        <span className="text-muted-foreground">Explanador</span>
                        <span className="font-medium">C.C. Paulo Mendes</span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive">Excluir registro (AlertDialog)</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir este preparo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O preparo de 15 L de 10/08/2026 será removido permanentemente,
                        junto com o histórico de consumos vinculado. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => toast.success('Preparo excluído')}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" onClick={() => toast.success('Sessão registrada com sucesso')}>Toast de sucesso</Button>
                <Button variant="outline" onClick={() => toast.error('Não foi possível salvar', { description: 'Verifique a conexão e tente novamente.' })}>Toast de erro</Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="outline">Menu (Dropdown)</Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Administração</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Usuários</DropdownMenuItem>
                    <DropdownMenuItem>Auditoria</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Ajuda"><Info /></Button></TooltipTrigger>
                  <TooltipContent>Grau do preparo: força da apuração do chá.</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            {/* Tabs + Skeleton */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Tabs — filtros de período</CardTitle></CardHeader>
                <CardContent>
                  <Tabs defaultValue="2026">
                    <TabsList>
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                      <TabsTrigger value="2026">2026</TabsTrigger>
                      <TabsTrigger value="2025">2025</TabsTrigger>
                      <TabsTrigger value="2024">2024</TabsTrigger>
                    </TabsList>
                    <TabsContent value="2026" className="text-sm text-muted-foreground pt-3">
                      37 sessões · 164,2 L consumidos · 1.628 participações
                    </TabsContent>
                    <TabsContent value="todos" className="text-sm text-muted-foreground pt-3">Histórico completo desde 2024.</TabsContent>
                    <TabsContent value="2025" className="text-sm text-muted-foreground pt-3">52 sessões registradas.</TabsContent>
                    <TabsContent value="2024" className="text-sm text-muted-foreground pt-3">49 sessões registradas.</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Skeleton — carregamento</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-44" />
                  <div className="flex items-center gap-3 pt-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* ═══ 5. SHELL ═══ */}
          <Section id="shell" title="Navegação (proposta)" subtitle="Header sticky com nav no desktop; tab bar inferior no mobile (PWA). Protótipo estático — aprova a direção, não o pixel.">
            <Card className="overflow-hidden py-0">
              {/* Header desktop */}
              <div className="border-b bg-background/95">
                <div className="flex items-center justify-between px-5 h-14">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Logo className="w-5 h-5 text-primary" />
                      <span className="font-semibold tracking-tight text-sm">Guardião</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-1 text-sm">
                      <span className="px-3 py-1.5 rounded-md font-medium text-foreground bg-muted">Início</span>
                      {['Estoque', 'Sessões', 'Membros', 'Relatórios'].map(item => (
                        <span key={item} className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-default">{item}</span>
                      ))}
                    </nav>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground"><Users className="w-4 h-4" /></div>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></div>
                  </div>
                </div>
              </div>
              {/* Conteúdo fictício */}
              <div className="px-5 py-6 space-y-3 bg-background">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20" /><Skeleton className="h-20" />
                </div>
              </div>
              {/* Bottom nav mobile */}
              <div className="border-t bg-background md:hidden">
                <div className="grid grid-cols-5 text-[10px]">
                  {[
                    [Home, 'Início', true], [Package, 'Estoque', false], [CalendarDays, 'Sessões', false],
                    [Users, 'Membros', false], [BarChart3, 'Relatórios', false],
                  ].map(([Icon, label, ativo]) => {
                    const I = Icon as React.ComponentType<{ className?: string }>
                    return (
                      <div key={label as string} className={`flex flex-col items-center gap-1 py-2.5 ${ativo ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        <I className="w-5 h-5" />
                        {label as string}
                      </div>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground px-5 pb-4 md:hidden">↑ tab bar aparece só no mobile</p>
            </Card>
          </Section>

          <Separator />
          <p className="text-sm text-muted-foreground">
            Aprovado o design system, a migração começa por login → dashboard → estoque →
            sessões → nova sessão, sem tocar na lógica de dados. Ajustes de tom de verde,
            raio de borda ou tipografia são feitos aqui antes de qualquer tela.
          </p>
        </div>
      </div>
    </TooltipProvider>
  )
}
