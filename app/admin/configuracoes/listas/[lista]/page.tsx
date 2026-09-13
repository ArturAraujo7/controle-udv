'use client'
import { use, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Database, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { ListaCard, Vazio } from '@/components/comum/Lista'
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
import { invalidarLista, useItensLista } from '@/hooks/useListas'
import { LISTAS_SISTEMA } from '@/lib/constants'
import { buscarTodos } from '@/lib/consultas'
import { supabase } from '@/lib/supabaseClient'
import type { ItemLista, NomeLista } from '@/lib/tipos'

/** De onde vem o uso de cada lista nos registros. */
const FONTES_USO: Record<NomeLista, { tabela: string; coluna: string }[]> = {
  tipos_sessao: [{ tabela: 'sessoes', coluna: 'tipo' }],
  graus: [{ tabela: 'membros', coluna: 'grau' }],
  tipos_delegacao: [{ tabela: 'sessoes', coluna: 'tipo_delegacao' }],
  documentos: [{ tabela: 'leituras', coluna: 'documento' }],
  historias: [{ tabela: 'historias', coluna: 'titulo_historia' }],
  nucleos: [
    { tabela: 'preparos', coluna: 'nucleo_origem' },
    { tabela: 'saidas', coluna: 'destino' },
    { tabela: 'membros', coluna: 'nucleo_origem' },
  ],
  motivos_saida: [{ tabela: 'saidas', coluna: 'motivo' }],
}

const CORES = [
  { valor: 'var(--chart-1)', rotulo: 'Verde' },
  { valor: 'var(--chart-3)', rotulo: 'Verde claro' },
  { valor: 'var(--chart-5)', rotulo: 'Terra' },
  { valor: 'var(--chart-2)', rotulo: 'Cinza' },
  { valor: 'var(--chart-4)', rotulo: 'Grafite' },
]

const SEM_COR = 'sem-cor'

export default function PaginaLista({ params }: { params: Promise<{ lista: string }> }) {
  const { lista } = use(params)
  const meta = LISTAS_SISTEMA.find(l => l.lista === lista)

  return (
    <ExigirAdmin>
      {meta ? (
        <EditorLista lista={meta.lista} rotulo={meta.rotulo} />
      ) : (
        <>
          <Cabecalho voltar={{ href: '/admin/configuracoes', rotulo: 'Configurações' }} titulo="Lista" />
          <Vazio>Lista não encontrada.</Vazio>
        </>
      )}
    </ExigirAdmin>
  )
}

type Edicao = { item: ItemLista | null; nome: string; cor: string; exigeExplanador: boolean }

function EditorLista({ lista, rotulo }: { lista: NomeLista; rotulo: string }) {
  const { itens, indisponivel, recarregar } = useItensLista(lista)
  const [uso, setUso] = useState<Map<string, number>>(new Map())
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true
    Promise.all(
      FONTES_USO[lista].map(({ tabela, coluna }) =>
        buscarTodos<Record<string, string | null>>((de, ate) =>
          // Coluna dinâmica: o parser de tipos do supabase-js não consegue inferir o resultado
          supabase.from(tabela).select(`id, ${coluna}`).order('id').range(de, ate) as unknown as PromiseLike<{
            data: Record<string, string | null>[] | null
            error: { message: string } | null
          }>
        ).then(linhas => linhas.map(l => l[coluna])).catch(() => [])
      )
    ).then(listas => {
      if (!ativo) return
      const mapa = new Map<string, number>()
      for (const valor of listas.flat()) if (valor) mapa.set(valor, (mapa.get(valor) ?? 0) + 1)
      setUso(mapa)
    })
    return () => { ativo = false }
  }, [lista])

  const atualizarLista = async () => {
    invalidarLista(lista)
    await recarregar()
  }

  const ativos = (itens ?? []).filter(i => i.ativo)
  const arquivados = (itens ?? []).filter(i => !i.ativo)

  const mover = async (indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao
    if (destino < 0 || destino >= ativos.length) return
    const reordenados = [...ativos]
    ;[reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]]
    const mudancas = reordenados
      .map((item, i) => ({ item, ordem: i + 1 }))
      .filter(({ item, ordem }) => item.ordem !== ordem)
    const resultados = await Promise.all(
      mudancas.map(({ item, ordem }) => supabase.from('listas_sistema').update({ ordem }).eq('id', item.id))
    )
    const erro = resultados.find(r => r.error)?.error
    if (erro) toast.error('Erro ao reordenar', { description: erro.message })
    await atualizarLista()
  }

  const abrir = (item: ItemLista | null) =>
    setEdicao({ item, nome: item?.nome ?? '', cor: item?.cor ?? SEM_COR, exigeExplanador: item?.exige_explanador ?? false })

  const salvarEdicao = async () => {
    if (!edicao) return
    const nome = edicao.nome.trim()
    if (!nome) {
      toast.error('Informe o nome')
      return
    }
    setSalvando(true)
    const dados = {
      nome,
      cor: edicao.cor === SEM_COR ? null : edicao.cor,
      exige_explanador: lista === 'tipos_sessao' ? edicao.exigeExplanador : false,
    }
    const { error } = edicao.item
      ? await supabase.from('listas_sistema').update(dados).eq('id', edicao.item.id)
      : await supabase.from('listas_sistema').insert({ ...dados, lista, ordem: ativos.length + 1 })
    setSalvando(false)
    if (error) {
      toast.error('Erro ao salvar', { description: error.code === '23505' ? 'Já existe um item com esse nome.' : error.message })
      return
    }
    toast.success(edicao.item ? 'Item atualizado' : 'Item adicionado')
    setEdicao(null)
    await atualizarLista()
  }

  const alternarArquivo = async (item: ItemLista) => {
    const { error } = await supabase.from('listas_sistema').update({ ativo: !item.ativo, ordem: item.ativo ? item.ordem : ativos.length + 1 }).eq('id', item.id)
    if (error) {
      toast.error('Erro ao atualizar', { description: error.message })
      return
    }
    toast.success(item.ativo ? 'Item arquivado' : 'Item reativado')
    setEdicao(null)
    await atualizarLista()
  }

  const excluir = async (item: ItemLista) => {
    const { error } = await supabase.from('listas_sistema').delete().eq('id', item.id)
    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
      return
    }
    toast.success('Item excluído')
    setEdicao(null)
    await atualizarLista()
  }

  if (indisponivel) {
    return (
      <>
        <Cabecalho voltar={{ href: '/admin/configuracoes', rotulo: 'Configurações' }} titulo={rotulo} />
        <Vazio icone={<Database />}>A tabela de listas ainda não existe. Aplique as migrations de 13/09/2026.</Vazio>
      </>
    )
  }

  const usoDe = (nome: string) => uso.get(nome) ?? 0
  const rotuloUso = (nome: string) => {
    const n = usoDe(nome)
    return n === 0 ? 'Sem uso nos registros' : `Usado em ${n} ${n === 1 ? 'registro' : 'registros'}`
  }

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <Cabecalho
        voltar={{ href: '/admin/configuracoes', rotulo: 'Configurações' }}
        titulo={rotulo}
        acoes={<Button onClick={() => abrir(null)}><Plus /> Novo</Button>}
      />

      <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        Use as setas para reordenar. Itens já usados em registros não podem ser excluídos, só arquivados —
        arquivados somem dos formulários, mas continuam nos registros antigos.
      </p>

      {itens === null ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : ativos.length === 0 ? (
        <Vazio acao={<Button variant="outline" onClick={() => abrir(null)}><Plus /> Adicionar o primeiro item</Button>}>
          Nenhum item nesta lista.
        </Vazio>
      ) : (
        <ListaCard>
          {ativos.map((item, i) => (
            <li key={item.id} className="flex items-center gap-2 px-2 py-2">
              <div className="flex flex-col">
                <Button variant="ghost" size="icon-sm" aria-label={`Subir ${item.nome}`} disabled={i === 0} onClick={() => mover(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Descer ${item.nome}`} disabled={i === ativos.length - 1} onClick={() => mover(i, 1)}>
                  <ArrowDown />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => abrir(item)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {item.cor && <span className="size-3 shrink-0 rounded-full" style={{ background: item.cor }} aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {rotuloUso(item.nome)}
                    {item.exige_explanador && ' · exige explanador'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ListaCard>
      )}

      {arquivados.length > 0 && (
        <Secao titulo="Arquivados" acao="não aparecem nos formulários">
          <ListaCard>
            {arquivados.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => abrir(item)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-muted-foreground">{item.nome}</span>
                    <span className="block text-xs text-muted-foreground">{rotuloUso(item.nome)}</span>
                  </span>
                  <Badge variant="outline">Arquivado</Badge>
                </button>
              </li>
            ))}
          </ListaCard>
        </Secao>
      )}

      <Dialog open={!!edicao} onOpenChange={aberto => { if (!aberto) setEdicao(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edicao?.item ? 'Editar item' : 'Novo item'}</DialogTitle>
            <DialogDescription>
              {edicao?.item && usoDe(edicao.item.nome) > 0
                ? 'Renomear não altera registros antigos: eles continuam com o nome anterior.'
                : rotulo}
            </DialogDescription>
          </DialogHeader>

          {edicao && (
            <div className="space-y-4">
              <Campo rotulo="Nome" htmlFor="item-nome" obrigatorio>
                <Input id="item-nome" className="h-10" autoFocus value={edicao.nome} onChange={e => setEdicao({ ...edicao, nome: e.target.value })} />
              </Campo>
              {lista === 'tipos_sessao' && (
                <>
                  <Campo rotulo="Cor na lista e nos gráficos">
                    <Select value={edicao.cor} onValueChange={cor => setEdicao({ ...edicao, cor })}>
                      <SelectTrigger className="h-10 w-full" aria-label="Cor"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SEM_COR}>Automática</SelectItem>
                        {CORES.map(c => (
                          <SelectItem key={c.valor} value={c.valor}>
                            <span className="size-3 rounded-full" style={{ background: c.valor }} /> {c.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Campo>
                  <LinhaInterruptor
                    id="exige-explanador"
                    rotulo="Exige explanador"
                    descricao="O formulário da sessão passa a pedir o explanador para este tipo."
                    checked={edicao.exigeExplanador}
                    onCheckedChange={v => setEdicao({ ...edicao, exigeExplanador: v })}
                  />
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {edicao?.item ? (
              usoDe(edicao.item.nome) === 0 && !edicao.item.ativo ? (
                <Button variant="ghost" className="text-destructive" onClick={() => excluir(edicao.item!)}>Excluir</Button>
              ) : (
                <Button variant="ghost" className={edicao.item.ativo ? 'text-destructive' : ''} onClick={() => alternarArquivo(edicao.item!)}>
                  {edicao.item.ativo ? 'Arquivar' : 'Reativar'}
                </Button>
              )
            ) : <span />}
            <Button onClick={salvarEdicao} disabled={salvando}>
              {salvando && <Loader2 className="animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
