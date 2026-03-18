'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, BookOpen, Mic, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function EditarSessaoHistorica({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    data_realizacao: '',
    hora: '',
    tipo: '',
    dirigente: '',
    explanador: '',
    leitor_documentos: '',
  })

  const tiposSessao = [
    'Escala',
    'Escala Anual',
    'Casal',
    'Extra',
    'Instrutiva',
    'Da Direção',
    'Quadro de Mestres',
    'Adventício',
    'Preparo',
    'Caráter Instrutivo'
  ]

  useEffect(() => {
    async function loadData() {
      const { data: sessao, error } = await supabase
        .from('sessoes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        alert('Sessão histórica não encontrada!')
        router.replace('/sessoes')
        return
      }

      // Extrai data e hora ignorando conversões de fuso horário que o objeto Date faz
      let dateVal = ''
      let timeVal = ''
      if (sessao.data_realizacao) {
        const dateTimeStr = sessao.data_realizacao
        if (dateTimeStr.includes('T')) {
          const parts = dateTimeStr.split('T')
          dateVal = parts[0]
          timeVal = parts[1].substring(0, 5)
        } else if (dateTimeStr.includes(' ')) {
          const parts = dateTimeStr.split(' ')
          dateVal = parts[0]
          timeVal = parts[1].substring(0, 5)
        } else {
          dateVal = dateTimeStr
          timeVal = '20:00' // fallback
        }
      }

      setFormData({
        data_realizacao: dateVal,
        hora: timeVal,
        tipo: sessao.tipo,
        dirigente: sessao.dirigente,
        explanador: sessao.explanador || '',
        leitor_documentos: sessao.leitor_documentos || '',
      })

      setLoading(false)
    }
    loadData()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`

    const { error: erroSessao } = await supabase
      .from('sessoes')
      .update({
        data_realizacao: dataCompleta,
        tipo: formData.tipo,
        dirigente: formData.dirigente,
        explanador: formData.explanador,
        leitor_documentos: formData.leitor_documentos,
      })
      .eq('id', id)

    setSaving(false)

    if (erroSessao) {
      alert('Erro ao atualizar sessão histórica: ' + erroSessao.message)
      return
    }

    alert('Atualizado com sucesso!')
    router.back()
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja EXCLUIR essa sessão histórica?')) {
      setSaving(true)
      const { error } = await supabase.from('sessoes').delete().eq('id', id)
      if (error) alert('Erro ao excluir: ' + error.message)
      else router.back()
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors duration-300">
      <div className="animate-pulse">Carregando dados da sessão histórica...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      <header className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center">
          <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Editar Registro Histórico</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registro Histórico do DMC</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
          title="Excluir Sessão Histórica"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <form onSubmit={handleUpdate} className="space-y-6 max-w-lg mx-auto">

        {/* Bloco 1: Data e Hora */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1 uppercase tracking-wider">Data</label>
            <input
              type="date"
              className="w-full bg-transparent font-semibold outline-none text-gray-900 dark:text-white dark:[color-scheme:dark] text-sm"
              value={formData.data_realizacao}
              onChange={e => setFormData({ ...formData, data_realizacao: e.target.value })}
              required
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1 uppercase tracking-wider">Hora</label>
            <input
              type="time"
              className="w-full bg-transparent font-semibold outline-none text-gray-900 dark:text-white dark:[color-scheme:dark] text-sm"
              value={formData.hora}
              onChange={e => setFormData({ ...formData, hora: e.target.value })}
              required
            />
          </div>
        </section>

        {/* Bloco 2: Tipo de Sessão */}
        <section>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-3 ml-1 uppercase tracking-wider">Tipo de Sessão</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right">
            {tiposSessao.map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => setFormData({ ...formData, tipo })}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${formData.tipo === tipo
                  ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/20 shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </section>

        {/* Bloco 4: Detalhes da Sessão */}
        <section className="space-y-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><User className="w-4 h-4 text-amber-600 dark:text-amber-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block uppercase">Dirigente</label>
              <input
                type="text"
                placeholder="Nome do Mestre"
                className="w-full bg-transparent outline-none font-medium text-sm placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
                value={formData.dirigente}
                onChange={e => setFormData({ ...formData, dirigente: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block uppercase">Leitura (Opcional)</label>
              <input
                type="text"
                placeholder="Quem leu?"
                className="w-full bg-transparent outline-none font-medium text-sm placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
                value={formData.leitor_documentos}
                onChange={e => setFormData({ ...formData, leitor_documentos: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><Mic className="w-4 h-4 text-amber-600 dark:text-amber-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block uppercase">Explanação (Opcional)</label>
              <input
                type="text"
                placeholder="Quem explanou?"
                className="w-full bg-transparent outline-none font-medium text-sm placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
                value={formData.explanador}
                onChange={e => setFormData({ ...formData, explanador: e.target.value })}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-amber-900/20 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
        >
          {saving ? (
            <span className="animate-pulse">Atualizando...</span>
          ) : (
            <><Save className="w-5 h-5" /> Salvar Alterações</>
          )}
        </button>
      </form>
    </div>
  )
}
