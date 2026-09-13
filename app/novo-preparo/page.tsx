'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NovoPreparo() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)

  // Estado para controlar se é Preparo Local ou Doação
  const [tipoEntrada, setTipoEntrada] = useState<'Local' | 'Doação'>('Local')

  const [formData, setFormData] = useState({
    data_preparo: new Date().toISOString().split('T')[0],
    data_chegada: new Date().toISOString().split('T')[0],
    nucleo_origem: '',
    mestre_preparo: '',
    procedencia_mariri: '',
    procedencia_chacrona: '',
    quantidade_preparada: '',
    grau: '',
    status: 'Disponível'
  })

  const ehDoacao = tipoEntrada === 'Doação'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const user = session?.user

    const { error } = await supabase
      .from('preparos')
      .insert([
        {
          tipo: tipoEntrada,
          data_preparo: formData.data_preparo,
          data_chegada: ehDoacao ? formData.data_chegada : null, // Só salva se for doação
          nucleo_origem: ehDoacao ? formData.nucleo_origem : null,
          mestre_preparo: formData.mestre_preparo,
          procedencia_mariri: formData.procedencia_mariri,
          procedencia_chacrona: formData.procedencia_chacrona,
          quantidade_preparada: Number(formData.quantidade_preparada),
          grau: formData.grau,
          status: formData.status,
          user_id: user?.id
        }
      ])

    setLoading(false)

    if (error) {
      toast.error('Erro ao salvar', { description: error.message })
    } else {
      toast.success(ehDoacao ? 'Doação registrada' : 'Preparo registrado')
      router.replace('/estoque')
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Entrada de estoque</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <Tabs value={tipoEntrada} onValueChange={v => setTipoEntrada(v as 'Local' | 'Doação')}>
          <TabsList className="w-full">
            <TabsTrigger value="Local" className="flex-1">Produção local</TabsTrigger>
            <TabsTrigger value="Doação" className="flex-1">Doação recebida</TabsTrigger>
          </TabsList>
        </Tabs>

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
                  placeholder="Ex.: Núcleo Mestre Gabriel"
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
                placeholder="Nome do mestre responsável"
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
              <Label htmlFor="quantidade">Quantidade (litros) <span className="text-destructive">*</span></Label>
              <Input
                id="quantidade"
                type="number"
                step="0.1"
                min="0"
                placeholder="0,0"
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
                placeholder="Ex.: Apuração"
                value={formData.grau}
                onChange={e => setFormData({ ...formData, grau: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 data-slot="icon" className="animate-spin" /> : <Save data-slot="icon" />}
            {loading ? 'Salvando…' : ehDoacao ? 'Registrar recebimento' : 'Registrar produção'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}
