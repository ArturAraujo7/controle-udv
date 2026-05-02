'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, User, Beaker, Trash2, BookOpen, Mic, Plus } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
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
    dirigentes: [] as { id: number | null, nome: string }[],
    tipo_delegacao: 'Transmissão da Assistência',
    explanador: { id: null as number | null, nome: '' },
    leitor_documentos: { id: null as number | null, nome: '' },
    quantidade_participantes: '',
  })

  const [membros, setMembros] = useState<MembroSimples[]>([])

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    const novaLista = [...membros, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome))
    setMembros(novaLista)
  }

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
      const { data: dataPreparos } = await supabase.from('preparos').select('id, data_preparo, mestre_preparo, grau, quantidade_preparada').order('data_preparo', { ascending: false })

      // 2. Carrega Sessão
      const { data: sessao, error } = await supabase.from('sessoes').select('*').eq('id', id).single()
      if (error) {
        alert('Sessão não encontrada!')
        router.replace('/sessoes')
        return
      }

      // 3. Carrega Consumos Vinculados e Saídas Globais (para cálculo de saldo)
      const { data: dataConsumosSessao } = await supabase
        .from('consumos_sessao')
        .select('id_preparo, quantidade_consumida')
        .eq('id_sessao', id)

      const { data: todosConsumos } = await supabase.from('consumos_sessao').select('id_preparo, quantidade_consumida')
      const { data: todasSaidas } = await supabase.from('saidas').select('preparo_id, quantidade')

      if (dataPreparos) {
        const preparosComSaldo = dataPreparos.filter(p => {
          const consumido = todosConsumos?.filter(c => c.id_preparo === p.id).reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0) || 0
          const saido = todasSaidas?.filter(s => s.preparo_id === p.id).reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0
          const saldo = p.quantidade_preparada - consumido - saido

          // Manter na lista se tem saldo > 0 OU se já faz parte do consumo desta sessão (para não quebrar a UI ao editar)
          const usadoNestaSessao = dataConsumosSessao?.some(c => c.id_preparo === p.id)
          return saldo > 0 || usadoNestaSessao
        })
        setPreparos(preparosComSaldo)
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

      // 4. Carrega Membros
      const { data: membrosDB } = await supabase.from('membros').select('*').order('nome')
      if (membrosDB) {
        setMembros(membrosDB as MembroSimples[])
      }

      // Preenche o formulário
      const dirigentes = []
      if (sessao.dirigente_id) {
          dirigentes.push({ id: sessao.dirigente_id, nome: sessao.dirigente.split(' / ')[0] || '' })
      } else if (sessao.dirigente) {
          const parts = sessao.dirigente.split(' / ')
          parts.forEach((p: string) => dirigentes.push({ id: null, nome: p }))
      }
      
      if (sessao.dirigente_2_id && sessao.dirigente.includes(' / ')) {
          dirigentes.push({ id: sessao.dirigente_2_id, nome: sessao.dirigente.split(' / ')[1] || '' })
      }

      setFormData({
        data_realizacao: dateVal,
        hora: timeVal,
        tipo: sessao.tipo,
        dirigentes,
        tipo_delegacao: sessao.tipo_delegacao || 'Transmissão da Assistência',
        explanador: { id: sessao.explanador_id || null, nome: sessao.explanador || '' },
        leitor_documentos: { id: sessao.leitor_documentos_id || null, nome: sessao.leitor_documentos || '' },
        quantidade_participantes: String(sessao.quantidade_participantes),
      })

      // Preenche a lista de consumos (ou cria um vazio se não tiver nada)
      if (dataConsumosSessao && dataConsumosSessao.length > 0) {
        setConsumos(dataConsumosSessao.map(c => ({
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
      dirigente: formData.dirigentes.map(d => d.nome).join(' / '),
      dirigente_id: formData.dirigentes[0]?.id || null,
      dirigente_2_id: formData.dirigentes[1]?.id || null,
      tipo_delegacao: formData.dirigentes.length > 1 ? formData.tipo_delegacao : null,
      explanador: formData.explanador.nome,
      explanador_id: formData.explanador.id,
      leitor_documentos: formData.leitor_documentos.nome,
      leitor_documentos_id: formData.leitor_documentos.id,
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
      router.back()
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja EXCLUIR essa sessão?')) {
      setSaving(true)
      const { error } = await supabase.from('sessoes').delete().eq('id', id)
      if (error) alert('Erro: ' + error.message)
      else router.back()
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
          <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
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
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${formData.tipo === tipo ? 'bg-celestial-600 text-white border-celestial-500 shadow-lg shadow-celestial-900/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {tipo}
              </button>
            ))}
          </div>
        </div>

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
              <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex-1">
                  <select
                    className="w-full bg-gray-50 dark:bg-gray-900/50 outline-none font-medium py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:border-gold-500 transition-colors appearance-none"
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
                    className="w-full bg-gray-50 dark:bg-gray-900/50 outline-none font-medium py-2 px-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:border-gold-500 transition-colors text-center"
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
          disabled={saving}
          className="w-full bg-gradient-to-r from-celestial-600 to-celestial-500 text-white py-4 rounded-xl font-bold text-lg hover:from-celestial-500 hover:to-celestial-400 transition-all flex items-center justify-center gap-2 mt-6 shadow-lg hover:shadow-celestial-900/30 active:scale-[0.98]"
        >
          {saving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
        </button>
      </form>
    </div>
  )
}