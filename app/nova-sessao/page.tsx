'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, User, Beaker, BookOpen, Mic, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

type PreparoSelect = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
}

type ConsumoItem = {
  id_preparo: string
  quantidade: string
}

export default function NovaSessao() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preparos, setPreparos] = useState<PreparoSelect[]>([])
  
  // Estado para a lista de consumos
  const [consumos, setConsumos] = useState<ConsumoItem[]>([{ id_preparo: '', quantidade: '' }])

  useEffect(() => {
    const fetchPreparos = async () => {
      const { data } = await supabase
        .from('preparos')
        .select('id, data_preparo, mestre_preparo, grau')
        .eq('status', 'Disponível')
        .order('data_preparo', { ascending: false })
      if (data) setPreparos(data)
    }
    fetchPreparos()
  }, [])

  const [formData, setFormData] = useState({
    data_realizacao: new Date().toISOString().split('T')[0],
    hora: '20:00',
    tipo: 'Escala',
    dirigente: '',
    explanador: '',
    leitor_documentos: '',
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

  // Calcula o total consumido para exibição (opcional) ou validação
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
    
    // 1. Cria a Sessão
    const { data: sessao, error: erroSessao } = await supabase
      .from('sessoes')
      .insert([{
        data_realizacao: dataCompleta,
        tipo: formData.tipo,
        dirigente: formData.dirigente,
        explanador: formData.explanador,
        quantidade_participantes: Number(formData.quantidade_participantes),
        // Removido id_preparo e quantidade_consumida direto daqui, pois mudamos o banco
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
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-20 text-white font-sans">
      <header className="flex items-center mb-6">
        <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700 hover:bg-gray-700 transition">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Nova Sessão</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
        
        {/* Bloco 1: Data e Hora */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm">
            <label className="text-xs text-gray-400 font-medium block mb-1 uppercase tracking-wider">Data</label>
            <input 
              type="date" 
              className="w-full bg-transparent font-semibold outline-none text-white [color-scheme:dark] text-sm" 
              value={formData.data_realizacao} 
              onChange={e => setFormData({...formData, data_realizacao: e.target.value})} 
            />
          </div>
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm">
            <label className="text-xs text-gray-400 font-medium block mb-1 uppercase tracking-wider">Hora</label>
            <input 
              type="time" 
              className="w-full bg-transparent font-semibold outline-none text-white [color-scheme:dark] text-sm" 
              value={formData.hora} 
              onChange={e => setFormData({...formData, hora: e.target.value})} 
            />
          </div>
        </section>

        {/* Bloco 2: Tipo de Sessão */}
        <section>
          <label className="text-xs text-gray-400 font-medium block mb-3 ml-1 uppercase tracking-wider">Tipo de Sessão</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right">
            {tiposSessao.map(tipo => (
              <button 
                key={tipo} 
                type="button" 
                onClick={() => setFormData({...formData, tipo})}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  formData.tipo === tipo 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/20 shadow-lg' 
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </section>

        {/* Bloco 3: Preparos e Consumo (Múltiplos) */}
        <section className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-green-500" />
              <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Vegetal Servido</label>
            </div>
            <span className="text-xs font-mono text-green-400 bg-green-900/30 px-2 py-1 rounded">
              Total: {totalConsumido.toFixed(1)} L
            </span>
          </div>

          <div className="space-y-3">
            {consumos.map((item, index) => (
              <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex-1">
                  <select 
                    className="w-full bg-gray-900/50 outline-none font-medium py-2 px-3 rounded-lg border border-gray-600 text-sm text-white focus:border-green-500 transition-colors appearance-none" 
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
                    className="w-full bg-gray-900/50 outline-none font-medium py-2 px-2 rounded-lg border border-gray-600 text-sm text-white focus:border-green-500 transition-colors text-center" 
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
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
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
            className="mt-4 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-blue-900/20 transition-colors w-full justify-center border border-dashed border-blue-900/50"
          >
            <Plus className="w-3 h-3" /> Adicionar outro preparo
          </button>
        </section>

        {/* Bloco 4: Detalhes da Sessão */}
        <section className="space-y-3">
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-700/50 rounded-lg"><User className="w-4 h-4 text-gray-400" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Dirigente</label>
              <input 
                type="text" 
                placeholder="Nome do Mestre" 
                className="w-full bg-transparent outline-none font-medium text-sm placeholder-gray-600 text-white" 
                value={formData.dirigente} 
                onChange={e => setFormData({...formData, dirigente: e.target.value})} 
              />
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-700/50 rounded-lg"><BookOpen className="w-4 h-4 text-yellow-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Leitura</label>
              <input 
                type="text" 
                placeholder="Quem leu?" 
                className="w-full bg-transparent outline-none font-medium text-sm placeholder-gray-600 text-white" 
                value={formData.leitor_documentos} 
                onChange={e => setFormData({...formData, leitor_documentos: e.target.value})} 
              />
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-700/50 rounded-lg"><Mic className="w-4 h-4 text-blue-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Explanação</label>
              <input 
                type="text" 
                placeholder="Quem explanou?" 
                className="w-full bg-transparent outline-none font-medium text-sm placeholder-gray-600 text-white" 
                value={formData.explanador} 
                onChange={e => setFormData({...formData, explanador: e.target.value})} 
              />
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-700/50 rounded-lg"><Users className="w-4 h-4 text-purple-400" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Participantes</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full bg-transparent outline-none font-bold text-lg placeholder-gray-600 text-white" 
                value={formData.quantidade_participantes} 
                onChange={e => setFormData({...formData, quantidade_participantes: e.target.value})} 
              />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-900/30 hover:from-green-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
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