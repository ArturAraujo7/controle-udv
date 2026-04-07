'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, BookOpen, Mic } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { SeletorMembro, MembroSimples } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'

export default function NovaSessaoHistorica() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [membros, setMembros] = useState<MembroSimples[]>([])

  useEffect(() => {
    const fetchMembros = async () => {
      const { data: membrosDB } = await supabase
        .from('membros')
        .select('*')
        .order('nome')
      if (membrosDB) {
        setMembros(membrosDB as MembroSimples[])
      }
    }
    fetchMembros()
  }, [])

  const [formData, setFormData] = useState({
    data_realizacao: new Date().toISOString().split('T')[0],
    hora: '20:00',
    tipo: 'Escala',
    dirigentes: [] as { id: number | null, nome: string }[],
    tipo_delegacao: 'Transmissão da Assistência',
    explanador: { id: null as number | null, nome: '' },
    leitor_documentos: { id: null as number | null, nome: '' },
  })

  const tiposSessao = ['Escala', 'Escala Anual', 'Casal', 'Extra', 'Instrutiva', 'Da Direção', 'Quadro de Mestres', 'Adventício', 'Preparo', 'Caráter Instrutivo']

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    const novaLista = [...membros, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome))
    setMembros(novaLista)
  }

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
        dirigente: formData.dirigentes.map(d => d.nome).join(' / '),
        dirigente_id: formData.dirigentes[0]?.id || null,
        dirigente_2_id: formData.dirigentes[1]?.id || null,
        tipo_delegacao: formData.dirigentes.length > 1 ? formData.tipo_delegacao : null,
        explanador: formData.explanador.nome,
        explanador_id: formData.explanador.id,
        leitor_documentos: formData.leitor_documentos.nome,
        leitor_documentos_id: formData.leitor_documentos.id,
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
        <section className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-3 pt-4 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm flex flex-col gap-3">
            <div className="flex items-start gap-3 w-full">
              <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg mt-1"><User className="w-4 h-4 text-gold-600 dark:text-gold-500" /></div>
              <div className="flex-1 w-full flex flex-col gap-3">
                <div>
                   <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block uppercase mb-1.5">Mestre Dirigente</label>
                   <SeletorMultiploMembro
                      placeholder="Quem estava na responsabilidade?"
                      value={formData.dirigentes}
                      onChange={(val) => setFormData({ ...formData, dirigentes: val })}
                      membros={membros}
                      onMembroAdicionado={handleMembroAdicionado}
                      max={2}
                   />
                </div>
              </div>
            </div>
            {formData.dirigentes.length > 1 && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-in fade-in zoom-in-95">
                    <label className="text-[10px] text-gray-500 font-medium block uppercase mb-2">Classificação da Delegação</label>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input 
                                type="radio" 
                                name="delegacao" 
                                value="Transmissão da Assistência"
                                checked={formData.tipo_delegacao === 'Transmissão da Assistência'}
                                onChange={e => setFormData({ ...formData, tipo_delegacao: e.target.value })}
                                className="text-gold-600 dark:text-gold-500 focus:ring-gold-500"
                            />
                            Transmissão da Assistência
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input 
                                type="radio" 
                                name="delegacao" 
                                value="Transmissão da Representação"
                                checked={formData.tipo_delegacao === 'Transmissão da Representação'}
                                onChange={e => setFormData({ ...formData, tipo_delegacao: e.target.value })}
                                className="text-gold-600 dark:text-gold-500 focus:ring-gold-500"
                            />
                            Transmissão da Representação
                        </label>
                    </div>
                </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 pt-4 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg mt-1"><BookOpen className="w-4 h-4 text-gold-600 dark:text-gold-500" /></div>
            <div className="flex-1 w-full">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block uppercase mb-1.5">Leitura (Opcional)</label>
              <SeletorMembro
                 placeholder="Quem leu?"
                 value={formData.leitor_documentos}
                 onChange={(val) => setFormData({ ...formData, leitor_documentos: val })}
                 membros={membros}
                 onMembroAdicionado={handleMembroAdicionado}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 pt-4 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg mt-1"><Mic className="w-4 h-4 text-gold-600 dark:text-gold-500" /></div>
            <div className="flex-1 w-full">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block uppercase mb-1.5">Explanação (Opcional)</label>
              <SeletorMembro
                 placeholder="Quem explanou?"
                 value={formData.explanador}
                 onChange={(val) => setFormData({ ...formData, explanador: val })}
                 membros={membros}
                 onMembroAdicionado={handleMembroAdicionado}
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
