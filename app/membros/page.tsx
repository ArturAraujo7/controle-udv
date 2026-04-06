'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Plus, Search, User, X, Briefcase, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

export type Membro = {
  id: number
  nome: string
  grau: string
  tipo_vinculo: 'Local' | 'Visitante'
  nucleo_origem: string | null
  ativo: boolean
  user_id?: string
}

export default function GestaoMembros() {
  const router = useRouter()
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    grau: 'Sócio',
    tipo_vinculo: 'Local' as 'Local' | 'Visitante',
    nucleo_origem: '',
    ativo: true,
  })

  // Fetch Membros
  const fetchMembros = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('nome', { ascending: true })
    
    if (data) {
      setMembros(data)
    } else {
      console.error('Erro ao buscar membros:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembros()
  }, [])

  // Handlers
  const handleOpenModal = (membro?: Membro) => {
    if (membro) {
      setEditingMembro(membro)
      setFormData({
        nome: membro.nome,
        grau: membro.grau || 'Sócio',
        tipo_vinculo: membro.tipo_vinculo,
        nucleo_origem: membro.nucleo_origem || '',
        ativo: membro.ativo,
      })
    } else {
      setEditingMembro(null)
      setFormData({
        nome: '',
        grau: 'Sócio',
        tipo_vinculo: 'Local',
        nucleo_origem: '',
        ativo: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMembro(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        nome: formData.nome,
        grau: formData.grau,
        tipo_vinculo: formData.tipo_vinculo,
        nucleo_origem: formData.tipo_vinculo === 'Visitante' ? formData.nucleo_origem : null,
        ativo: formData.ativo,
      }

      if (editingMembro) {
        const { error } = await supabase
          .from('membros')
          .update(payload)
          .eq('id', editingMembro.id)

        if (error) throw error
        alert('Cadastro atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('membros')
          .insert([payload])

        if (error) throw error
        alert('Membro cadastrado com sucesso!')
      }
      
      handleCloseModal()
      fetchMembros()
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMembros = membros.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.grau && m.grau.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const graus = ['Sócio', 'Corpo Instrutivo', 'Corpo do Conselho', 'Mestre']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold">Gestão de Membros</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Cadastro
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all text-gray-900 dark:text-white"
              placeholder="Buscar membro por nome ou grau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium animate-pulse">
            Carregando membros...
          </div>
        ) : filteredMembros.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhum membro encontrado. Cadastre o primeiro!
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredMembros.map((membro) => (
              <div key={membro.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${membro.tipo_vinculo === 'Local' ? 'bg-celestial-100 text-celestial-600 dark:bg-celestial-900/30 dark:text-celestial-500' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                      {membro.nome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {membro.grau || 'Sócio'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                        membro.tipo_vinculo === 'Local' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {membro.tipo_vinculo}
                      </span>
                      {membro.tipo_vinculo === 'Visitante' && membro.nucleo_origem && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 hidden sm:block"></span>
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5 truncate max-w-[120px] sm:max-w-[200px]">
                            <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{membro.nucleo_origem}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pl-2 flex-shrink-0">
                  <button 
                    onClick={() => handleOpenModal(membro)}
                    className="text-gold-600 hover:text-gold-700 dark:text-gold-500 dark:hover:text-gold-400 text-xs sm:text-sm font-bold tracking-wide px-3 sm:px-4 py-2 bg-gold-50 dark:bg-gold-900/20 active:bg-gold-100 dark:active:bg-gold-900/40 rounded-xl transition-all"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Slide-over (simplified for mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in sm:zoom-in-95 slide-in-from-bottom duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingMembro ? 'Editar Membro' : 'Registrar Novo Cadastro'}
              </h2>
              <button type="button" onClick={handleCloseModal} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo Vinculo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vínculo
                    </label>
                    <select
                      value={formData.tipo_vinculo}
                      onChange={e => setFormData({ ...formData, tipo_vinculo: e.target.value as 'Local' | 'Visitante', nucleo_origem: e.target.value === 'Local' ? '' : formData.nucleo_origem })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 outline-none"
                    >
                      <option value="Local">Local</option>
                      <option value="Visitante">Visitante</option>
                    </select>
                  </div>

                  {/* Grau */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Grau Institucional
                    </label>
                    <select
                      value={formData.grau}
                      onChange={e => setFormData({ ...formData, grau: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 outline-none"
                    >
                      {graus.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nucleo de Origem (condicional) */}
                {formData.tipo_vinculo === 'Visitante' && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Núcleo de Origem
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nucleo_origem}
                      onChange={e => setFormData({ ...formData, nucleo_origem: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-gold-500/50 outline-none transition"
                      placeholder="Ex: Sede Geral"
                    />
                  </div>
                )}
                
                {/* Status Ativo (apenas edição) */}
                {editingMembro && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-4 h-4 text-gold-600 rounded bg-gray-100 border-gray-300 focus:ring-gold-500"
                    />
                    <label htmlFor="ativo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cadastro Ativo no Sistema
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingMembro ? 'Salvar Alterações' : 'Cadastrar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
