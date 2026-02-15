'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, User, Beaker, Trash2, BookOpen, Mic, Plus } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

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

export default function EditarSessao({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preparos, setPreparos] = useState<PreparoSelect[]>([])

  const [formData, setFormData] = useState({
    data_realizacao: '',
    hora: '',
    tipo: '',
    dirigente: '',
    explanador: '',
    leitor_documentos: '',
    quantidade_participantes: '',
  })

  // Estado para lista de consumos
  const [consumos, setConsumos] = useState<ConsumoItem[]>([])

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
      // 1. Carrega Preparos disponíveis
      const { data: dataPreparos } = await supabase.from('preparos').select('id, data_preparo, mestre_preparo, grau').eq('status', 'Disponível').order('data_preparo', { ascending: false })
      if (dataPreparos) setPreparos(dataPreparos)

      // 2. Carrega Sessão
      const { data: sessao, error } = await supabase.from('sessoes').select('*').eq('id', id).single()
      if (error) {
        alert('Sessão não encontrada!')
        router.push('/sessoes')
        return
      }

      // 3. Carrega Consumos Vinculados
      const { data: dataConsumos } = await supabase
        .from('consumos_sessao')
        .select('id_preparo, quantidade_consumida')
        .eq('id_sessao', id)

      // Preenche o formulário
      const dataIso = new Date(sessao.data_realizacao)
      setFormData({
        data_realizacao: dataIso.toISOString().split('T')[0],
        hora: dataIso.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        tipo: sessao.tipo,
        dirigente: sessao.dirigente,
        explanador: sessao.explanador || '',
        leitor_documentos: sessao.leitor_documentos || '',
        quantidade_participantes: String(sessao.quantidade_participantes),
      })

      // Preenche a lista de consumos (ou cria um vazio se não tiver nada)
      if (dataConsumos && dataConsumos.length > 0) {
        setConsumos(dataConsumos.map(c => ({
          id_preparo: String(c.id_preparo),
          quantidade: String(c.quantidade_consumida)
        })))
      } else {
        // Fallback para sessões antigas que podem ter o ID direto na tabela sessoes (se ainda existir a coluna no select *)
        // Mas como mudamos o schema, o ideal é vir vazio ou tentar recuperar se tivéssemos migrado.
        // Vamos assumir vazio para simplificar, o usuário adiciona se precisar.
        setConsumos([{ id_preparo: '', quantidade: '' }])
      }

      setLoading(false)
    }
    loadData()
  }, [id, router])

  // Funções de manipulação da lista
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

  const totalConsumido = consumos.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Validação
    const consumosValidos = consumos.filter(c => c.id_preparo && c.quantidade)
    if (consumosValidos.length === 0) {
      alert('Informe pelo menos um consumo válido.')
      setSaving(false)
      return
    }

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`

    // 1. Atualiza dados da Sessão
    const { error: erroSessao } = await supabase.from('sessoes').update({
      data_realizacao: dataCompleta,
      tipo: formData.tipo,
      dirigente: formData.dirigente,
      explanador: formData.explanador,
      leitor_documentos: formData.leitor_documentos,
      quantidade_participantes: Number(formData.quantidade_participantes),
    }).eq('id', id)

    if (erroSessao) {
      alert('Erro ao atualizar sessão: ' + erroSessao.message)
      setSaving(false)
      return
    }

    // 2. Atualiza Consumos (Estratégia: Delete All + Insert New)
    // Primeiro remove os antigos
    const { error: erroDelete } = await supabase
      .from('consumos_sessao')
      .delete()
      .eq('id_sessao', id)

    if (erroDelete) {
      alert('Erro ao limpar consumos antigos: ' + erroDelete.message)
      setSaving(false)
      return
    }

    // Depois insere os atuais da tela
    const consumosParaSalvar = consumosValidos.map(c => ({
      id_sessao: id, // ID da sessão atual
      id_preparo: Number(c.id_preparo),
      quantidade_consumida: Number(c.quantidade)
    }))

    const { error: erroInsert } = await supabase
      .from('consumos_sessao')
      .insert(consumosParaSalvar)

    setSaving(false)

    if (erroInsert) {
      alert('Erro ao salvar novos consumos: ' + erroInsert.message)
    } else {
      alert('Atualizado com sucesso!')
      router.push('/sessoes')
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja EXCLUIR essa sessão?')) {
      setSaving(true)
      const { error } = await supabase.from('sessoes').delete().eq('id', id)
      if (error) alert('Erro: ' + error.message)
      else router.push('/sessoes')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors duration-300">
      <div className="animate-pulse">Carregando dados da sessão...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/sessoes" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Editar Sessão</h1>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          title="Excluir Sessão"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      <form onSubmit={handleUpdate} className="space-y-6 max-w-lg mx-auto">

        {/* Bloco 1: Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1 uppercase tracking-wider">Data</label>
            <input type="date" className="w-full bg-transparent font-semibold outline-none text-gray-900 dark:text-white dark:[color-scheme:dark]" value={formData.data_realizacao} onChange={e => setFormData({ ...formData, data_realizacao: e.target.value })} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1 uppercase tracking-wider">Hora</label>
            <input type="time" className="w-full bg-transparent font-semibold outline-none text-gray-900 dark:text-white dark:[color-scheme:dark]" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} />
          </div>
        </div>

        {/* Bloco 2: Tipo */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-2 ml-1 uppercase tracking-wider">Tipo de Sessão</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right">
            {tiposSessao.map(tipo => (
              <button key={tipo} type="button" onClick={() => setFormData({ ...formData, tipo })}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${formData.tipo === tipo ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Bloco 3: Preparos e Consumo (Múltiplos) */}
        <section className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-green-600 dark:text-green-500" />
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Vegetal Servido</label>
            </div>
            <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              Total: {totalConsumido.toFixed(1)} L
            </span>
          </div>

          <div className="space-y-3">
            {consumos.map((item, index) => (
              <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex-1">
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-900/50 outline-none font-medium py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:border-green-500 transition-colors appearance-none"
                    value={item.id_preparo}
                    onChange={e => updateConsumo(index, 'id_preparo', e.target.value)}
                  >
                    <option value="" className="text-gray-500">Selecione...</option>
                    {preparos.map(prep => (
                      <option key={prep.id} value={prep.id}>
                        {new Date(prep.data_preparo).toLocaleDateString('pt-BR')} • {prep.mestre_preparo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Qtd"
                    className="w-full bg-gray-50 dark:bg-gray-900/50 outline-none font-medium py-2 px-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:border-green-500 transition-colors text-center"
                    value={item.quantidade}
                    onChange={e => updateConsumo(index, 'quantidade', e.target.value)}
                  />
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
            className="mt-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full justify-center border border-dashed border-blue-200 dark:border-blue-900/50"
          >
            <Plus className="w-3 h-3" /> Adicionar outro preparo
          </button>
        </section>

        {/* Bloco 4: Detalhes */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><User className="w-4 h-4 text-gray-500 dark:text-gray-400" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Dirigente</label>
              <input type="text" className="w-full bg-transparent outline-none font-medium text-sm text-gray-900 dark:text-white" value={formData.dirigente} onChange={e => setFormData({ ...formData, dirigente: e.target.value })} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><BookOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Leitura</label>
              <input type="text" className="w-full bg-transparent outline-none font-medium text-sm text-gray-900 dark:text-white" value={formData.leitor_documentos} onChange={e => setFormData({ ...formData, leitor_documentos: e.target.value })} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><Mic className="w-4 h-4 text-blue-600 dark:text-blue-500" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Explanação</label>
              <input type="text" className="w-full bg-transparent outline-none font-medium text-sm text-gray-900 dark:text-white" value={formData.explanador} onChange={e => setFormData({ ...formData, explanador: e.target.value })} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 font-medium block uppercase">Participantes</label>
              <input type="number" className="w-full bg-transparent outline-none font-bold text-lg text-gray-900 dark:text-white" value={formData.quantidade_participantes} onChange={e => setFormData({ ...formData, quantidade_participantes: e.target.value })} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 mt-6 shadow-lg hover:shadow-blue-900/30 active:scale-[0.98]"
        >
          {saving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
        </button>
      </form>
    </div>
  )
}