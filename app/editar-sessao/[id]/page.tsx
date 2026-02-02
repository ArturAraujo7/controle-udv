'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, User, Beaker, Trash2, BookOpen, Mic } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

type PreparoSelect = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
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
    quantidade_consumida: '',
    id_preparo: ''
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
      // 1. Carrega Preparos
      const { data: dataPreparos } = await supabase.from('preparos').select('id, data_preparo, mestre_preparo, grau').eq('status', 'Disponível').order('data_preparo', { ascending: false })
      if (dataPreparos) setPreparos(dataPreparos)

      // 2. Carrega Sessão (já com os campos novos)
      const { data: sessao, error } = await supabase.from('sessoes').select('*').eq('id', id).single()
      if (error) {
        alert('Sessão não encontrada!')
        router.push('/sessoes')
        return
      }

      const dataIso = new Date(sessao.data_realizacao)
      setFormData({
        data_realizacao: dataIso.toISOString().split('T')[0],
        hora: dataIso.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        tipo: sessao.tipo,
        dirigente: sessao.dirigente,
        explanador: sessao.explanador || '', 
        leitor_documentos: sessao.leitor_documentos || '', // Carrega direto da sessão
        quantidade_participantes: String(sessao.quantidade_participantes),
        quantidade_consumida: String(sessao.quantidade_consumida),
        id_preparo: sessao.id_preparo ? String(sessao.id_preparo) : ''
      })
      setLoading(false)
    }
    loadData()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`
    
    // Atualiza tudo na tabela sessoes
    const { error: erroSessao } = await supabase.from('sessoes').update({
        data_realizacao: dataCompleta,
        tipo: formData.tipo,
        dirigente: formData.dirigente,
        explanador: formData.explanador,
        leitor_documentos: formData.leitor_documentos,
        quantidade_participantes: Number(formData.quantidade_participantes),
        quantidade_consumida: Number(formData.quantidade_consumida),
        id_preparo: formData.id_preparo ? Number(formData.id_preparo) : null
      }).eq('id', id)

    setSaving(false)
    
    if (erroSessao) {
      alert('Erro: ' + erroSessao.message)
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

  if (loading) return <p className="text-center p-10 text-gray-500">Carregando...</p>

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-20 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/sessoes" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Editar Sessão</h1>
        </div>
        <button onClick={handleDelete} className="p-2 text-red-400 bg-red-900/30 rounded-full hover:bg-red-900/50">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
            <label className="text-xs text-gray-400 font-medium block mb-1">Data</label>
            <input type="date" className="w-full bg-transparent font-semibold outline-none text-white [color-scheme:dark]" value={formData.data_realizacao} onChange={e => setFormData({...formData, data_realizacao: e.target.value})} />
          </div>
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
            <label className="text-xs text-gray-400 font-medium block mb-1">Hora</label>
            <input type="time" className="w-full bg-transparent font-semibold outline-none text-white [color-scheme:dark]" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 font-medium block mb-2 ml-1">Tipo de Sessão</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tiposSessao.map(tipo => (
              <button key={tipo} type="button" onClick={() => setFormData({...formData, tipo})}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${formData.tipo === tipo ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-green-500" />
            <label className="text-xs text-gray-400 font-medium">Vegetal Servido</label>
          </div>
          <select className="w-full bg-transparent outline-none font-medium py-2 border-b border-gray-700 text-white" value={formData.id_preparo} onChange={e => setFormData({...formData, id_preparo: e.target.value})}>
            <option value="" className="bg-gray-800">Selecione...</option>
            {preparos.map(prep => (
              <option key={prep.id} value={prep.id} className="bg-gray-800">
                {new Date(prep.data_preparo).toLocaleDateString('pt-BR')} - {prep.mestre_preparo}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block">Dirigente</label>
              <input type="text" className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white" value={formData.dirigente} onChange={e => setFormData({...formData, dirigente: e.target.value})} />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block">Leitura de Documentos</label>
              <input type="text" className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white" value={formData.leitor_documentos} onChange={e => setFormData({...formData, leitor_documentos: e.target.value})} />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
            <Mic className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block">Explanação</label>
              <input type="text" className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white" value={formData.explanador} onChange={e => setFormData({...formData, explanador: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <label className="text-xs text-gray-400 font-medium">Pessoas</label>
            </div>
            <input type="number" className="w-full bg-transparent text-2xl font-bold outline-none text-white" value={formData.quantidade_participantes} onChange={e => setFormData({...formData, quantidade_participantes: e.target.value})} />
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-900 flex items-center justify-center text-green-400 text-[10px] font-bold">V</div>
              <label className="text-xs text-gray-400 font-medium">Consumo</label>
            </div>
            <input type="number" step="0.1" className="w-full bg-transparent text-2xl font-bold outline-none text-white" value={formData.quantidade_consumida} onChange={e => setFormData({...formData, quantidade_consumida: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4">
          {saving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
        </button>
      </form>
    </div>
  )
}