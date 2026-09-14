'use client'

import { Plus, Trash2 } from 'lucide-react'

import { SeletorMembro, type MembroSimples } from '@/app/components/SeletorMembro'
import { BlocoFormulario, Campo, Sugestoes } from '@/components/formularios/Campos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useItensLista, useLista } from '@/hooks/useListas'
import { novaChave, type ChamadaForm, type HistoriaForm, type VisitanteForm } from '@/lib/sessoes'

const porNome = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })

function BotaoAdicionar({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className="h-10 w-full border-dashed text-primary">
      <Plus /> {rotulo}
    </Button>
  )
}

function BotaoRemover({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} aria-label={rotulo} className="shrink-0">
      <Trash2 />
    </Button>
  )
}

export function BlocoChamadas({
  itens,
  onChange,
  membros,
  onMembroAdicionado,
}: {
  itens: ChamadaForm[]
  onChange: (itens: ChamadaForm[]) => void
  membros: MembroSimples[]
  onMembroAdicionado: (membro: MembroSimples) => void
}) {
  const { itens: catalogo } = useItensLista('chamadas')
  const cadastradas = (catalogo ?? [])
    .filter(c => c.ativo)
    .map(c => ({ nome: c.nome, autor: c.autor ?? null }))
    .sort((a, b) => porNome(a.nome, b.nome))
  const atualizar = (chave: string, parcial: Partial<ChamadaForm>) =>
    onChange(itens.map(i => (i.chave === chave ? { ...i, ...parcial } : i)))

  return (
    <BlocoFormulario titulo="Chamadas" descricao="Chamadas feitas na sessão e quem fez cada uma.">
      {itens.map((item, i) => {
        // Uma chamada já gravada continua selecionável mesmo se saiu do catálogo
        const opcoes = item.chamada && !cadastradas.some(c => c.nome === item.chamada)
          ? [{ nome: item.chamada, autor: item.autor }, ...cadastradas]
          : cadastradas
        return (
          <div key={item.chave} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <Campo rotulo={`Chamada ${i + 1}`} htmlFor={`chamada-${item.chave}`} className="min-w-0 flex-1">
                <Select
                  value={item.chamada || undefined}
                  onValueChange={nome => atualizar(item.chave, { chamada: nome, autor: opcoes.find(o => o.nome === nome)?.autor ?? null })}
                >
                  <SelectTrigger id={`chamada-${item.chave}`} className="h-10 w-full">
                    <SelectValue placeholder="Escolha a chamada" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes.map(o => (
                      <SelectItem key={o.nome} value={o.nome}>
                        {o.nome}
                        {o.autor && <span className="text-muted-foreground">· {o.autor}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <div className="pt-6">
                <BotaoRemover rotulo={`Remover chamada ${i + 1}`} onClick={() => onChange(itens.filter(x => x.chave !== item.chave))} />
              </div>
            </div>
            <Campo rotulo="Feita por">
              <SeletorMembro
                placeholder="Quem fez a chamada?"
                value={item.pessoa}
                onChange={pessoa => atualizar(item.chave, { pessoa })}
                membros={membros}
                onMembroAdicionado={onMembroAdicionado}
              />
            </Campo>
          </div>
        )
      })}
      {catalogo !== null && cadastradas.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma chamada cadastrada. Um administrador cadastra em Configurações › Listas › Chamadas.
        </p>
      )}
      <BotaoAdicionar
        rotulo="Adicionar chamada"
        onClick={() => onChange([...itens, { chave: novaChave(), chamada: '', autor: null, pessoa: { id: null, nome: '' } }])}
      />
    </BlocoFormulario>
  )
}

export function BlocoHistorias({ itens, onChange }: { itens: HistoriaForm[]; onChange: (itens: HistoriaForm[]) => void }) {
  const historias = [...useLista('historias')].sort(porNome)

  return (
    <BlocoFormulario titulo="Histórias contadas">
      <Sugestoes id="sugestoes-historias" opcoes={historias} />
      {itens.map((item, i) => (
        <div key={item.chave} className="flex items-center gap-2">
          <Input
            list="sugestoes-historias"
            className="h-10 flex-1"
            placeholder="Título da história"
            aria-label={`História ${i + 1}`}
            value={item.titulo}
            onChange={e => onChange(itens.map(x => (x.chave === item.chave ? { ...x, titulo: e.target.value } : x)))}
          />
          <BotaoRemover rotulo={`Remover história ${i + 1}`} onClick={() => onChange(itens.filter(x => x.chave !== item.chave))} />
        </div>
      ))}
      <BotaoAdicionar rotulo="Adicionar história" onClick={() => onChange([...itens, { chave: novaChave(), titulo: '' }])} />
    </BlocoFormulario>
  )
}

export function BlocoVisitantes({ itens, onChange }: { itens: VisitanteForm[]; onChange: (itens: VisitanteForm[]) => void }) {
  const nucleos = useLista('nucleos')
  const atualizar = (chave: string, parcial: Partial<VisitanteForm>) =>
    onChange(itens.map(i => (i.chave === chave ? { ...i, ...parcial } : i)))

  return (
    <BlocoFormulario titulo="Visitantes" descricao="Pessoas de outros núcleos presentes na sessão.">
      <Sugestoes id="sugestoes-nucleos-visitantes" opcoes={nucleos} />
      {itens.map((item, i) => (
        <div key={item.chave} className="flex items-start gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <Input
              className="h-10"
              placeholder="Nome"
              aria-label={`Nome do visitante ${i + 1}`}
              value={item.nome}
              onChange={e => atualizar(item.chave, { nome: e.target.value })}
            />
            <Input
              className="h-10"
              list="sugestoes-nucleos-visitantes"
              placeholder="Núcleo de origem"
              aria-label={`Núcleo do visitante ${i + 1}`}
              value={item.nucleo_origem}
              onChange={e => atualizar(item.chave, { nucleo_origem: e.target.value })}
            />
          </div>
          <BotaoRemover rotulo={`Remover visitante ${i + 1}`} onClick={() => onChange(itens.filter(x => x.chave !== item.chave))} />
        </div>
      ))}
      <BotaoAdicionar
        rotulo="Adicionar visitante"
        onClick={() => onChange([...itens, { chave: novaChave(), nome: '', nucleo_origem: '' }])}
      />
    </BlocoFormulario>
  )
}
