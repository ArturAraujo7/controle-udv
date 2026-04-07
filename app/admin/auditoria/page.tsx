'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Database, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { SeletorMembro, MembroSimples } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'

type SessaoPendente = {
  id: string
  data_realizacao: string
  dirigente: string | null
  dirigente_id: number | null
  explanador: string | null
  explanador_id: number | null
  leitor_documentos: string | null
  leitor_documentos_id: number | null
  tipo: string
}

export default function Auditoria() {
  const router = useRouter()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sessoes, setSessoes] = useState<SessaoPendente[]>([])
  const [membros, setMembros] = useState<MembroSimples[]>([])

  useEffect(() => {
    if (!profile) return
    const ro = profile.role as string
    if (ro !== 'admin' && ro !== 'geral') {
      router.replace('/')
      return
    }

    const fetchData = async () => {
      const { data: membrosDB } = await supabase.from('membros').select('*').order('nome')
      if (membrosDB) setMembros(membrosDB as MembroSimples[])

      const { data: sessoesDB } = await supabase
        .from('sessoes')
        .select('*')
        .or('dirigente_id.is.null,explanador_id.is.null,leitor_documentos_id.is.null')
        .order('data_realizacao', { ascending: false })
      
      if (sessoesDB) {
          const validas = (sessoesDB as SessaoPendente[]).filter(s => 
             (s.dirigente && s.dirigente.trim() !== '' && s.dirigente_id === null) || 
             (s.explanador && s.explanador.trim() !== '' && s.explanador_id === null) || 
             (s.leitor_documentos && s.leitor_documentos.trim() !== '' && s.leitor_documentos_id === null)
          )
          setSessoes(validas)
      }
      setLoading(false)
    }
    fetchData()
  }, [profile, router])

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    setMembros([...membros, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  const handleUpdate = async (sessaoId: string, payload: any) => {
     const { error } = await supabase.from('sessoes').update(payload).eq('id', sessaoId)
     if (error) {
         alert('Erro ao atualizar: ' + error.message)
         return
     }
     
     setSessoes(sessoes.map(s => s.id === sessaoId ? { ...s, ...payload } : s).filter(s => 
        (s.dirigente && s.dirigente.trim() !== '' && s.dirigente_id === null) || 
        (s.explanador && s.explanador.trim() !== '' && s.explanador_id === null) || 
        (s.leitor_documentos && s.leitor_documentos.trim() !== '' && s.leitor_documentos_id === null)
     ))
  }

  const ItemAuditoria = ({ sessao }: { sessao: SessaoPendente }) => {
    const pendenteDirigente = sessao.dirigente && sessao.dirigente.trim() !== '' && !sessao.dirigente_id
    const pendenteExplanador = sessao.explanador && sessao.explanador.trim() !== '' && !sessao.explanador_id
    const pendenteLeitor = sessao.leitor_documentos && sessao.leitor_documentos.trim() !== '' && !sessao.leitor_documentos_id

    const [dirsSelect, setDirsSelect] = useState<{ id: number | null, nome: string }[]>([])
    const [tipoDeleg, setTipoDeleg] = useState('Transmissão da Assistência')
    const [expSelect, setExpSelect] = useState({ id: null as number | null, nome: '' })
    const [leiSelect, setLeiSelect] = useState({ id: null as number | null, nome: '' })

    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        // Se tinha texto mas não mapeou para o states ainda, deixamos o estado vazio pra que o usuario procure.
        // A prop placeholder mostrará o que ele deve puxar
        if (pendenteExplanador && sessao.explanador) setExpSelect({ id: null, nome: sessao.explanador })
        if (pendenteLeitor && sessao.leitor_documentos) setLeiSelect({ id: null, nome: sessao.leitor_documentos })
    }, [sessao, pendenteExplanador, pendenteLeitor])

    const saveChanges = async () => {
        setIsSaving(true)
        const payload: any = {}
        if (pendenteDirigente && dirsSelect.length > 0) {
            payload.dirigente_id = dirsSelect[0].id
            if (dirsSelect.length > 1) {
               payload.dirigente_2_id = dirsSelect[1].id
               payload.tipo_delegacao = tipoDeleg
            }
            payload.dirigente = dirsSelect.map(d => d.nome).join(' / ')
        }
        if (pendenteExplanador && expSelect.id) {
           payload.explanador_id = expSelect.id
           payload.explanador = expSelect.nome
        }
        if (pendenteLeitor && leiSelect.id) {
           payload.leitor_documentos_id = leiSelect.id
           payload.leitor_documentos = leiSelect.nome
        }
        
        await handleUpdate(sessao.id, payload)
        setIsSaving(false)
    }

    const hasSelection = (pendenteDirigente ? dirsSelect.length > 0 : true) && 
                         (pendenteExplanador ? !!expSelect.id : true) && 
                         (pendenteLeitor ? !!leiSelect.id : true)

    const canSave = hasSelection && (dirsSelect.length > 0 || expSelect.id || leiSelect.id)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                <div>
                   <span className="text-xs text-gray-500 font-mono">{new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}</span>
                   <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       {sessao.tipo}
                   </h3>
                </div>
            </div>
            
            <div className="space-y-4">
                {pendenteDirigente && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Dirigentes pendentes: <span className="font-bold text-red-500">"{sessao.dirigente}"</span></label>
                        <SeletorMultiploMembro 
                            membros={membros} 
                            onMembroAdicionado={handleMembroAdicionado} 
                            value={dirsSelect} 
                            onChange={setDirsSelect} 
                            placeholder="Mapeie titular (e opcional)..." 
                            max={2}
                        />
                        
                        {dirsSelect.length > 1 && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Tipo de Delegação</label>
                                <select 
                                    value={tipoDeleg} 
                                    onChange={e => setTipoDeleg(e.target.value)}
                                    className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 outline-none"
                                >
                                    <option value="Transmissão da Assistência">Transmissão da Assistência</option>
                                    <option value="Transmissão da Representação">Transmissão da Representação</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}
                {pendenteLeitor && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Leitor pendente: <span className="font-bold text-red-500">"{sessao.leitor_documentos}"</span></label>
                        <SeletorMembro membros={membros} onMembroAdicionado={handleMembroAdicionado} value={leiSelect} onChange={setLeiSelect} placeholder="Selecione o membro correto..." />
                    </div>
                )}
                {pendenteExplanador && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Explanador pendente: <span className="font-bold text-red-500">"{sessao.explanador}"</span></label>
                        <SeletorMembro membros={membros} onMembroAdicionado={handleMembroAdicionado} value={expSelect} onChange={setExpSelect} placeholder="Selecione o membro correto..." />
                    </div>
                )}
            </div>
            
            <button 
                onClick={saveChanges}
                disabled={!canSave || isSaving}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400 text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
                {isSaving ? 'Aplicando...' : 'Aplicar Correção'}
            </button>
        </div>
    )
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-500">
            <span className="animate-pulse">Buscando pendências de integridade...</span>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20 text-gray-900 dark:text-white transition-colors duration-300">
        <header className="flex items-center mb-6">
            <button type="button" onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm mr-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </button>
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" /> 
                    Auditoria de Dados
                </h1>
                <p className="text-xs text-gray-500">Relacionamento de Membros nas Sessões</p>
            </div>
        </header>

        <div className="max-w-md mx-auto space-y-4">
            {sessoes.length === 0 ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-lg font-bold text-green-900 dark:text-green-400 mb-2">Tudo perfeito!</h2>
                    <p className="text-sm text-green-700 dark:text-green-500">
                        Não existem sessões históricas pendentes de validação de IDs de membro. Banco íntegro.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                        Encontramos {sessoes.length} sessões pendentes onde os nomes não possuem um ID de Membro amarrado. Cadastre os visitantes na hora, ou puxe um associado existente da lista.
                    </div>
                    {sessoes.map(s => <ItemAuditoria key={s.id} sessao={s} />)}
                </div>
            )}
        </div>
    </div>
  )
}
