'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { BotaoExcluir } from '@/components/BotaoExcluir'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarPreparo({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Tipo (Local ou Doação) é definido na criação e exibido apenas como referência
  const [tipoEntrada, setTipoEntrada] = useState<'Local' | 'Doação'>('Local')

  const [formData, setFormData] = useState({
    data_preparo: '',
    data_chegada: '',
    nucleo_origem: '',
    mestre_preparo: '',
    procedencia_mariri: '',
    procedencia_chacrona: '',
    quantidade_preparada: '',
    grau: '',
    status: ''
  })

  useEffect(() => {
    async function loadPreparo() {
      const { data: preparo, error } = await supabase.from('preparos').select('*').eq('id', id).single()

      if (error) {
        toast.error('Preparo não encontrado')
        router.replace('/estoque')
        return
      }

      setTipoEntrada(preparo.tipo === 'Doação' ? 'Doação' : 'Local')

      setFormData({
        data_preparo: preparo.data_preparo,
        data_chegada: preparo.data_chegada || '',
        nucleo_origem: preparo.nucleo_origem || '',
        mestre_preparo: preparo.mestre_preparo,
        procedencia_mariri: preparo.procedencia_mariri || '',
        procedencia_chacrona: preparo.procedencia_chacrona || '',
        quantidade_preparada: String(preparo.quantidade_preparada),
        grau: preparo.grau,
        status: preparo.status
      })
      setLoading(false)
    }
    loadPreparo()
  }, [id, router])

  const ehDoacao = tipoEntrada === 'Doação'

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('preparos').update({
      tipo: tipoEntrada,
      data_preparo: formData.data_preparo,
      data_chegada: ehDoacao ? formData.data_chegada : null,
      nucleo_origem: ehDoacao ? formData.nucleo_origem : null,
      mestre_preparo: formData.mestre_preparo,
      procedencia_mariri: formData.procedencia_mariri,
      procedencia_chacrona: formData.procedencia_chacrona,
      quantidade_preparada: Number(formData.quantidade_preparada),
      grau: formData.grau,
      status: formData.status
    }).eq('id', id)

    setSaving(false)
    if (error) {
      toast.error('Erro ao salvar', { description: error.message })
    } else {
      toast.success('Preparo atualizado')
      router.back()
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    const { error } = await supabase.from('preparos').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
      setSaving(false)
    } else {
      toast.success('Preparo excluído')
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Editar preparo</h1>
          <Badge variant="outline">{ehDoacao ? 'Doação recebida' : 'Produção local'}</Badge>
        </div>
        <BotaoExcluir
          titulo="Excluir este preparo?"
          descricao="O histórico das sessões que consumiram deste preparo pode ficar inconsistente. Esta ação não pode ser desfeita."
          disabled={saving}
          onConfirmar={handleDelete}
        />
      </div>

      <form onSubmit={handleUpdate} className="space-y-5 max-w-2xl">
        {ehDoacao && (
          <Card>
            <CardContent className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="data-chegada">Data de chegada</Label>
                <Input
                  id="data-chegada"
                  type="date"
                  value={formData.data_chegada}
                  onChange={e => setFormData({ ...formData, data_chegada: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nucleo">Núcleo de origem</Label>
                <Input
                  id="nucleo"
                  value={formData.nucleo_origem}
                  onChange={e => setFormData({ ...formData, nucleo_origem: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="data-preparo">Data do preparo</Label>
              <Input
                id="data-preparo"
                type="date"
                value={formData.data_preparo}
                onChange={e => setFormData({ ...formData, data_preparo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mestre">Mestre do preparo</Label>
              <Input
                id="mestre"
                value={formData.mestre_preparo}
                onChange={e => setFormData({ ...formData, mestre_preparo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mariri">Procedência do mariri</Label>
              <Input
                id="mariri"
                placeholder="Ex.: Seringal Novo"
                value={formData.procedencia_mariri}
                onChange={e => setFormData({ ...formData, procedencia_mariri: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chacrona">Procedência da chacrona</Label>
              <Input
                id="chacrona"
                placeholder="Ex.: Plantio local"
                value={formData.procedencia_chacrona}
                onChange={e => setFormData({ ...formData, procedencia_chacrona: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade (litros)</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.1"
                min="0"
                className="tabular-nums"
                value={formData.quantidade_preparada}
                onChange={e => setFormData({ ...formData, quantidade_preparada: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grau">Grau</Label>
              <Input
                id="grau"
                value={formData.grau}
                onChange={e => setFormData({ ...formData, grau: e.target.value })}
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
