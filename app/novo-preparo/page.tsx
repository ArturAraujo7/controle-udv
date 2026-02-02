'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Beaker, User, Truck, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function NovoPreparo() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Estado para controlar se é Preparo Local ou Doação
  const [tipoEntrada, setTipoEntrada] = useState<'Local' | 'Doação'>('Local')

  const [formData, setFormData] = useState({
    data_preparo: new Date().toISOString().split('T')[0],
    data_chegada: new Date().toISOString().split('T')[0], // Novo campo
    nucleo_origem: '', // Novo campo
    mestre_preparo: '',
    procedencia_mariri: '',
    procedencia_chacrona: '',
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
          tipo: tipoEntrada,
          data_preparo: formData.data_preparo,
          data_chegada: tipoEntrada === 'Doação' ? formData.data_chegada : null, // Só salva se for doação
          nucleo_origem: tipoEntrada === 'Doação' ? formData.nucleo_origem : null,
          mestre_preparo: formData.mestre_preparo,
          procedencia_mariri: formData.procedencia_mariri,
          procedencia_chacrona: formData.procedencia_chacrona,
          quantidade_preparada: Number(formData.quantidade_preparada),
          grau: formData.grau,
          status: formData.status
        }
      ])

    setLoading(false)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert(tipoEntrada === 'Local' ? 'Preparo registrado!' : 'Doação registrada!')
      router.push('/estoque')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold">Entrada de Estoque</h1>
      </div>

      {/* Seletor de Tipo */}
      <div className="flex bg-gray-800 p-1 rounded-xl mb-6 border border-gray-700">
        <button
          onClick={() => setTipoEntrada('Local')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            tipoEntrada === 'Local' 
              ? 'bg-green-600 text-white shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Produção Local
        </button>
        <button
          onClick={() => setTipoEntrada('Doação')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            tipoEntrada === 'Doação' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Doação Recebida
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* CAMPOS ESPECÍFICOS DE DOAÇÃO */}
        {tipoEntrada === 'Doação' && (
          <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <label className="text-sm font-bold text-blue-100">Dados do Recebimento</label>
            </div>
            
            <div>
              <label className="text-xs text-blue-200 font-medium block mb-1">Data de Chegada</label>
              <input 
                type="date" 
                className="w-full bg-gray-800 rounded-lg p-2 text-white border border-gray-700 outline-none focus:border-blue-500 [color-scheme:dark]"
                value={formData.data_chegada}
                onChange={e => setFormData({...formData, data_chegada: e.target.value})}
              />
            </div>

            <div>
              <label className="text-xs text-blue-200 font-medium block mb-1">Núcleo de Origem</label>
              <input 
                type="text" 
                placeholder="Ex: Núcleo Mestre Gabriel"
                className="w-full bg-gray-800 rounded-lg p-2 text-white border border-gray-700 outline-none focus:border-blue-500 placeholder-gray-500"
                value={formData.nucleo_origem}
                onChange={e => setFormData({...formData, nucleo_origem: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* DADOS DO VEGETAL (COMUNS) */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
            <Beaker className="w-5 h-5 text-green-500" />
            <label className="text-sm font-bold text-gray-200">Dados do Vegetal</label>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Data do Preparo</label>
            <input 
              type="date" 
              className="w-full bg-transparent font-semibold outline-none text-white [color-scheme:dark]"
              value={formData.data_preparo}
              onChange={e => setFormData({...formData, data_preparo: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Mestre do Preparo</label>
            <input 
              type="text" 
              placeholder="Nome do Mestre Responsável"
              className="w-full bg-transparent font-semibold outline-none text-white placeholder-gray-600"
              value={formData.mestre_preparo}
              onChange={e => setFormData({...formData, mestre_preparo: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Procedência Mariri</label>
              <input 
                type="text" 
                placeholder="Ex: Seringal Novo"
                className="w-full bg-transparent border-b border-gray-700 pb-1 outline-none text-white text-sm placeholder-gray-600 focus:border-green-500 transition-colors"
                value={formData.procedencia_mariri}
                onChange={e => setFormData({...formData, procedencia_mariri: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Procedência Chacrona</label>
              <input 
                type="text" 
                placeholder="Ex: Plantio Local"
                className="w-full bg-transparent border-b border-gray-700 pb-1 outline-none text-white text-sm placeholder-gray-600 focus:border-green-500 transition-colors"
                value={formData.procedencia_chacrona}
                onChange={e => setFormData({...formData, procedencia_chacrona: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Quantidade (L)</label>
              <input 
                type="number" 
                step="0.1"
                placeholder="0.0"
                className="w-full bg-transparent text-xl font-bold outline-none text-white"
                value={formData.quantidade_preparada}
                onChange={e => setFormData({...formData, quantidade_preparada: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Grau</label>
              <input 
                type="text" 
                placeholder="Apuração"
                className="w-full bg-transparent text-xl font-bold outline-none text-white placeholder-gray-600"
                value={formData.grau}
                onChange={e => setFormData({...formData, grau: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-4 text-white ${
            tipoEntrada === 'Local' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Salvando...' : (
            <>
              <Save className="w-5 h-5" />
              {tipoEntrada === 'Local' ? 'Registrar Produção' : 'Registrar Recebimento'}
            </>
          )}
        </button>

      </form>
    </div>
  )
}