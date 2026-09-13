'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Search, Users, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { BotaoExcluir } from '@/components/BotaoExcluir'
import { GRAUS_MEMBRO } from '@/lib/constants'

export type Membro = {
  id: number
  nome: string
  nome_exibicao?: string | null
  grau: string
  tipo_vinculo: 'Local' | 'Visitante'
  nucleo_origem: string | null
  ativo: boolean
  user_id?: string
}

/** Peso para ordenar por hierarquia institucional. */
const grauPeso: Record<string, number> = Object.fromEntries(
  GRAUS_MEMBRO.map((grau, i) => [grau, i + 1])
)

export default function GestaoMembros() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    nome_exibicao: '',
    grau: 'Sócio',
    tipo_vinculo: 'Local' as 'Local' | 'Visitante',
    nucleo_origem: '',
    ativo: true,
  })

  // Fetch Membros
  const fetchMembros = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('nome', { ascending: true })

    if (data) {
      setMembros(data)
    } else {
      console.error('Erro ao buscar membros:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembros()
  }, [])

  // Handlers
  const handleOpenModal = (membro?: Membro) => {
    if (membro) {
      setEditingMembro(membro)
      setFormData({
        nome: membro.nome,
        nome_exibicao: membro.nome_exibicao || '',
        grau: membro.grau || 'Sócio',
        tipo_vinculo: membro.tipo_vinculo,
        nucleo_origem: membro.nucleo_origem || '',
        ativo: membro.ativo,
      })
    } else {
      setEditingMembro(null)
      setFormData({
        nome: '',
        nome_exibicao: '',
        grau: 'Sócio',
        tipo_vinculo: 'Local',
        nucleo_origem: '',
        ativo: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMembro(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        nome: formData.nome,
        nome_exibicao: formData.nome_exibicao,
        grau: formData.grau,
        tipo_vinculo: formData.tipo_vinculo,
        nucleo_origem: formData.tipo_vinculo === 'Visitante' ? formData.nucleo_origem : null,
        ativo: formData.ativo,
      }

      if (editingMembro) {
        const { error } = await supabase
          .from('membros')
          .update(payload)
          .eq('id', editingMembro.id)

        if (error) throw error
        toast.success('Cadastro atualizado')
      } else {
        const { error } = await supabase
          .from('membros')
          .insert([payload])

        if (error) throw error
        toast.success('Membro cadastrado')
      }

      handleCloseModal()
      fetchMembros()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error('Erro ao salvar', { description: mensagem })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('membros')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Cadastro apagado')
      handleCloseModal()
      fetchMembros()
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error('Erro ao apagar', { description: mensagem })
    }
  }

  const busca = searchTerm.toLowerCase()
  const filteredMembros = membros
    .filter(m =>
      m.nome.toLowerCase().includes(busca) ||
      (m.nome_exibicao && m.nome_exibicao.toLowerCase().includes(busca)) ||
      (m.grau && m.grau.toLowerCase().includes(busca))
    )
    .sort((a, b) => {
      const pesoA = grauPeso[a.grau || 'Sócio'] || 5
      const pesoB = grauPeso[b.grau || 'Sócio'] || 5
      if (pesoA !== pesoB) return pesoA - pesoB
      return a.nome.localeCompare(b.nome)
    })

  const contagens = [
    { rotulo: 'Total', valor: membros.length },
    ...GRAUS_MEMBRO.map(grau => ({
      rotulo: grau,
      valor: membros.filter(m => m.grau === grau).length,
    })),
  ]

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Membros</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus data-slot="icon" /> Novo cadastro
        </Button>
      </div>

      {!loading && membros.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {contagens.map(({ rotulo, valor }) => (
            <Card key={rotulo}>
              <CardContent className="px-4">
                <p className="text-xs text-muted-foreground truncate">{rotulo}</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight mt-0.5">{valor}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Buscar membro por nome ou grau…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar membro"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filteredMembros.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {membros.length === 0
                ? 'Nenhum membro cadastrado ainda.'
                : 'Nenhum membro corresponde à busca.'}
            </p>
            {membros.length === 0 && (
              <Button variant="outline" className="mt-4" onClick={() => handleOpenModal()}>
                Cadastrar primeiro membro
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0 overflow-hidden">
          <ul className="divide-y">
            {filteredMembros.map((membro) => (
              <li key={membro.id} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm leading-tight truncate">
                    {membro.nome}
                    {!membro.ativo && (
                      <span className="text-muted-foreground font-normal"> · inativo</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span>{membro.grau || 'Sócio'}</span>
                    <Badge variant={membro.tipo_vinculo === 'Local' ? 'secondary' : 'outline'}>
                      {membro.tipo_vinculo}
                    </Badge>
                    {membro.tipo_vinculo === 'Visitante' && membro.nucleo_origem && (
                      <span className="flex items-center gap-1 truncate max-w-[12rem]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{membro.nucleo_origem}</span>
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(membro)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={aberto => { if (!aberto) handleCloseModal() }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMembro ? 'Editar membro' : 'Novo cadastro'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo <span className="text-destructive">*</span></Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do sócio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome-exibicao">Nome de exibição <span className="text-destructive">*</span></Label>
              <Input
                id="nome-exibicao"
                required
                value={formData.nome_exibicao}
                onChange={e => setFormData({ ...formData, nome_exibicao: e.target.value })}
                placeholder="O nome pelo qual é chamado"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vinculo">Vínculo</Label>
                <Select
                  value={formData.tipo_vinculo}
                  onValueChange={valor => setFormData({
                    ...formData,
                    tipo_vinculo: valor as 'Local' | 'Visitante',
                    nucleo_origem: valor === 'Local' ? '' : formData.nucleo_origem,
                  })}
                >
                  <SelectTrigger id="vinculo" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Visitante">Visitante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grau">Grau institucional</Label>
                <Select value={formData.grau} onValueChange={grau => setFormData({ ...formData, grau })}>
                  <SelectTrigger id="grau" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRAUS_MEMBRO.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipo_vinculo === 'Visitante' && (
              <div className="space-y-2">
                <Label htmlFor="nucleo">Núcleo de origem <span className="text-destructive">*</span></Label>
                <Input
                  id="nucleo"
                  required
                  value={formData.nucleo_origem}
                  onChange={e => setFormData({ ...formData, nucleo_origem: e.target.value })}
                  placeholder="Ex.: Sede Geral"
                />
              </div>
            )}

            {editingMembro && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                  className="size-4 accent-primary"
                />
                Cadastro ativo no sistema
              </label>
            )}

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 data-slot="icon" className="animate-spin" />}
                  {isSubmitting ? 'Salvando…' : editingMembro ? 'Salvar' : 'Cadastrar'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
              </div>
              {editingMembro && (
                <BotaoExcluir
                  titulo={`Apagar o cadastro de ${editingMembro.nome}?`}
                  descricao="O cadastro será removido permanentemente. Se o membro já participou de sessões, prefira marcá-lo como inativo."
                  rotulo="Apagar"
                  disabled={isSubmitting}
                  onConfirmar={() => handleDelete(editingMembro.id)}
                />
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
