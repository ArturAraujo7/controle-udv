'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send, Sparkles, User as UserIcon, X } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'model'
  text: string
}

type ChatContexto = { abrir: () => void; fechar: () => void }

const ChatContext = createContext<ChatContexto>({ abrir: () => {}, fechar: () => {} })

/** Abre o assistente de qualquer lugar (ex.: folha do botão "+"). */
export const useChat = () => useContext(ChatContext)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const valor = useMemo(() => ({ abrir: () => setAberto(true), fechar: () => setAberto(false) }), [])

  return (
    <ChatContext.Provider value={valor}>
      {children}
      <AIChatWidget aberto={aberto} onAbertoChange={setAberto} />
    </ChatContext.Provider>
  )
}

const BOAS_VINDAS: Message = {
  role: 'model',
  text: 'Olá! Sou o assistente do Guardião. Pergunte sobre sessões, preparos, estoque e atividades do núcleo.',
}

function AIChatWidget({ aberto, onAbertoChange }: { aberto: boolean; onAbertoChange: (aberto: boolean) => void }) {
  const { session, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([BOAS_VINDAS])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Rolagem automática para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aberto])

  // Esc fecha
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onAbertoChange(false) }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, onAbertoChange])

  const atualizarUltima = (text: string) => {
    setMessages(prev => [...prev.slice(0, -1), { role: 'model', text }])
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !session) return

    const newMessages: Message[] = [...messages, { role: 'user', text: inputValue.trim() }]

    // Mensagem vazia que será preenchida via stream
    setMessages([...newMessages, { role: 'model', text: '' }])
    setInputValue('')
    setIsLoading(true)

    try {
      // Últimas 10 mensagens, para não estourar o contexto do prompt
      const historicMessages = newMessages.slice(-10).map(m => ({ role: m.role, text: m.text }))

      const response = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: historicMessages }),
      })

      if (!response.ok) throw new Error('Erro na requisição')
      if (!response.body) throw new Error('Nenhum body retornado')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        streamText += decoder.decode(value, { stream: true })
        atualizarUltima(streamText)
      }
    } catch (error) {
      console.error('Chat Error:', error)
      atualizarUltima('Houve um problema ao conectar com a IA. Tente novamente mais tarde.')
    } finally {
      setIsLoading(false)
    }
  }

  // O assistente responde sobre os dados do núcleo; o Mestre Central não pertence a um.
  if (!session || profile?.role === 'central') return null

  const esperandoStream = isLoading && messages[messages.length - 1]?.text === ''

  return (
    <>
      {aberto && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in dark:bg-black/60"
            onClick={() => onAbertoChange(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="Assistente do Guardião"
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 flex h-[72dvh] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[520px] sm:w-[380px]"
          >
            <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                <Bot className="size-5" />
                <div>
                  <h3 className="text-sm font-medium leading-tight">Assistente do Guardião</h3>
                  <p className="text-[10px] opacity-80">Responde com base nos dados do núcleo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAbertoChange(false)}
                className="rounded-full p-1 transition-colors hover:bg-white/20"
                aria-label="Fechar assistente"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-background p-4">
              {messages.map((msg, idx) => {
                if (msg.role === 'model' && msg.text === '' && idx === messages.length - 1) return null
                const isUser = msg.role === 'user'
                return (
                  <div key={idx} className={cn('flex max-w-[85%] gap-3', isUser && 'ml-auto flex-row-reverse')}>
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isUser ? <UserIcon className="size-4" /> : <Bot className="size-4" />}
                    </div>
                    <div
                      className={cn(
                        'whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm',
                        isUser
                          ? 'rounded-tr-none bg-primary text-primary-foreground'
                          : 'rounded-tl-none border bg-card text-card-foreground'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })}

              {esperandoStream && (
                <div className="flex max-w-[85%] gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-none border bg-card px-4 py-3 shadow-sm">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t bg-card p-3">
              <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 transition-shadow focus-within:ring-3 focus-within:ring-ring/50">
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Pergunte algo ao assistente…"
                  aria-label="Mensagem para o assistente"
                  className="max-h-32 min-h-10 w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  size="icon-lg"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Enviar"
                >
                  <Send />
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                A inteligência artificial pode cometer erros.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Desktop: botão flutuante. No celular o assistente abre pela folha do "+". */}
      {!aberto && (
        <button
          type="button"
          onClick={() => onAbertoChange(true)}
          className="fixed right-6 bottom-6 z-40 hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 md:flex print:hidden"
        >
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Pergunte ao Guardião</span>
        </button>
      )}
    </>
  )
}
