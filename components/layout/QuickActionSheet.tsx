'use client'

import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'

import { useChat } from '@/components/AIChatWidget'
import { IconeLinha, ItemLista, ListaCard } from '@/components/comum/Lista'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ACOES_RAPIDAS } from './rotas'

/** Botão "+" da barra flutuante: abre a folha com os registros rápidos. */
export function BotaoRegistrar() {
  const [aberto, setAberto] = useState(false)
  const { abrir: abrirChat } = useChat()

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Registrar"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 motion-reduce:transition-none"
        >
          <Plus className="size-6" strokeWidth={2.25} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-3 rounded-t-3xl border-0 bg-background px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <span aria-hidden="true" className="mx-auto h-1.5 w-10 rounded-full bg-muted-foreground/25" />
        <SheetHeader className="flex-row items-center justify-between p-0">
          <SheetTitle className="text-xl font-semibold">Registrar</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="sm" className="text-primary">Fechar</Button>
          </SheetClose>
        </SheetHeader>
        <SheetDescription className="sr-only">Escolha o que deseja registrar.</SheetDescription>

        {/* O clique no link fecha a folha antes de navegar */}
        <div onClick={() => setAberto(false)}>
          <ListaCard>
            {ACOES_RAPIDAS.map(({ href, titulo, descricao, icon: Icone, destaque }) => (
              <ItemLista
                key={href}
                href={href}
                inicio={
                  <IconeLinha className={cn(destaque && 'bg-primary/10 text-primary')}>
                    <Icone />
                  </IconeLinha>
                }
                titulo={titulo}
                subtitulo={descricao}
              />
            ))}
          </ListaCard>
        </div>

        <ListaCard>
          <ItemLista
            onClick={() => {
              setAberto(false)
              abrirChat()
            }}
            inicio={<IconeLinha><Sparkles /></IconeLinha>}
            titulo="Perguntar ao Guardião"
            subtitulo="Assistente de IA sobre os dados do núcleo"
          />
        </ListaCard>
      </SheetContent>
    </Sheet>
  )
}
