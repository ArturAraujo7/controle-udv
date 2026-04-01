'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

type Message = {
  role: 'user' | 'model'
  text: string
}

export function AIChatWidget() {
  const { session } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o Assistente de Inteligência Artificial do Guardião. Você pode me perguntar informações sobre as sessões, preparos e atividades do Núcleo. Como posso ajudar?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Rolagem automática para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || !session) return

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', text: inputValue.trim() }
    ]

    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)

    // Adiciona uma mensagem vazia que será preenchida via stream
    setMessages((prev) => [...prev, { role: 'model', text: '' }])

    try {
      // Pega as últimas 10 mensagens (para não estourar contexto do prompt)
      const historicMessages = newMessages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }))

      const response = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: historicMessages })
      })

      if (!response.ok) {
        throw new Error('Erro na requisição')
      }

      if (!response.body) {
        throw new Error('Nenhum body retornado')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        streamText += chunk

        // Atualiza a última mensagem dinamicamente (efeito de digitação real)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1].text = streamText
          return updated
        })
      }
    } catch (error) {
      console.error('Chat Error:', error)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1].text = 'Houve um problema ao conectar com a IA. Tente novamente mais tarde.'
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Se não estiver logado, não renderiza o chat widget
  if (!session) return null

  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed z-50 flex flex-col items-end transition-all pb-safe-bottom
          ${isOpen ? 'bottom-20 right-4 sm:bottom-24 sm:right-6' : 'bottom-6 right-6'}
        `}>
        
        {/* Chat Window */}
        <div
          className={`flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 
            shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right
            ${isOpen ? 'scale-100 opacity-100 w-[calc(100vw-2rem)] h-[65vh] sm:w-[380px] sm:h-[500px] rounded-2xl border' : 'scale-0 opacity-0 w-0 h-0'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-celestial-600 to-celestial-700 dark:from-celestial-800 dark:to-celestial-900 text-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-celestial-100" />
              <div>
                <h3 className="font-bold text-sm leading-tight">Assistente do Núcleo</h3>
                <p className="text-[10px] text-celestial-200">Alimentado por IA</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
            {messages.map((msg, idx) => {
              if (msg.role === 'model' && msg.text === '' && isLoading && idx === messages.length - 1) return null;
              
              const isUser = msg.role === 'user'
              return (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${isUser ? 'bg-gold-500 text-white' : 'bg-celestial-100 dark:bg-celestial-900/40 text-celestial-600 dark:text-celestial-400'}`}>
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-gold-500 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            
            {/* Indicador de carregando antes da stream começar */}
            {isLoading && messages[messages.length - 1].text === '' && (
               <div className="flex gap-3 max-w-[85%]">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-celestial-100 dark:bg-celestial-900/40 flex items-center justify-center text-celestial-600 dark:text-celestial-400">
                   <Bot className="w-4 h-4" />
                 </div>
                 <div className="px-4 py-3 rounded-2xl text-sm shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-tl-none flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                   <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-950 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 focus-within:ring-2 focus-within:ring-celestial-500/50 transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Pergunte algo ao Assistente..."
                className="w-full max-h-32 min-h-[40px] bg-transparent text-sm text-gray-900 dark:text-gray-100 resize-none outline-none py-2.5 px-3"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0 p-2.5 bg-celestial-600 dark:bg-celestial-700 text-white rounded-lg hover:bg-celestial-700 dark:hover:bg-celestial-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2">
              A inteligência artificial pode cometer erros.
            </p>
          </div>
        </div>

      </div>

      {/* Floating Button (Only visible on Desktop or when closed on mobile) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-celestial-600 hover:bg-celestial-700 dark:bg-celestial-700 dark:hover:bg-celestial-600 text-white px-5 py-3 rounded-full shadow-xl shadow-celestial-900/20 active:scale-95 transition-all group flex items-center justify-center gap-2 border-2 border-white/20"
          title="Falar com Assistente IA"
        >
          <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm">Pergunte ao Guardião</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </button>
      )}
    </>
  )
}
