'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Database, Globe2, Loader2, Map as MapaIcone, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { ItemLista, ListaCard, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { Campo, LinhaInterruptor } from '@/components/formularios/Campos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstrutura } from '@/hooks/useEstrutura'
import { useUsuarios } from '@/hooks/useUsuarios'
import { supabase } from '@/lib/supabaseClient'
import type { Nucleo, Regiao } from '@/lib/tipos'

type DialogoRegiao = { tipo: 'regiao'; item: Regiao | null; nome: string }
type DialogoNucleo = { tipo: 'nucleo'; item: Nucleo | null; nome: string; cidade: string; regiaoId: string; ativo: boolean }

export default function PaginaEstrutura() {
  return (
    <ExigirAdmin>
      <Estrutura />
    </ExigirAdmin>
  )
}

function Estrutura() {
  const estrutura = useEstrutura()
  const { usuarios } = useUsuarios()
  const [dialogo, setDialogo] = useState<DialogoRegiao | DialogoNucleo | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!dialogo) return
    const nome = dialogo.nome.trim()
    if (!nome) {
      toast.error('Informe o nome')
      return
    }
    setSalvando(true)

    const resposta = dialogo.tipo === 'regiao'
      ? dialogo.item
        ? await supabase.from('regioes').update({ nome }).eq('id', dialogo.item.id)
        : await supabase.from('regioes').insert({ nome })
      : await (() => {
          const dados = {
            nome,
            cidade: dialogo.cidade.trim() || null,
            regiao_id: Number(dialogo.regiaoId),
            ativo: dialogo.ativo,
          }
          return dialogo.item
            ? supabase.from('nucleos').update(dados).eq('id', dialogo.item.id)
            : supabase.from('nucleos').insert(dados)
        })()

    setSalvando(false)
    if (resposta.error) {
      toast.error('Erro ao salvar', {
        description: resposta.error.code === '23505' ? 'Já existe um cadastro com esse nome.' : resposta.error.message,
      })
      return
    }
    toast.success(dialogo.item ? 'Alterações salvas' : dialogo.tipo === 'regiao' ? 'Região criada' : 'Núcleo criado')
    setDialogo(null)
    await estrutura.recarregar()
  }

  const excluir = async () => {
    if (!dialogo?.item) return
    setSalvando(true)
    const { error } = await supabase.from(dialogo.tipo === 'regiao' ? 'regioes' : 'nucleos').delete().eq('id', dialogo.item.id)
    setSalvando(false)
    if (error) {
      toast.error('Não foi possível excluir', {
        description: error.code === '23503'
          ? dialogo.tipo === 'regiao'
            ? 'A região ainda tem núcleos. Mova ou exclua os núcleos antes.'
            : 'O núcleo tem registros ou usuários. Desative-o em vez de excluir.'
          : error.message,
      })
      return
    }
    toast.success('Excluído')
    setDialogo(null)
    await estrutura.recarregar()
  }

  if (estrutura.indisponivel) {
    return (
      <>
        <Cabecalho titulo="Regiões e núcleos" />
        <Vazio icone={<Database />}>Aplique as migrations de 14/09/2026 no Supabase para cadastrar regiões e núcleos.</Vazio>
      </>
    )
  }

  const novaRegiao = () => setDialogo({ tipo: 'regiao', item: null, nome: '' })
  const novoNucleo = (regiaoId: number) =>
    setDialogo({ tipo: 'nucleo', item: null, nome: '', cidade: '', regiaoId: String(regiaoId), ativo: true })

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <Cabecalho
        titulo="Regiões e núcleos"
        descricao="Cada núcleo vê só os próprios dados; o Mestre Central vê todos os núcleos da região."
        acoes={<Button onClick={novaRegiao}><Plus /> Região</Button>}
      />

      {estrutura.carregando ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : estrutura.regioes.length === 0 ? (
        <Vazio icone={<MapaIcone />} acao={<Button variant="outline" onClick={novaRegiao}><Plus /> Criar região</Button>}>
          Nenhuma região cadastrada.
        </Vazio>
      ) : (
        estrutura.regioes.map((regiao, i) => {
          const nucleos = estrutura.nucleos.filter(n => n.regiao_id === regiao.id)
          const centrais = usuarios.filter(u => u.role === 'central' && u.regiao_id === regiao.id && u.status !== 'desativado')
          return (
            <Secao
              key={regiao.id}
              titulo={regiao.nome}
              className={i === 0 ? 'mt-0' : undefined}
              acao={
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label={`Editar ${regiao.nome}`} onClick={() => setDialogo({ tipo: 'regiao', item: regiao, nome: regiao.nome })}>
                    <Pencil />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => novoNucleo(regiao.id)}><Plus /> Núcleo</Button>
                </div>
              }
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                <span>
                  Mestre Central: {centrais.length ? centrais.map(c => c.full_name || c.email).join(', ') : 'nenhum'}
                </span>
                <Link href={`/regional?regiao=${regiao.id}`} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                  <Globe2 className="size-3.5" /> Ver visão regional
                </Link>
              </div>
              {nucleos.length === 0 ? (
                <Vazio>Nenhum núcleo nesta região.</Vazio>
              ) : (
                <ListaCard>
                  {nucleos.map(n => {
                    const qtd = usuarios.filter(u => u.nucleo_id === n.id && u.status !== 'desativado').length
                    return (
                      <ItemLista
                        key={n.id}
                        onClick={() => setDialogo({ tipo: 'nucleo', item: n, nome: n.nome, cidade: n.cidade ?? '', regiaoId: String(n.regiao_id), ativo: n.ativo })}
                        titulo={n.nome}
                        subtitulo={[n.cidade, `${qtd} ${qtd === 1 ? 'usuário' : 'usuários'}`].filter(Boolean).join(' · ')}
                        fim={!n.ativo ? <Badge variant="outline">Inativo</Badge> : undefined}
                      />
                    )
                  })}
                </ListaCard>
              )}
            </Secao>
          )
        })
      )}

      <Dialog open={!!dialogo} onOpenChange={aberto => { if (!aberto) setDialogo(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogo?.tipo === 'regiao'
                ? dialogo.item ? 'Editar região' : 'Nova região'
                : dialogo?.item ? 'Editar núcleo' : 'Novo núcleo'}
            </DialogTitle>
            <DialogDescription>
              {dialogo?.tipo === 'regiao'
                ? 'Regiões novas já recebem as listas padrão (tipos de sessão, graus…).'
                : 'Núcleos novos recebem as configurações padrão; ajuste depois em Configurações.'}
            </DialogDescription>
          </DialogHeader>

          {dialogo && (
            <div className="space-y-4">
              <Campo rotulo="Nome" htmlFor="estrutura-nome" obrigatorio>
                <Input id="estrutura-nome" className="h-10" autoFocus value={dialogo.nome} onChange={e => setDialogo({ ...dialogo, nome: e.target.value })} />
              </Campo>
              {dialogo.tipo === 'nucleo' && (
                <>
                  <Campo rotulo="Cidade / UF" htmlFor="estrutura-cidade">
                    <Input id="estrutura-cidade" className="h-10" value={dialogo.cidade} onChange={e => setDialogo({ ...dialogo, cidade: e.target.value })} />
                  </Campo>
                  <Campo rotulo="Região">
                    <Select value={dialogo.regiaoId} onValueChange={regiaoId => setDialogo({ ...dialogo, regiaoId })}>
                      <SelectTrigger className="h-10 w-full" aria-label="Região"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {estrutura.regioes.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Campo>
                  <LinhaInterruptor
                    id="nucleo-ativo"
                    rotulo="Núcleo ativo"
                    descricao="Núcleos inativos continuam com o histórico, mas somem da escolha de núcleo."
                    checked={dialogo.ativo}
                    onCheckedChange={ativo => setDialogo({ ...dialogo, ativo })}
                  />
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {dialogo?.item ? (
              <Button variant="ghost" className="text-destructive" onClick={excluir} disabled={salvando}>Excluir</Button>
            ) : <span />}
            <Button onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
