import React, { useState, useRef, useEffect } from 'react'
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

  const membrosFiltrados = query.length >= 3 
    ? membros.filter(m => {
        const nomeNorm = (m.nome_exibicao || m.nome).toLowerCase()
        return nomeNorm.includes(query.toLowerCase())
      })
    : [] // Só busca com 3 letras pra evitar lista gigante aberta

  const handleSelect = (membro: MembroSimples) => {
    let finalName = membro.nome_exibicao || membro.nome
    // Colocar prefixos apenas para fins visuais no campo
    if (membro.grau === 'Mestre') {
      finalName = `M. ${finalName}`
    } else if (membro.grau === 'Conselheiro') {
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
      else if (novoMembro.grau === 'Conselheiro') finalName = `C. ${finalName}`

      if (value.length < max) {
          onChange([...value, { id: novoMembro.id, nome: finalName }])
      }
      
      setIsModalOpen(false)
      setNewVisNome('')
      setNewVisOrigem('')
      setQuery('')
    } catch (error: any) {
      alert("Erro ao cadastrar visitante: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="min-h-[42px] relative w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-gold-500 transition-colors flex flex-wrap items-center gap-1.5 p-1.5">
        
        {value.map((v, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300 px-2.5 py-1 rounded-md text-sm font-medium">
                {v.nome}
                <button type="button" onClick={() => handleRemove(idx)} className="hover:text-red-500 opacity-70 hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        ))}
        
        {value.length < max && (
            <div className="flex-1 min-w-[120px] relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 pointer-events-none" />
                <input
                    type="text"
                    className="w-full bg-transparent outline-none pl-8 py-1.5 text-sm font-medium text-gray-900 dark:text-white"
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
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto overflow-x-hidden flex flex-col">
          {query.length >= 3 ? (
            <>
              {membrosFiltrados.length > 0 ? (
                <ul className="py-1">
                  {membrosFiltrados.map((membro) => {
                    let previewName = membro.nome_exibicao || membro.nome
                    if (membro.grau === 'Mestre') previewName = `M. ${previewName}`
                    else if (membro.grau === 'Conselheiro') previewName = `C. ${previewName}`

                    const isSelected = value.some(v => v.id === membro.id)

                    return (
                      <li
                        key={membro.id}
                        className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-gold-50 dark:bg-gold-900/10' : ''}`}
                        onClick={() => handleSelect(membro)}
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{previewName}</span>
                        {isSelected && <Check className="w-4 h-4 text-gold-600 dark:text-gold-400" />}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Nenhum membro ativo encontrado.
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              Digite mais {3 - query.length} letras para buscar...
            </div>
          )}

          {/* Rodapé de Cadastro Rápido */}
          <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 m-1 rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 text-sm text-gold-600 hover:text-gold-700 py-2 rounded-lg font-medium transition"
              onClick={handleOpenVisitanteModal}
            >
              <UserPlus className="w-4 h-4" /> Cadastrar "{query}" como Visitante
            </button>
          </div>
        </div>
      )}

      {/* Modal Quick Add Visitante */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-900 dark:text-white flex justify-between items-center">
              <span>Cadastrar Visitante Rápido</span>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVisitante} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Nome do Visitante
                </label>
                <input
                  type="text"
                  required
                  value={newVisNome}
                  onChange={e => setNewVisNome(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Grau
                </label>
                <select
                  value={newVisGrau}
                  onChange={e => setNewVisGrau(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 outline-none text-sm font-medium"
                >
                  <option value="Sócio">Sócio</option>
                  <option value="Corpo Instrutivo">Corpo Instrutivo</option>
                  <option value="Corpo do Conselho">Corpo do Conselho</option>
                  <option value="Mestre">Mestre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Núcleo de Origem
                </label>
                <input
                  type="text"
                  required
                  value={newVisOrigem}
                  onChange={e => setNewVisOrigem(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 outline-none text-sm font-medium"
                  placeholder="Ex: Núcleo Sede Geral"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 bg-celestial-600 hover:bg-celestial-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
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
