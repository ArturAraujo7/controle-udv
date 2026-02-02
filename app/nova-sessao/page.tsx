'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users, User, Beaker, BookOpen, Mic } from 'lucide-react'
import Link from 'next/link'

type PreparoSelect = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
}

export default function NovaSessao() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preparos, setPreparos] = useState<PreparoSelect[]>([])
  
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
    leitor_documentos: '', // Agora salva direto na sessão
    quantidade_participantes: '',
    quantidade_consumida: '',
    id_preparo: ''
  })

  const tiposSessao = ['Escala', 'Escala Anual', 'Casal', 'Extra', 'Instrutiva', 'Da Direção', 'Quadro de Mestres', 'Adventício', 'Preparo', 'Caráter Instrutivo']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`
    
    // Salva tudo na tabela sessoes de uma vez
    const { error } = await supabase.from('sessoes').insert([{
      data_realizacao: dataCompleta,
      tipo: formData.tipo,
      dirigente: formData.dirigente,
      explanador: formData.explanador,
      leitor_documentos: formData.leitor_documentos, // Campo novo
      quantidade_participantes: Number(formData.quantidade_participantes),
      quantidade_consumida: Number(formData.quantidade_consumida) || 0,
      id_preparo: formData.id_preparo ? Number(formData.id_preparo) : null
    }])

    setLoading(false)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Sessão registrada com sucesso!')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-20 text-white">
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold">Nova Sessão</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Data e Hora */}
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

        {/* Tipo */}
        <div>
          <label className="text-xs text-gray-400 font-medium block mb-2 ml-1">Tipo de Sessão</label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {tiposSessao.map(tipo => (
              <button key={tipo} type="button" onClick={() => setFormData({...formData, tipo})}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${formData.tipo === tipo ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Vegetal */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-green-500" />
            <label className="text-xs text-gray-400 font-medium">Vegetal Servido</label>
          </div>
          <select className="w-full bg-transparent outline-none font-medium py-2 border-b border-gray-700 text-white" value={formData.id_preparo} onChange={e => setFormData({...formData, id_preparo: e.target.value})} required>
            <option value="" className="bg-gray-800">Selecione o Preparo...</option>
            {preparos.map(prep => (
              <option key={prep.id} value={prep.id} className="bg-gray-800">
                {new Date(prep.data_preparo).toLocaleDateString('pt-BR')} - {prep.mestre_preparo} ({prep.grau})
              </option>
            ))}
          </select>
        </div>

        {/* Direção, Leitura e Explanação */}
        <div className="space-y-3">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block">Dirigente</label>
              <input type="text" placeholder="Nome do Mestre" className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white" value={formData.dirigente} onChange={e => setFormData({...formData, dirigente: e.target.value})} />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block">Leitura de Documentos</label>
              <input type="text" placeholder="Quem leu?" className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white" value={formData.leitor_documentos} onChange={e => setFormData({...formData, leitor_documentos: e.target.value})} />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
            <Mic className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium block">Explanação</label>
              <input type="text" placeholder="Quem explanou?" className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white" value={formData.explanador} onChange={e => setFormData({...formData, explanador: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Números */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <label className="text-xs text-gray-400 font-medium">Pessoas</label>
            </div>
            <input type="number" placeholder="0" className="w-full bg-transparent text-2xl font-bold outline-none text-white" value={formData.quantidade_participantes} onChange={e => setFormData({...formData, quantidade_participantes: e.target.value})} />
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-green-900 flex items-center justify-center text-green-400 text-[10px] font-bold">V</div>
              <label className="text-xs text-gray-400 font-medium">Consumo (L)</label>
            </div>
            <input type="number" step="0.1" placeholder="0.0" className="w-full bg-transparent text-2xl font-bold outline-none text-white" value={formData.quantidade_consumida} onChange={e => setFormData({...formData, quantidade_consumida: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-4">
          {loading ? 'Salvando...' : <><Save className="w-5 h-5" /> Registrar Sessão</>}
        </button>
      </form>
    </div>
  )
}