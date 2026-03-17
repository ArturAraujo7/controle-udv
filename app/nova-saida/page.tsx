'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

type Preparo = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
  quantidade_preparada: number
}

export default function NovaSaida() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [preparos, setPreparos] = useState<Preparo[]>([])

  const [formData, setFormData] = useState({
    data_saida: new Date().toISOString().split('T')[0],
    quantidade: '',
    destino: '',
    preparo_id: '',
    observacoes: ''
  })

  useEffect(() => {
    async function fetchPreparos() {
      const { data: preparos, error } = await supabase
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
      if (error) console.error('Erro ao buscar preparos:', error)
    }
    fetchPreparos()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const user = session?.user

    const { error } = await supabase
      .from('saidas')
      .insert([
        {
          data_saida: formData.data_saida,
          quantidade: parseFloat(formData.quantidade),
          destino: formData.destino,
          preparo_id: parseInt(formData.preparo_id),
          observacoes: formData.observacoes,
          user_id: user?.id
        }
      ])

    if (error) {
      alert('Erro ao salvar: ' + error.message)
      setLoading(false)
    } else {
      router.replace('/')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
      <header className="flex items-center gap-4 mb-8 pt-4">
        <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700 shadow-sm">
          <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold">Registrar Saída/Doação</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-6 max-w-md mx-auto">

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Data da Saída</label>
          <input
            type="date"
            required
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-celestial-500 outline-none dark:[color-scheme:dark]"
            value={formData.data_saida}
            onChange={e => setFormData({ ...formData, data_saida: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Origem (Qual Preparo?)</label>
          <select
            required
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-celestial-500 outline-none appearance-none"
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
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Destino (Núcleo ou Pessoa)</label>
          <input
            type="text"
            required
            placeholder="Ex: Núcleo Mestre Gabriel..."
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-celestial-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
            value={formData.destino}
            onChange={e => setFormData({ ...formData, destino: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Quantidade (Litros)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-celestial-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
              value={formData.quantidade}
              onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
            />
            <span className="absolute right-4 top-4 text-gray-500">L</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : (
            <>
              <Save className="w-5 h-5" />
              Confirmar Saída
            </>
          )}
        </button>

      </form>
    </main>
  )
}