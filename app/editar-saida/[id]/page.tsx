'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Preparo = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
}

export default function EditarSaida({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preparos, setPreparos] = useState<Preparo[]>([])

  const [formData, setFormData] = useState({
    data_saida: '',
    quantidade: '',
    destino: '',
    preparo_id: '',
    observacoes: ''
  })

  useEffect(() => {
    async function loadData() {
      // 1. Busca Preparos (pro select)
      const { data: dataPreparos } = await supabase
        .from('preparos')
        .select('id, data_preparo, mestre_preparo, grau')
        .order('data_preparo', { ascending: false })

      if (dataPreparos) setPreparos(dataPreparos)

      // 2. Busca a Saída atual
      const { data: saida, error } = await supabase
        .from('saidas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        alert('Saída não encontrada!')
        router.push('/estoque')
        return
      }

      setFormData({
        data_saida: saida.data_saida,
        quantidade: String(saida.quantidade),
        destino: saida.destino,
        preparo_id: String(saida.preparo_id),
        observacoes: saida.observacoes || ''
      })
      setLoading(false)
    }
    loadData()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('saidas')
      .update({
        data_saida: formData.data_saida,
        quantidade: parseFloat(formData.quantidade),
        destino: formData.destino,
        preparo_id: parseInt(formData.preparo_id),
        observacoes: formData.observacoes
      })
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar: ' + error.message)
      setSaving(false)
    } else {
      router.back() // Volta pra página anterior
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja EXCLUIR esse registro de saída? O estoque será devolvido.')) {
      setSaving(true)
      const { error } = await supabase.from('saidas').delete().eq('id', id)

      if (error) {
        alert('Erro ao excluir: ' + error.message)
        setSaving(false)
      } else {
        router.back()
        router.refresh()
      }
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando...</div>

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700 shadow-sm">
            <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold">Editar Saída</h1>
        </div>

        <button
          onClick={handleDelete}
          className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition border border-red-200 dark:border-red-900/50"
          title="Excluir Saída"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6 max-w-md mx-auto">

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Data da Saída</label>
          <input
            type="date"
            required
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none dark:[color-scheme:dark]"
            value={formData.data_saida}
            onChange={e => setFormData({ ...formData, data_saida: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Origem (Qual Preparo?)</label>
          <select
            required
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            value={formData.preparo_id}
            onChange={e => setFormData({ ...formData, preparo_id: e.target.value })}
          >
            <option value="">Selecione um preparo...</option>
            {preparos.map(p => (
              <option key={p.id} value={p.id}>
                {new Date(p.data_preparo).toLocaleDateString('pt-BR')} - {p.mestre_preparo} ({p.grau})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Destino</label>
          <input
            type="text"
            required
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
            value={formData.destino}
            onChange={e => setFormData({ ...formData, destino: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Quantidade (L)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              required
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
              value={formData.quantidade}
              onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
            />
            <span className="absolute right-4 top-4 text-gray-500">L</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Observações (Opcional)</label>
          <textarea
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] placeholder-gray-400 dark:placeholder-gray-500"
            value={formData.observacoes}
            onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>

      </form>
    </main>
  )
}