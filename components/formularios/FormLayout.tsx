'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { podeEditar } from '@/lib/permissoes'

export type AcaoEnvio = 'salvar' | 'outro'

/**
 * Casca dos formulários: topo com "‹ voltar" e título, e botão de salvar fixo
 * no rodapé no celular (a barra de abas fica oculta nessas rotas).
 */
export function FormLayout({
  voltar,
  titulo,
  acaoTopo,
  onSubmit,
  salvando,
  desabilitado,
  rotuloSalvar,
  rotuloOutro,
  children,
}: {
  voltar: { href: string; rotulo: string }
  titulo: string
  acaoTopo?: React.ReactNode
  /** Recebe 'outro' quando o envio veio do botão secundário ("Salvar e registrar outro"). */
  onSubmit: (acao: AcaoEnvio) => void
  salvando?: boolean
  desabilitado?: boolean
  rotuloSalvar: string
  rotuloOutro?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { profile } = useAuth()

  // Quem só tem leitura não usa formulários (o banco também bloqueia a gravação).
  useEffect(() => {
    if (profile && !podeEditar(profile)) {
      toast.error('Seu acesso permite apenas visualizar os dados')
      router.replace('/')
    }
  }, [profile, router])

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const botao = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    onSubmit(botao?.value === 'outro' ? 'outro' : 'salvar')
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-2xl md:mx-0">
      <div className="sticky top-0 z-30 -mx-4 -mt-6 mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b bg-background/90 px-4 py-2.5 backdrop-blur md:static md:mx-0 md:mt-0 md:flex md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <Link
          href={voltar.href}
          className="inline-flex items-center gap-0.5 justify-self-start rounded-md py-1 pr-1 text-sm font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="size-4" />
          {voltar.rotulo}
        </Link>
        <h1 className="text-base font-semibold md:ml-2 md:text-2xl md:tracking-tight">{titulo}</h1>
        <div className="justify-self-end md:ml-auto">{acaoTopo}</div>
      </div>

      <div className="space-y-5 pb-36 md:pb-0">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5 md:mx-0 md:flex-row md:items-center md:gap-3">
          <Button
            type="submit"
            value="salvar"
            disabled={salvando || desabilitado}
            className="h-11 w-full text-[15px] md:h-9 md:w-auto md:px-4 md:text-sm"
          >
            {salvando && <Loader2 className="animate-spin" />}
            {salvando ? 'Salvando…' : rotuloSalvar}
          </Button>
          {rotuloOutro && (
            <Button
              type="submit"
              value="outro"
              variant="ghost"
              disabled={salvando || desabilitado}
              className="h-9 text-primary md:text-foreground"
            >
              {rotuloOutro}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
