'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { MembroSimples } from '@/app/components/SeletorMembro'
import { CamposCondutores } from '@/components/sessao/CamposCondutores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TIPOS_SESSAO } from '@/lib/constants'
import { formatarData, formatarNumero } from '@/lib/formato'

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

export default function NovaSessao() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [preparos, setPreparos] = useState<PreparoSelect[]>([])

  // Lista de membros carregada do banco
  const [membros, setMembros] = useState<MembroSimples[]>([])

  // Estado para a lista de consumos
  const [consumos, setConsumos] = useState<ConsumoItem[]>([{ id_preparo: '', quantidade: '' }])

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Preparos
      const { data: preparos } = await supabase
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

      // 2. Fetch Membros
      const { data: membrosDB } = await supabase
        .from('membros')
        .select('*')
        .order('nome')
      if (membrosDB) {
        setMembros(membrosDB as MembroSimples[])
      }
    }
    fetchData()
  }, [])

  const [formData, setFormData] = useState({
    data_realizacao: new Date().toISOString().split('T')[0],
    hora: '20:00',
    tipo: 'Escala' as string,
    dirigentes: [] as { id: number | null, nome: string }[],
    tipo_delegacao: 'Transmissão da Assistência' as string,
    explanador: { id: null as number | null, nome: '' },
    leitor_documentos: { id: null as number | null, nome: '' },
    quantidade_participantes: '',
  })

  // Funções para manipular a lista de consumos
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

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    // Reordenando a lista na memória após inserção rápida
    const novaLista = [...membros, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome))
    setMembros(novaLista)
  }

  // Calcula o total consumido para exibição ou validação
  const totalConsumido = consumos.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validação básica
    const consumosValidos = consumos.filter(c => c.id_preparo && c.quantidade)
    if (consumosValidos.length === 0) {
      toast.error('Selecione pelo menos um preparo e informe a quantidade.')
      setLoading(false)
      return
    }

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`
    const user = session?.user

    // 1. Cria a Sessão
    const { data: sessao, error: erroSessao } = await supabase
      .from('sessoes')
      .insert([{
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
        user_id: user?.id
      }])
      .select()
      .single()

    if (erroSessao) {
      toast.error('Erro ao criar sessão', { description: erroSessao.message })
      setLoading(false)
      return
    }

    // 2. Salva os Consumos vinculados à sessão criada
    const consumosParaSalvar = consumosValidos.map(c => ({
      id_sessao: sessao.id,
      id_preparo: Number(c.id_preparo),
      quantidade_consumida: Number(c.quantidade)
    }))

    const { error: erroConsumos } = await supabase
      .from('consumos_sessao')
      .insert(consumosParaSalvar)

    setLoading(false)

    if (erroConsumos) {
      toast.error('Sessão criada, mas os consumos não foram salvos', { description: erroConsumos.message })
    } else {
      toast.success('Sessão registrada com sucesso')
      router.replace('/')
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Nova sessão</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

        {/* Quando */}
        <Card>
          <CardContent className="grid sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_realizacao}
                onChange={e => setFormData({ ...formData, data_realizacao: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={e => setFormData({ ...formData, hora: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de sessão</Label>
              <Select value={formData.tipo} onValueChange={tipo => setFormData({ ...formData, tipo })}>
                <SelectTrigger id="tipo" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SESSAO.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vegetal servido */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>Vegetal servido <span className="text-destructive">*</span></Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                Total: {formatarNumero(totalConsumido)} L
              </span>
            </div>

            {preparos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum preparo com saldo disponível. Registre um preparo antes de lançar a sessão.
              </p>
            )}

            <div className="space-y-3">
              {consumos.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={item.id_preparo}
                    onValueChange={value => updateConsumo(index, 'id_preparo', value)}
                  >
                    <SelectTrigger className="flex-1" aria-label={`Preparo ${index + 1}`}>
                      <SelectValue placeholder="Selecione o preparo…" />
                    </SelectTrigger>
                    <SelectContent>
                      {preparos.map(prep => (
                        <SelectItem key={prep.id} value={String(prep.id)}>
                          {formatarData(prep.data_preparo)} · {prep.mestre_preparo} ({prep.grau})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Litros"
                    className="w-24 text-center tabular-nums"
                    aria-label={`Quantidade em litros do preparo ${index + 1}`}
                    value={item.quantidade}
                    onChange={e => updateConsumo(index, 'quantidade', e.target.value)}
                    required
                  />
                  {consumos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConsumo(index)}
                      aria-label={`Remover preparo ${index + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addConsumo} className="w-full">
              <Plus data-slot="icon" /> Adicionar outro preparo
            </Button>
          </CardContent>
        </Card>

        {/* Quem conduziu */}
        <Card>
          <CardContent className="space-y-5">
            <CamposCondutores
              dirigentes={formData.dirigentes}
              tipoDelegacao={formData.tipo_delegacao}
              leitor={formData.leitor_documentos}
              explanador={formData.explanador}
              membros={membros}
              onDirigentesChange={val => setFormData({ ...formData, dirigentes: val })}
              onTipoDelegacaoChange={tipo_delegacao => setFormData({ ...formData, tipo_delegacao })}
              onLeitorChange={val => setFormData({ ...formData, leitor_documentos: val })}
              onExplanadorChange={val => setFormData({ ...formData, explanador: val })}
              onMembroAdicionado={handleMembroAdicionado}
            />

            <div className="space-y-2">
              <Label htmlFor="participantes">Total de participantes</Label>
              <Input
                id="participantes"
                type="number"
                min="0"
                placeholder="0"
                className="tabular-nums sm:max-w-40"
                value={formData.quantidade_participantes}
                onChange={e => setFormData({ ...formData, quantidade_participantes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 data-slot="icon" className="animate-spin" /> : <Save data-slot="icon" />}
            {loading ? 'Salvando…' : 'Registrar sessão'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}
