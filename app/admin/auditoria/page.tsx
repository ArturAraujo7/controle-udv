'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { SeletorMembro, MembroSimples } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TIPOS_DELEGACAO } from '@/lib/constants'
import { formatarData } from '@/lib/formato'

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

type PayloadCorrecao = Partial<{
  dirigente: string
  dirigente_id: number | null
  dirigente_2_id: number | null
  tipo_delegacao: string
  explanador: string
  explanador_id: number | null
  leitor_documentos: string
  leitor_documentos_id: number | null
}>

/** Uma sessão continua pendente enquanto houver nome em texto sem ID vinculado. */
function aindaPendente(s: SessaoPendente) {
  return (
    (!!s.dirigente && s.dirigente.trim() !== '' && s.dirigente_id === null) ||
    (!!s.explanador && s.explanador.trim() !== '' && s.explanador_id === null) ||
    (!!s.leitor_documentos && s.leitor_documentos.trim() !== '' && s.leitor_documentos_id === null)
  )
}

function ItemAuditoria({
  sessao,
  membros,
  onMembroAdicionado,
  onAplicar,
}: {
  sessao: SessaoPendente
  membros: MembroSimples[]
  onMembroAdicionado: (m: MembroSimples) => void
  onAplicar: (id: string, payload: PayloadCorrecao) => Promise<void>
}) {
  const pendenteDirigente = !!sessao.dirigente && sessao.dirigente.trim() !== '' && !sessao.dirigente_id
  const pendenteExplanador = !!sessao.explanador && sessao.explanador.trim() !== '' && !sessao.explanador_id
  const pendenteLeitor = !!sessao.leitor_documentos && sessao.leitor_documentos.trim() !== '' && !sessao.leitor_documentos_id

  const [dirsSelect, setDirsSelect] = useState<{ id: number | null, nome: string }[]>([])
  const [tipoDeleg, setTipoDeleg] = useState<string>('Transmissão da Assistência')
  // Pré-preenchidos com o texto legado para que o usuário saiba quem procurar.
  // Cada item é montado com key={sessao.id}, então o estado inicial basta.
  const [expSelect, setExpSelect] = useState(
    () => ({ id: null as number | null, nome: pendenteExplanador ? sessao.explanador ?? '' : '' })
  )
  const [leiSelect, setLeiSelect] = useState(
    () => ({ id: null as number | null, nome: pendenteLeitor ? sessao.leitor_documentos ?? '' : '' })
  )
  const [isSaving, setIsSaving] = useState(false)

  const saveChanges = async () => {
    setIsSaving(true)
    const payload: PayloadCorrecao = {}
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

    await onAplicar(sessao.id, payload)
    setIsSaving(false)
  }

  const hasSelection =
    (pendenteDirigente ? dirsSelect.length > 0 : true) &&
    (pendenteExplanador ? !!expSelect.id : true) &&
    (pendenteLeitor ? !!leiSelect.id : true)

  const canSave = hasSelection && (dirsSelect.length > 0 || !!expSelect.id || !!leiSelect.id)

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground tabular-nums">{formatarData(sessao.data_realizacao)}</p>
            <h3 className="font-medium">{sessao.tipo}</h3>
          </div>
          <Badge variant="outline">Pendente</Badge>
        </div>

        <Separator />

        {pendenteDirigente && (
          <div className="space-y-2">
            <Label>
              Dirigente registrado como{' '}
              <span className="font-normal text-muted-foreground">“{sessao.dirigente}”</span>
            </Label>
            <SeletorMultiploMembro
              membros={membros}
              onMembroAdicionado={onMembroAdicionado}
              value={dirsSelect}
              onChange={setDirsSelect}
              placeholder="Vincule o membro correspondente…"
              max={2}
            />
            {dirsSelect.length > 1 && (
              <div className="space-y-2 pt-2">
                <Label htmlFor={`deleg-${sessao.id}`}>Classificação da delegação</Label>
                <Select value={tipoDeleg} onValueChange={setTipoDeleg}>
                  <SelectTrigger id={`deleg-${sessao.id}`} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_DELEGACAO.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {pendenteLeitor && (
          <div className="space-y-2">
            <Label>
              Leitor registrado como{' '}
              <span className="font-normal text-muted-foreground">“{sessao.leitor_documentos}”</span>
            </Label>
            <SeletorMembro
              membros={membros}
              onMembroAdicionado={onMembroAdicionado}
              value={leiSelect}
              onChange={setLeiSelect}
              placeholder="Vincule o membro correspondente…"
            />
          </div>
        )}

        {pendenteExplanador && (
          <div className="space-y-2">
            <Label>
              Explanador registrado como{' '}
              <span className="font-normal text-muted-foreground">“{sessao.explanador}”</span>
            </Label>
            <SeletorMembro
              membros={membros}
              onMembroAdicionado={onMembroAdicionado}
              value={expSelect}
              onChange={setExpSelect}
              placeholder="Vincule o membro correspondente…"
            />
          </div>
        )}

        <Button onClick={saveChanges} disabled={!canSave || isSaving} className="w-full">
          {isSaving && <Loader2 data-slot="icon" className="animate-spin" />}
          {isSaving ? 'Aplicando…' : 'Aplicar correção'}
        </Button>
      </CardContent>
    </Card>
  )
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
        setSessoes((sessoesDB as SessaoPendente[]).filter(aindaPendente))
      }
      setLoading(false)
    }
    fetchData()
  }, [profile, router])

  const handleMembroAdicionado = (novoMembro: MembroSimples) => {
    setMembros(prev => [...prev, novoMembro].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  const handleUpdate = async (sessaoId: string, payload: PayloadCorrecao) => {
    const { error } = await supabase.from('sessoes').update(payload).eq('id', sessaoId)
    if (error) {
      toast.error('Erro ao aplicar correção', { description: error.message })
      return
    }

    toast.success('Correção aplicada')
    setSessoes(prev =>
      prev.map(s => s.id === sessaoId ? { ...s, ...payload } : s).filter(aindaPendente)
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoria de dados</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 ml-12">
        Sessões cujos nomes ainda estão só em texto, sem vínculo com o cadastro de membros.
      </p>

      <div className="max-w-2xl space-y-4">
        {sessoes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
              <h2 className="font-medium">Nenhuma pendência</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Todas as sessões têm seus dirigentes, leitores e explanadores vinculados ao cadastro de membros.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {sessoes.length} {sessoes.length === 1 ? 'sessão pendente' : 'sessões pendentes'}. Vincule cada
              nome a um membro existente, ou cadastre o visitante na hora pelo próprio seletor.
            </p>
            {sessoes.map(s => (
              <ItemAuditoria
                key={s.id}
                sessao={s}
                membros={membros}
                onMembroAdicionado={handleMembroAdicionado}
                onAplicar={handleUpdate}
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}
