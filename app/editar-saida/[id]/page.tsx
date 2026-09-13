'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { BotaoExcluir } from '@/components/BotaoExcluir'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatarData } from '@/lib/formato'

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
        toast.error('Saída não encontrada')
        router.replace('/estoque')
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
      toast.error('Erro ao atualizar', { description: error.message })
      setSaving(false)
    } else {
      toast.success('Saída atualizada')
      router.back()
      router.refresh()
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    const { error } = await supabase.from('saidas').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
      setSaving(false)
    } else {
      toast.success('Saída excluída — o estoque foi devolvido')
      router.back()
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-80 rounded-xl" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Editar saída</h1>
        </div>
        <BotaoExcluir
          titulo="Excluir este registro de saída?"
          descricao="A quantidade será devolvida ao saldo do preparo de origem. Esta ação não pode ser desfeita."
          disabled={saving}
          onConfirmar={handleDelete}
        />
      </div>

      <form onSubmit={handleUpdate} className="space-y-5 max-w-2xl">
        <Card>
          <CardContent className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="data-saida">Data da saída</Label>
              <Input
                id="data-saida"
                type="date"
                required
                value={formData.data_saida}
                onChange={e => setFormData({ ...formData, data_saida: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparo">Preparo de origem</Label>
              <Select
                value={formData.preparo_id}
                onValueChange={preparo_id => setFormData({ ...formData, preparo_id })}
              >
                <SelectTrigger id="preparo" className="w-full">
                  <SelectValue placeholder="Selecione um preparo…" />
                </SelectTrigger>
                <SelectContent>
                  {preparos.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {formatarData(p.data_preparo)} · {p.mestre_preparo} ({p.grau})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Destino</Label>
              <Input
                id="destino"
                required
                value={formData.destino}
                onChange={e => setFormData({ ...formData, destino: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade (litros)</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                min="0"
                required
                className="tabular-nums"
                value={formData.quantidade}
                onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={3}
                placeholder="Contexto da saída, quem levou, etc."
                value={formData.observacoes}
                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
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
