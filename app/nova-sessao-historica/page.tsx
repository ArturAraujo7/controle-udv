'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, BookOpen, Mic } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function NovaSessaoHistorica() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    data_realizacao: new Date().toISOString().split('T')[0],
    hora: '20:00',
    tipo: 'Escala',
    dirigente: '',
    explanador: '',
    leitor_documentos: '',
  })

  const tiposSessao = ['Escala', 'Escala Anual', 'Casal', 'Extra', 'Instrutiva', 'Da Direção', 'Quadro de Mestres', 'Adventício', 'Preparo', 'Caráter Instrutivo']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`

    const user = session?.user

    // Cria a Sessão apenas
    const { error: erroSessao } = await supabase
      .from('sessoes')
      .insert([{
        data_realizacao: dataCompleta,
        tipo: formData.tipo,
        dirigente: formData.dirigente,
        explanador: formData.explanador,
        leitor_documentos: formData.leitor_documentos,
        quantidade_participantes: 0, // 0 hardcoded para Sessões Históricas (NOT NULL)
        user_id: user?.id
      }])

    setLoading(false)

    if (erroSessao) {
      alert('Erro ao registrar sessão histórica: ' + erroSessao.message)
      return
    }

    alert('Sessão histórica registrada com sucesso!')
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      <header className="flex flex-col mb-6 pt-2">
        <div className="flex items-center">
          <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Registro Histórico</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registro Histórico do DMC</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">

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
                  ? 'bg-gold-600 text-white border-gold-500 shadow-gold-900/20 shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gold-600 dark:hover:text-gold-400'
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
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><User className="w-4 h-4 text-gold-600 dark:text-gold-500" /></div>
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
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><BookOpen className="w-4 h-4 text-gold-600 dark:text-gold-500" /></div>
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
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"><Mic className="w-4 h-4 text-gold-600 dark:text-gold-500" /></div>
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
          disabled={loading}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-gold-900/20 hover:from-gold-400 hover:to-gold-500 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
        >
          {loading ? (
            <span className="animate-pulse">Registrando...</span>
          ) : (
            <><Save className="w-5 h-5" /> Salvar Histórico</>
          )}
        </button>
      </form>
    </div>
  )
}
