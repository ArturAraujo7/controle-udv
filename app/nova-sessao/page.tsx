'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, User, Beaker, BookOpen, Mic, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { SeletorMembro, MembroSimples } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'

type PreparoSelect = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
  quantidade_preparada: number
}

type ConsumoItem = {
  id_preparo: string
  quantidade: string
}

export default function NovaSessao() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [preparos, setPreparos] = useState<PreparoSelect[]>([])

  // Lista de membros carregada do banco
  const [membros, setMembros] = useState<MembroSimples[]>([])

  // Estado para a lista de consumos
  const [consumos, setConsumos] = useState<ConsumoItem[]>([{ id_preparo: '', quantidade: '' }])

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Preparos
      const { data: preparos } = await supabase
        .from('preparos')
        .select('id, data_preparo, mestre_preparo, grau, quantidade_preparada')
        .order('data_preparo', { ascending: false })

      const { data: consumos } = await supabase.from('consumos_sessao').select('id_preparo, quantidade_consumida')
      const { data: saidas } = await supabase.from('saidas').select('preparo_id, quantidade')

      if (preparos) {
        const preparosComSaldo = preparos.filter(p => {
          const consumido = consumos?.filter(c => c.id_preparo === p.id).reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0) || 0
          const saido = saidas?.filter(s => s.preparo_id === p.id).reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0
          return (p.quantidade_preparada - consumido - saido) > 0
        })
        setPreparos(preparosComSaldo)
      }

      // 2. Fetch Membros
      const { data: membrosDB } = await supabase
        .from('membros')
        .select('*')
        .order('nome')
      if (membrosDB) {
        setMembros(membrosDB as MembroSimples[])
      }
    }
    fetchData()
  }, [])

  const [formData, setFormData] = useState({
    data_realizacao: new Date().toISOString().split('T')[0],
    hora: '20:00',
    tipo: 'Escala',
    dirigentes: [] as { id: number | null, nome: string }[],
    tipo_delegacao: 'Transmissão da Assistência',
    explanador: { id: null as number | null, nome: '' },
    leitor_documentos: { id: null as number | null, nome: '' },
    quantidade_participantes: '',
  })

  const tiposSessao = ['Escala', 'Escala Anual', 'Casal', 'Extra', 'Instrutiva', 'Da Direção', 'Quadro de Mestres', 'Adventício', 'Preparo', 'Caráter Instrutivo']

  // Funções para manipular a lista de consumos
  const addConsumo = () => {
    setConsumos([...consumos, { id_preparo: '', quantidade: '' }])
  }

  const removeConsumo = (index: number) => {
    if (consumos.length > 1) {
      const newConsumos = [...consumos]
      newConsumos.splice(index, 1)
      setConsumos(newConsumos)
    }
  }

  const updateConsumo = (index: number, field: keyof ConsumoItem, value: string) => {
    const newConsumos = [...consumos]
    newConsumos[index][field] = value
    setConsumos(newConsumos)
  }

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    // Reordenando a lista na memória após inserção rápida
    const novaLista = [...membros, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome))
    setMembros(novaLista)
  }

  // Calcula o total consumido para exibição ou validação
  const totalConsumido = consumos.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validação básica
    const consumosValidos = consumos.filter(c => c.id_preparo && c.quantidade)
    if (consumosValidos.length === 0) {
      alert('Selecione pelo menos um preparo e informe a quantidade.')
      setLoading(false)
      return
    }

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`
    const user = session?.user

    // 1. Cria a Sessão
    const { data: sessao, error: erroSessao } = await supabase
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
        quantidade_participantes: Number(formData.quantidade_participantes),
        user_id: user?.id
      }])
      .select()
      .single()

    if (erroSessao) {
      alert('Erro ao criar sessão: ' + erroSessao.message)
      setLoading(false)
      return
    }

    // 2. Salva os Consumos vinculados à sessão criada
    const consumosParaSalvar = consumosValidos.map(c => ({
      id_sessao: sessao.id,
      id_preparo: Number(c.id_preparo),
      quantidade_consumida: Number(c.quantidade)
    }))

    const { error: erroConsumos } = await supabase
      .from('consumos_sessao')
      .insert(consumosParaSalvar)

    setLoading(false)

    if (erroConsumos) {
      alert('Sessão criada, mas erro ao salvar consumos: ' + erroConsumos.message)
    } else {
      alert('Sessão registrada com sucesso!')
      router.replace('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      <header className="flex items-center mb-6">
        <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Nova Sessão</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">

        {/* Bloco 1: Data e Hora */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1 uppercase tracking-wider">Data</label>
            <input
              type="date"
              className="w-full bg-transparent font-semibold outline-none text-gray-900 dark:text-white dark:[color-scheme:dark] text-sm"
              value={formData.data_realizacao}
              onChange={e => setFormData({ ...formData, data_realizacao: e.target.value })}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1 uppercase tracking-wider">Hora</label>
            <input
              type="time"
              className="w-full bg-transparent font-semibold outline-none text-gray-900 dark:text-white dark:[color-scheme:dark] text-sm"
              value={formData.hora}
              onChange={e => setFormData({ ...formData, hora: e.target.value })}
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
                  ? 'bg-celestial-600 text-white border-celestial-500 shadow-celestial-900/20 shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </section>

        {/* Bloco 3: Preparos e Consumo (Múltiplos) */}
        <section className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-gold-600 dark:text-gold-500" />
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Vegetal Servido</label>
            </div>
            <span className="text-xs font-mono text-gold-600 dark:text-gold-400 bg-gold-100 dark:bg-gold-900/30 px-2 py-1 rounded">
              Total: {totalConsumido.toFixed(2).replace('.', ',')} L
            </span>
          </div>

          <div className="space-y-3">
            {consumos.map((item, index) => (
              <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex-1">
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-900/50 outline-none font-medium py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:border-gold-500 transition-colors appearance-none"
                    value={item.id_preparo}
                    onChange={e => updateConsumo(index, 'id_preparo', e.target.value)}
                    required
                  >
                    <option value="" className="text-gray-500">Selecione...</option>
                    {preparos.map(prep => (
                      <option key={prep.id} value={prep.id}>
                        {new Date(prep.data_preparo).toLocaleDateString('pt-BR')} • {prep.mestre_preparo} ({prep.grau})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20 relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Qtd"
                    className="w-full bg-gray-50 dark:bg-gray-900/50 outline-none font-medium py-2 px-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:border-gold-500 transition-colors text-center"
                    value={item.quantidade}
                    onChange={e => updateConsumo(index, 'quantidade', e.target.value)}
                    required
                  />
                  <span className="absolute right-8 top-2 text-xs text-gray-500 pointer-events-none hidden">L</span>
                </div>
                {consumos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeConsumo(index)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addConsumo}
            className="mt-4 text-xs font-medium text-celestial-600 dark:text-celestial-400 hover:text-celestial-500 dark:hover:text-celestial-300 flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-celestial-50 dark:hover:bg-celestial-900/20 transition-colors w-full justify-center border border-dashed border-celestial-200 dark:border-celestial-900/50"
          >
            <Plus className="w-3 h-3" /> Adicionar outro preparo
          </button>
        </section>

        {/* Bloco 4: Detalhes da Sessão */}
        <section className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-3 pt-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3">
            <div className="flex items-start gap-3 w-full">
              <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg mt-1"><User className="w-4 h-4 text-gray-500 dark:text-gray-400" /></div>
              <div className="flex-1 w-full flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-medium block uppercase mb-1.5">Mestre Dirigente</label>
                  <SeletorMultiploMembro
                    placeholder="Quem dirigiu?"
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

          <div className="bg-white dark:bg-gray-800 p-3 pt-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg mt-1"><BookOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-500" /></div>
            <div className="flex-1 w-full">
              <label className="text-[10px] text-gray-500 font-medium block uppercase mb-1.5">Leitor de Documentos</label>
              <SeletorMembro
                placeholder="Quem leu?"
                value={formData.leitor_documentos}
                onChange={(val) => setFormData({ ...formData, leitor_documentos: val })}
                membros={membros}
                onMembroAdicionado={handleMembroAdicionado}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 pt-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg mt-1"><Mic className="w-4 h-4 text-celestial-600 dark:text-celestial-500" /></div>
            <div className="flex-1 w-full">
              <label className="text-[10px] text-gray-500 font-medium block uppercase mb-1.5">Explanador</label>
              <SeletorMembro
                placeholder="Quem explanou?"
                value={formData.explanador}
                onChange={(val) => setFormData({ ...formData, explanador: val })}
                membros={membros}
                onMembroAdicionado={handleMembroAdicionado}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase mb-1">Total de Participantes</label>
              <input
                type="number"
                placeholder="0"
                className="w-full bg-transparent outline-none font-bold text-lg placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
                value={formData.quantidade_participantes}
                onChange={e => setFormData({ ...formData, quantidade_participantes: e.target.value })}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-gold-900/30 hover:from-gold-500 hover:to-gold-400 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
        >
          {loading ? (
            <span className="animate-pulse">Salvando...</span>
          ) : (
            <><Save className="w-5 h-5" /> Registrar Sessão</>
          )}
        </button>
      </form>
    </div>
  )
}