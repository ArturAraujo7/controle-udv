'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LogOut, ShieldCheck, SlidersHorizontal, User, Users } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Avatar } from '@/components/comum/Avatar'
import { IconeLinha, ItemLista, ListaCard } from '@/components/comum/Lista'
import { Segmentado } from '@/components/formularios/Campos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { ehAdmin, rotuloPapel } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'

const TEMAS = [
  { valor: 'light', rotulo: 'Claro' },
  { valor: 'dark', rotulo: 'Escuro' },
  { valor: 'system', rotulo: 'Sistema' },
]

/** Avatar do header (celular): abre a folha com perfil, administração, tema e sair. */
export function BotaoConta() {
  const router = useRouter()
  const { profile, session } = useAuth()
  const { theme, setTheme } = useTheme()
  const [aberto, setAberto] = useState(false)

  const sair = async () => {
    setAberto(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nome = profile?.full_name || session?.user.email || 'Minha conta'

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Minha conta"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar nome={profile?.full_name} className="size-8" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90dvh] gap-3 overflow-y-auto rounded-t-3xl border-0 bg-background px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <span aria-hidden="true" className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25" />

        <div className="flex items-center gap-3 py-1">
          <Avatar nome={profile?.full_name} className="size-12 text-sm" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-base font-semibold">{nome}</SheetTitle>
            <SheetDescription className="truncate text-xs">
              {rotuloPapel(profile?.role)}
              {profile?.email && ` · ${profile.email}`}
            </SheetDescription>
          </div>
        </div>

        <div onClick={() => setAberto(false)} className="space-y-3">
          <ListaCard>
            <ItemLista href="/perfil" inicio={<IconeLinha><User /></IconeLinha>} titulo="Meu perfil" />
          </ListaCard>

          {ehAdmin(profile) && (
            <>
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Administração
              </p>
              <ListaCard>
                <ItemLista href="/admin/configuracoes" inicio={<IconeLinha><SlidersHorizontal /></IconeLinha>} titulo="Configurações do núcleo" />
                <ItemLista href="/admin/usuarios" inicio={<IconeLinha><Users /></IconeLinha>} titulo="Usuários" />
                <ItemLista href="/admin/auditoria" inicio={<IconeLinha><ShieldCheck /></IconeLinha>} titulo="Auditoria" />
              </ListaCard>
            </>
          )}
        </div>

        <Card className="py-3.5">
          <CardContent className="space-y-2.5">
            <p className="text-sm font-medium">Aparência</p>
            <Segmentado opcoes={TEMAS} valor={theme ?? 'system'} onChange={setTheme} rotulo="Tema" />
          </CardContent>
        </Card>

        <Button variant="outline" className="h-11 w-full text-destructive hover:text-destructive" onClick={sair}>
          <LogOut /> Sair
        </Button>
      </SheetContent>
    </Sheet>
  )
}
