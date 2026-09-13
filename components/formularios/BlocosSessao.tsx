'use client'

import { Plus, Trash2 } from 'lucide-react'

import { SeletorMembro, type MembroSimples } from '@/app/components/SeletorMembro'
import { BlocoFormulario, Campo, Sugestoes } from '@/components/formularios/Campos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLista } from '@/hooks/useListas'
import { novaChave, type HistoriaForm, type LeituraForm, type VisitanteForm } from '@/lib/sessoes'

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

export function BlocoLeituras({
  itens,
  onChange,
  membros,
  onMembroAdicionado,
}: {
  itens: LeituraForm[]
  onChange: (itens: LeituraForm[]) => void
  membros: MembroSimples[]
  onMembroAdicionado: (membro: MembroSimples) => void
}) {
  const documentos = useLista('documentos')
  const atualizar = (chave: string, parcial: Partial<LeituraForm>) =>
    onChange(itens.map(i => (i.chave === chave ? { ...i, ...parcial } : i)))

  return (
    <BlocoFormulario titulo="Documentos lidos" descricao="Quais documentos foram lidos e por quem.">
      <Sugestoes id="sugestoes-documentos" opcoes={documentos} />
      {itens.map((item, i) => (
        <div key={item.chave} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <Campo rotulo={`Documento ${i + 1}`} htmlFor={`doc-${item.chave}`} className="flex-1">
              <Input
                id={`doc-${item.chave}`}
                list="sugestoes-documentos"
                className="h-10"
                placeholder="Nome do documento"
                value={item.documento}
                onChange={e => atualizar(item.chave, { documento: e.target.value })}
              />
            </Campo>
            <div className="pt-6">
              <BotaoRemover rotulo={`Remover documento ${i + 1}`} onClick={() => onChange(itens.filter(x => x.chave !== item.chave))} />
            </div>
          </div>
          <Campo rotulo="Lido por">
            <SeletorMembro
              placeholder="Quem leu?"
              value={item.leitor}
              onChange={leitor => atualizar(item.chave, { leitor })}
              membros={membros}
              onMembroAdicionado={onMembroAdicionado}
            />
          </Campo>
        </div>
      ))}
      <BotaoAdicionar
        rotulo="Adicionar documento"
        onClick={() => onChange([...itens, { chave: novaChave(), documento: '', leitor: { id: null, nome: '' } }])}
      />
    </BlocoFormulario>
  )
}

export function BlocoHistorias({ itens, onChange }: { itens: HistoriaForm[]; onChange: (itens: HistoriaForm[]) => void }) {
  const historias = useLista('historias')

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
