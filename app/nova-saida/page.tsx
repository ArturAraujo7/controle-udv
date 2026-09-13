'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatarData } from '@/lib/formato'

type Preparo = {
  id: number
  data_preparo: string
  mestre_preparo: string
  grau: string
  quantidade_preparada: number
}

export default function NovaSaida() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preparos, setPreparos] = useState<Preparo[]>([])

  const [formData, setFormData] = useState({
    data_saida: new Date().toISOString().split('T')[0],
    quantidade: '',
    destino: '',
    preparo_id: '',
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

    const { error } = await supabase
      .from('saidas')
      .insert([
        {
          data_saida: formData.data_saida,
          quantidade: parseFloat(formData.quantidade),
          destino: formData.destino,
          preparo_id: parseInt(formData.preparo_id)
        }
      ])

    if (error) {
      toast.error('Erro ao salvar', { description: error.message })
      setLoading(false)
    } else {
      toast.success('Saída registrada')
      router.replace('/')
      router.refresh()
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Registrar saída / doação</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
        <Card>
          <CardContent className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="data-saida">Data da saída <span className="text-destructive">*</span></Label>
              <Input
                id="data-saida"
                type="date"
                required
                value={formData.data_saida}
                onChange={e => setFormData({ ...formData, data_saida: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparo">Preparo de origem <span className="text-destructive">*</span></Label>
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
              {preparos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum preparo com saldo disponível.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Destino (núcleo ou pessoa) <span className="text-destructive">*</span></Label>
              <Input
                id="destino"
                required
                placeholder="Ex.: Núcleo Mestre Gabriel"
                value={formData.destino}
                onChange={e => setFormData({ ...formData, destino: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade (litros) <span className="text-destructive">*</span></Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                className="tabular-nums"
                value={formData.quantidade}
                onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !formData.preparo_id}>
            {loading ? <Loader2 data-slot="icon" className="animate-spin" /> : <Save data-slot="icon" />}
            {loading ? 'Salvando…' : 'Confirmar saída'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}
