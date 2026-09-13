'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
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

export default function NovaSessaoHistorica() {
  const router = useRouter()
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [membros, setMembros] = useState<MembroSimples[]>([])

  useEffect(() => {
    const fetchMembros = async () => {
      const { data: membrosDB } = await supabase
        .from('membros')
        .select('*')
        .order('nome')
      if (membrosDB) {
        setMembros(membrosDB as MembroSimples[])
      }
    }
    fetchMembros()
  }, [])

  const [formData, setFormData] = useState({
    data_realizacao: new Date().toISOString().split('T')[0],
    hora: '20:00',
    tipo: 'Escala' as string,
    dirigentes: [] as { id: number | null, nome: string }[],
    tipo_delegacao: 'Transmissão da Assistência' as string,
    explanador: { id: null as number | null, nome: '' },
    leitor_documentos: { id: null as number | null, nome: '' },
  })

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    const novaLista = [...membros, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome))
    setMembros(novaLista)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const dataCompleta = `${formData.data_realizacao}T${formData.hora}:00`

    const user = session?.user

    // Cria a Sessão apenas
    const { error: erroSessao } = await supabase
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
        quantidade_participantes: 0, // 0 hardcoded para Sessões Históricas (NOT NULL)
        user_id: user?.id
      }])

    setLoading(false)

    if (erroSessao) {
      toast.error('Erro ao registrar sessão histórica', { description: erroSessao.message })
      return
    }

    toast.success('Sessão histórica registrada')
    router.replace('/')
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Registro histórico</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 ml-12">
        Memória institucional de sessões anteriores — sem participantes nem consumo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
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
          <CardContent>
            <CamposCondutores
              dirigentes={formData.dirigentes}
              tipoDelegacao={formData.tipo_delegacao}
              leitor={formData.leitor_documentos}
              explanador={formData.explanador}
              membros={membros}
              rotuloDirigente="Quem estava na responsabilidade?"
              opcional
              onDirigentesChange={val => setFormData({ ...formData, dirigentes: val })}
              onTipoDelegacaoChange={tipo_delegacao => setFormData({ ...formData, tipo_delegacao })}
              onLeitorChange={val => setFormData({ ...formData, leitor_documentos: val })}
              onExplanadorChange={val => setFormData({ ...formData, explanador: val })}
              onMembroAdicionado={handleMembroAdicionado}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 data-slot="icon" className="animate-spin" /> : <Save data-slot="icon" />}
            {loading ? 'Registrando…' : 'Salvar histórico'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}
