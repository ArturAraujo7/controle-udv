'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, UserPlus, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export type MembroSimples = {
  id: number
  nome: string
  nome_exibicao?: string | null
  grau?: string
  tipo_vinculo?: string
  nucleo_origem?: string | null
}

interface SeletorMembroProps {
  placeholder?: string
  value: { id: number | null; nome: string }
  onChange: (value: { id: number | null; nome: string }) => void
  membros: MembroSimples[]
  onMembroAdicionado: (novoMembro: MembroSimples) => void
}

export function SeletorMembro({ placeholder = "Selecione ou digite...", value, onChange, membros, onMembroAdicionado }: SeletorMembroProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Estados para o Modal de Novo Visitante
  const [newVisNome, setNewVisNome] = useState('')
  const [newVisGrau, setNewVisGrau] = useState('Sócio')
  const [newVisOrigem, setNewVisOrigem] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredMembros = membros.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    (m.nome_exibicao && m.nome_exibicao.toLowerCase().includes(search.toLowerCase())) ||
    (m.grau && m.grau.toLowerCase().includes(search.toLowerCase()))
  )

  const formatarNome = (nomeBase: string, grau?: string) => {
    if (!grau) return nomeBase
    if (grau === 'Mestre' && !nomeBase.startsWith('M. ')) return `M. ${nomeBase}`
    if (grau === 'Corpo do Conselho' && !nomeBase.startsWith('C. ')) return `C. ${nomeBase}`
    return nomeBase
  }

  const getDisplayValue = () => {
    if (value.id) {
       const m = membros.find(x => x.id === value.id)
       if (m) return formatarNome(m.nome_exibicao || m.nome, m.grau)
    }
    return value.nome || ''
  }

  const handleSelect = (m: MembroSimples) => {
    const nomeFormatado = formatarNome(m.nome_exibicao || m.nome, m.grau)
    onChange({ id: m.id, nome: nomeFormatado })
    setIsOpen(false)
    setSearch('')
  }

  const handleOpenVisitanteModal = () => {
    setNewVisNome(search || value.nome || '')
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
      const nomeFormatado = formatarNome(novoMembro.nome_exibicao || novoMembro.nome, novoMembro.grau)
      onChange({ id: novoMembro.id, nome: nomeFormatado })
      
      // Reset and close
      setIsModalOpen(false)
      setNewVisNome('')
      setNewVisOrigem('')
    } catch (error: any) {
      alert("Erro ao cadastrar visitante: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Combobox Trigger */}
      <div 
        className="flex items-center w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 cursor-text group focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className="w-full bg-transparent outline-none py-2 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 font-medium"
          placeholder={placeholder}
          value={isOpen ? search : getDisplayValue()}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true)
            setSearch(e.target.value)
            // Se o usuário digitar, atualizamos o `nome` em tempo real mas zeramos o `id`
            onChange({ id: null, nome: e.target.value }) 
          }}
        />
        <div className="p-2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && search.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl max-h-60 overflow-y-auto overflow-x-hidden flex flex-col">
          {search.length >= 3 ? (
            <>
              {filteredMembros.length > 0 ? (
                <div className="py-1">
                  {filteredMembros.map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between hover:bg-gold-50 dark:hover:bg-gray-700 transition-colors ${value.id === m.id ? 'bg-gold-100/50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{formatarNome(m.nome_exibicao || m.nome, m.grau)}</span>
                        <div className="flex gap-2 items-center text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          <span>{m.grau}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span className={m.tipo_vinculo === 'Local' ? 'text-green-600 dark:text-green-500' : 'text-purple-600 dark:text-purple-400'}>
                            {m.tipo_vinculo} {m.nucleo_origem ? `- ${m.nucleo_origem}` : ''}
                          </span>
                        </div>
                      </div>
                      {value.id === m.id && <Check className="w-4 h-4 text-gold-600 dark:text-gold-500 flex-shrink-0 ml-2" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Nenhum membro encontrado.
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
               Digite mais {3 - search.length} letras para buscar...
            </div>
          )}

          {/* Quick Add Button */}
          <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 m-1 rounded-lg">
            <button
              type="button"
              onClick={handleOpenVisitanteModal}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-celestial-600 dark:text-celestial-400 hover:text-celestial-700 dark:hover:text-celestial-300 py-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar "{search}" como Visitante
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
