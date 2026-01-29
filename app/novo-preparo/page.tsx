'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Beaker, User } from 'lucide-react'
import Link from 'next/link'

export default function NovoPreparo() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    data_preparo: new Date().toISOString().split('T')[0],
    mestre_preparo: '',
    quantidade_preparada: '',
    grau: '',
    status: 'Disponível'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('preparos')
      .insert([
        {
          data_preparo: formData.data_preparo,
          mestre_preparo: formData.mestre_preparo,
          quantidade_preparada: Number(formData.quantidade_preparada),
          grau: formData.grau,
          status: formData.status
        }
      ])

    setLoading(false)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Preparo registrado com sucesso!')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold">Novo Preparo</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Data */}
        <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
          <label className="text-xs text-gray-400 font-medium block mb-1">Data do Preparo</label>
          <input 
            type="date" 
            className="w-full bg-transparent font-semibold outline-none text-white scheme-dark"
            value={formData.data_preparo}
            onChange={e => setFormData({...formData, data_preparo: e.target.value})}
          />
        </div>

        {/* Mestre do Preparo */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-3">
          <User className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <label className="text-xs text-gray-400 font-medium block">Mestre do Preparo</label>
            <input 
              type="text" 
              placeholder="Nome do Mestre"
              className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white"
              value={formData.mestre_preparo}
              onChange={e => setFormData({...formData, mestre_preparo: e.target.value})}
            />
          </div>
        </div>

        {/* Quantidade */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="w-4 h-4 text-green-500" />
            <label className="text-xs text-gray-400 font-medium">Quantidade (Litros)</label>
          </div>
          <input 
            type="number" 
            step="0.1"
            placeholder="0.0"
            className="w-full bg-transparent text-2xl font-bold outline-none text-white"
            value={formData.quantidade_preparada}
            onChange={e => setFormData({...formData, quantidade_preparada: e.target.value})}
          />
        </div>

        {/* Grau */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <label className="text-xs text-gray-400 font-medium block mb-1">Grau / Apuração</label>
          <input 
            type="text" 
            placeholder="Ex: 3,5º ou Especial"
            className="w-full bg-transparent outline-none font-medium placeholder-gray-600 text-white"
            value={formData.grau}
            onChange={e => setFormData({...formData, grau: e.target.value})}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {loading ? 'Salvando...' : (
            <>
              <Save className="w-5 h-5" />
              Registrar Preparo
            </>
          )}
        </button>

      </form>
    </div>
  )
}