'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Beaker, Trash2, Truck } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

export default function EditarPreparo({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estado para controlar o tipo (Local ou Doação)
  const [tipoEntrada, setTipoEntrada] = useState<'Local' | 'Doação'>('Local')

  const [formData, setFormData] = useState({
    data_preparo: '',
    data_chegada: '',
    nucleo_origem: '',
    mestre_preparo: '',
    quantidade_preparada: '',
    grau: '',
    status: ''
  })

  useEffect(() => {
    async function loadPreparo() {
      const { data: preparo, error } = await supabase.from('preparos').select('*').eq('id', id).single()

      if (error) {
        alert('Preparo não encontrado!')
        router.push('/estoque')
        return
      }

      setTipoEntrada(preparo.tipo === 'Doação' ? 'Doação' : 'Local')

      setFormData({
        data_preparo: preparo.data_preparo,
        data_chegada: preparo.data_chegada || '',
        nucleo_origem: preparo.nucleo_origem || '',
        mestre_preparo: preparo.mestre_preparo,
        quantidade_preparada: String(preparo.quantidade_preparada),
        grau: preparo.grau,
        status: preparo.status
      })
      setLoading(false)
    }
    loadPreparo()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('preparos').update({
      tipo: tipoEntrada,
      data_preparo: formData.data_preparo,
      data_chegada: tipoEntrada === 'Doação' ? formData.data_chegada : null,
      nucleo_origem: tipoEntrada === 'Doação' ? formData.nucleo_origem : null,
      mestre_preparo: formData.mestre_preparo,
      quantidade_preparada: Number(formData.quantidade_preparada),
      grau: formData.grau,
      status: formData.status
    }).eq('id', id)

    setSaving(false)
    if (error) alert('Erro: ' + error.message)
    else { alert('Atualizado!'); router.push('/estoque') }
  }

  const handleDelete = async () => {
    if (confirm('ATENÇÃO: Excluir este preparo pode quebrar o histórico das sessões que consumiram dele. Tem certeza?')) {
      setSaving(true)
      const { error } = await supabase.from('preparos').delete().eq('id', id)
      if (error) alert('Erro: ' + error.message)
      else router.push('/estoque')
    }
  }

  if (loading) return <p className="text-center p-10 text-gray-500">Carregando...</p>

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/estoque" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Editar Estoque</h1>
        </div>
        <button onClick={handleDelete} className="p-2 text-red-400 bg-red-900/30 rounded-full hover:bg-red-900/50">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        
        {/* Seletor de Tipo (apenas visual ou editável se quiser mudar o tipo depois) */}
        <div className="flex bg-gray-800 p-1 rounded-xl mb-6 border border-gray-700 opacity-50 pointer-events-none"> {/* Desabilitei mudança de tipo pra evitar confusão, mas pode habilitar tirando pointer-events-none */}
          <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-bold ${tipoEntrada === 'Local' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Produção Local</button>
          <button type="button" className={`flex-1 py-2 rounded-lg text-sm font-bold ${tipoEntrada === 'Doação' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Doação Recebida</button>
        </div>

        {tipoEntrada === 'Doação' && (
          <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 space-y-4">
            <div className="flex items-center gap-2 mb-2"><Truck className="w-5 h-5 text-blue-400" /><label className="text-sm font-bold text-blue-100">Dados do Recebimento</label></div>
            <div><label className="text-xs text-blue-200 font-medium block mb-1">Chegada</label><input type="date" className="w-full bg-gray-800 rounded-lg p-2 text-white border border-gray-700 outline-none [color-scheme:dark]" value={formData.data_chegada} onChange={e => setFormData({...formData, data_chegada: e.target.value})} /></div>
            <div><label className="text-xs text-blue-200 font-medium block mb-1">Origem</label><input type="text" className="w-full bg-gray-800 rounded-lg p-2 text-white border border-gray-700 outline-none" value={formData.nucleo_origem} onChange={e => setFormData({...formData, nucleo_origem: e.target.value})} /></div>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2"><Beaker className="w-5 h-5 text-green-500" /><label className="text-sm font-bold text-gray-200">Dados do Vegetal</label></div>
          <div><label className="text-xs text-gray-400 font-medium block mb-1">Data Preparo</label><input type="date" className="w-full bg-transparent font-semibold outline-none text-white [color-scheme:dark]" value={formData.data_preparo} onChange={e => setFormData({...formData, data_preparo: e.target.value})} /></div>
          <div><label className="text-xs text-gray-400 font-medium block mb-1">Mestre</label><input type="text" className="w-full bg-transparent font-semibold outline-none text-white" value={formData.mestre_preparo} onChange={e => setFormData({...formData, mestre_preparo: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div><label className="text-xs text-gray-400 font-medium block mb-1">Qtd (L)</label><input type="number" step="0.1" className="w-full bg-transparent text-xl font-bold outline-none text-white" value={formData.quantidade_preparada} onChange={e => setFormData({...formData, quantidade_preparada: e.target.value})} /></div>
            <div><label className="text-xs text-gray-400 font-medium block mb-1">Grau</label><input type="text" className="w-full bg-transparent text-xl font-bold outline-none text-white" value={formData.grau} onChange={e => setFormData({...formData, grau: e.target.value})} /></div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-4">
          {saving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
        </button>
      </form>
    </div>
  )
}