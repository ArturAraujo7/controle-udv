'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { MembroSimples } from '@/app/components/SeletorMembro'
import { CamposCondutores } from '@/components/sessao/CamposCondutores'
import { BotaoExcluir } from '@/components/BotaoExcluir'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

export default function EditarSessao({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preparos, setPreparos] = useState<PreparoSelect[]>([])

  const [formData, setFormData] = useState({
    data_realizacao: '',
    hora: '',
    tipo: '' as string,
    dirigentes: [] as { id: number | null, nome: string }[],
    tipo_delegacao: 'Transmissão da Assistência' as string,
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

  useEffect(() => {
    async function loadData() {
      // 1. Carrega Preparos disponíveis
      const { data: dataPreparos } = await supabase.from('preparos').select('id, data_preparo, mestre_preparo, grau, quantidade_preparada').order('data_preparo', { ascending: false })

      // 2. Carrega Sessão
      const { data: sessao, error } = await supabase.from('sessoes').select('*').eq('id', id).single()
      if (error) {
        toast.error('Sessão não encontrada')
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
      toast.error('Informe pelo menos um consumo válido.')
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
      toast.error('Erro ao atualizar sessão', { description: erroSessao.message })
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
      toast.error('Erro ao limpar consumos antigos', { description: erroDelete.message })
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
      toast.error('Erro ao salvar novos consumos', { description: erroInsert.message })
    } else {
      toast.success('Sessão atualizada')
      router.back()
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    const { error } = await supabase.from('sessoes').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
      setSaving(false)
    } else {
      toast.success('Sessão excluída')
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Editar sessão</h1>
        </div>
        <BotaoExcluir
          titulo="Excluir esta sessão?"
          descricao="A sessão e os consumos vinculados serão removidos, e o vegetal voltará ao saldo dos preparos. Esta ação não pode ser desfeita."
          disabled={saving}
          onConfirmar={handleDelete}
        />
      </div>

      <form onSubmit={handleUpdate} className="space-y-5 max-w-2xl">
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

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label>Vegetal servido <span className="text-destructive">*</span></Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                Total: {formatarNumero(totalConsumido)} L
              </span>
            </div>

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
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 data-slot="icon" className="animate-spin" /> : <Save data-slot="icon" />}
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}
