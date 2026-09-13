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
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TIPOS_SESSAO } from '@/lib/constants'

export default function EditarSessaoHistorica({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    data_realizacao: '',
    hora: '',
    tipo: '' as string,
    dirigente: '',
    explanador: '',
    leitor_documentos: '',
  })

  useEffect(() => {
    async function loadData() {
      const { data: sessao, error } = await supabase
        .from('sessoes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast.error('Sessão histórica não encontrada')
        router.replace('/sessoes')
        return
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

      setFormData({
        data_realizacao: dateVal,
        hora: timeVal,
        tipo: sessao.tipo,
        dirigente: sessao.dirigente,
        explanador: sessao.explanador || '',
        leitor_documentos: sessao.leitor_documentos || '',
      })

      setLoading(false)
    }
    loadData()
  }, [id, router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`

    const { error: erroSessao } = await supabase
      .from('sessoes')
      .update({
        data_realizacao: dataCompleta,
        tipo: formData.tipo,
        dirigente: formData.dirigente,
        explanador: formData.explanador,
        leitor_documentos: formData.leitor_documentos,
      })
      .eq('id', id)

    setSaving(false)

    if (erroSessao) {
      toast.error('Erro ao atualizar', { description: erroSessao.message })
      return
    }

    toast.success('Sessão histórica atualizada')
    router.back()
  }

  const handleDelete = async () => {
    setSaving(true)
    const { error } = await supabase.from('sessoes').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
      setSaving(false)
    } else {
      toast.success('Sessão histórica excluída')
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 rounded-xl" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Editar registro histórico</h1>
        </div>
        <BotaoExcluir
          titulo="Excluir este registro histórico?"
          descricao="A memória desta sessão será removida permanentemente. Esta ação não pode ser desfeita."
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
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dirigente">Mestre dirigente</Label>
              <Input
                id="dirigente"
                value={formData.dirigente}
                onChange={e => setFormData({ ...formData, dirigente: e.target.value })}
                placeholder="Nome de quem estava na responsabilidade"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="leitor">Leitor de documentos</Label>
                <Input
                  id="leitor"
                  value={formData.leitor_documentos}
                  onChange={e => setFormData({ ...formData, leitor_documentos: e.target.value })}
                  placeholder="Quem leu?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="explanador">Explanador</Label>
                <Input
                  id="explanador"
                  value={formData.explanador}
                  onChange={e => setFormData({ ...formData, explanador: e.target.value })}
                  placeholder="Quem explanou?"
                />
              </div>
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
