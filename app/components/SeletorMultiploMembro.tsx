import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, Search, X, UserPlus } from 'lucide-react'
import { MembroSimples } from './SeletorMembro'
import { supabase } from '@/lib/supabaseClient'

interface SeletorMultiploProps {
  placeholder?: string
  value: { id: number | null; nome: string }[]
  onChange: (value: { id: number | null; nome: string }[]) => void
  membros: MembroSimples[]
  onMembroAdicionado: (novoMembro: MembroSimples) => void
  max?: number
}

export function SeletorMultiploMembro({ 
  placeholder = "Busque por nome...", 
  value = [], 
  onChange, 
  membros,
  onMembroAdicionado,
  max = 2
}: SeletorMultiploProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Visitante states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newVisNome, setNewVisNome] = useState('')
  const [newVisGrau, setNewVisGrau] = useState('Sócio')
  const [newVisOrigem, setNewVisOrigem] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ignora acentos, maiúsculas e o prefixo "M." / "C." que aparece nos nomes
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const termo = normalizar(query).replace(/^(m|c)\.\s*/, '')
  const membrosFiltrados = query.length >= 3
    ? membros.filter(m => [m.nome, m.nome_exibicao].some(v => v && normalizar(v).includes(termo)))
    : [] // Só busca com 3 letras pra evitar lista gigante aberta

  const handleSelect = (membro: MembroSimples) => {
    let finalName = membro.nome_exibicao || membro.nome
    // Colocar prefixos apenas para fins visuais no campo
    if (membro.grau === 'Mestre') {
      finalName = `M. ${finalName}`
    } else if (membro.grau === 'Corpo do Conselho') {
      finalName = `C. ${finalName}`
    }

    // Verifica se já está na lista
    if (!value.find(v => v.id === membro.id)) {
        if (value.length < max) {
            onChange([...value, { id: membro.id, nome: finalName }])
        }
    }
    setQuery('')
    setIsOpen(false)
  }

  const handleRemove = (indexToRemove: number) => {
      onChange(value.filter((_, i) => i !== indexToRemove))
  }

  const handleOpenVisitanteModal = () => {
    setNewVisNome(query)
    setIsOpen(false)
    setIsModalOpen(true)
  }

  const handleSaveVisitante = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        nome: newVisNome,
        nome_exibicao: newVisNome,
        grau: newVisGrau,
        tipo_vinculo: 'Visitante',
        nucleo_origem: newVisOrigem,
        ativo: true
      }

      const { data, error } = await supabase
        .from('membros')
        .insert([payload])
        .select()
        .single()

      if (error) throw error
      
      const novoMembro = data as MembroSimples
      onMembroAdicionado(novoMembro)
      
      let finalName = novoMembro.nome_exibicao || novoMembro.nome
      if (novoMembro.grau === 'Mestre') finalName = `M. ${finalName}`
      else if (novoMembro.grau === 'Corpo do Conselho') finalName = `C. ${finalName}`

      if (value.length < max) {
          onChange([...value, { id: novoMembro.id, nome: finalName }])
      }
      
      setIsModalOpen(false)
      setNewVisNome('')
      setNewVisOrigem('')
      setQuery('')
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      toast.error("Erro ao cadastrar visitante", { description: mensagem })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="min-h-[42px] relative w-full bg-background rounded-lg border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 transition-colors flex flex-wrap items-center gap-1.5 p-1.5">
        
        {value.map((v, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-sm font-medium">
                {v.nome}
                <button type="button" onClick={() => handleRemove(idx)} className="hover:text-red-500 opacity-70 hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        ))}
        
        {value.length < max && (
            <div className="flex-1 min-w-[120px] relative flex items-center">
                <Search className="w-4 h-4 text-muted-foreground absolute left-2 pointer-events-none" />
                <input
                    type="text"
                    className="w-full bg-transparent outline-none pl-8 py-1.5 text-sm font-medium text-foreground"
                    placeholder={value.length === 0 ? placeholder : "Adicionar outro..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden flex flex-col">
          {query.length >= 3 ? (
            <>
              {membrosFiltrados.length > 0 ? (
                <ul className="py-1">
                  {membrosFiltrados.map((membro) => {
                    let previewName = membro.nome_exibicao || membro.nome
                    if (membro.grau === 'Mestre') previewName = `M. ${previewName}`
                    else if (membro.grau === 'Corpo do Conselho') previewName = `C. ${previewName}`

                    const isSelected = value.some(v => v.id === membro.id)

                    return (
                      <li
                        key={membro.id}
                        className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-accent ${isSelected ? 'bg-accent' : ''}`}
                        onClick={() => handleSelect(membro)}
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{previewName}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum membro ativo encontrado.
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Digite mais {3 - query.length} letras para buscar...
            </div>
          )}

          {/* Rodapé de Cadastro Rápido */}
          <div className="p-2 border-t border-border bg-background m-1 rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 py-2 rounded-lg font-medium transition"
              onClick={handleOpenVisitanteModal}
            >
              <UserPlus className="w-4 h-4" /> Cadastrar &ldquo;{query}&rdquo; como visitante
            </button>
          </div>
        </div>
      )}

      {/* Modal Quick Add Visitante */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border font-bold text-foreground flex justify-between items-center">
              <span>Cadastrar Visitante Rápido</span>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVisitante} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1 uppercase tracking-wider">
                  Nome do Visitante
                </label>
                <input
                  type="text"
                  required
                  value={newVisNome}
                  onChange={e => setNewVisNome(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1 uppercase tracking-wider">
                  Grau
                </label>
                <select
                  value={newVisGrau}
                  onChange={e => setNewVisGrau(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none text-sm font-medium"
                >
                  <option value="Sócio">Sócio</option>
                  <option value="Corpo Instrutivo">Corpo Instrutivo</option>
                  <option value="Corpo do Conselho">Corpo do Conselho</option>
                  <option value="Mestre">Mestre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1 uppercase tracking-wider">
                  Núcleo de Origem
                </label>
                <input
                  type="text"
                  required
                  value={newVisOrigem}
                  onChange={e => setNewVisOrigem(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none text-sm font-medium"
                  placeholder="Ex: Núcleo Sede Geral"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Visitante e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
