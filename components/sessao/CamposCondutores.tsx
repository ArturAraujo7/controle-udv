'use client'

import { SeletorMembro, MembroSimples } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TIPOS_DELEGACAO } from '@/lib/constants'

export type MembroRef = { id: number | null; nome: string }

/**
 * Bloco "quem conduziu a sessão" — dirigentes (até 2, com classificação da
 * delegação), leitor e explanador. Compartilhado pelos quatro formulários de
 * sessão (nova, edição, histórica e edição histórica).
 */
export function CamposCondutores({
  dirigentes,
  tipoDelegacao,
  leitor,
  explanador,
  membros,
  rotuloDirigente = 'Quem dirigiu?',
  opcional = false,
  onDirigentesChange,
  onTipoDelegacaoChange,
  onLeitorChange,
  onExplanadorChange,
  onMembroAdicionado,
}: {
  dirigentes: MembroRef[]
  tipoDelegacao: string
  leitor: MembroRef
  explanador: MembroRef
  membros: MembroSimples[]
  rotuloDirigente?: string
  /** Marca leitor e explanador como opcionais no rótulo. */
  opcional?: boolean
  onDirigentesChange: (valor: MembroRef[]) => void
  onTipoDelegacaoChange: (valor: string) => void
  onLeitorChange: (valor: MembroRef) => void
  onExplanadorChange: (valor: MembroRef) => void
  onMembroAdicionado: (membro: MembroSimples) => void
}) {
  const sufixo = opcional ? ' (opcional)' : ''

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Mestre dirigente</Label>
        <SeletorMultiploMembro
          placeholder={rotuloDirigente}
          value={dirigentes}
          onChange={onDirigentesChange}
          membros={membros}
          onMembroAdicionado={onMembroAdicionado}
          max={2}
        />
      </div>

      {dirigentes.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="delegacao">Classificação da delegação</Label>
          <Select value={tipoDelegacao} onValueChange={onTipoDelegacaoChange}>
            <SelectTrigger id="delegacao" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS_DELEGACAO.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Leitor de documentos{sufixo}</Label>
          <SeletorMembro
            placeholder="Quem leu?"
            value={leitor}
            onChange={onLeitorChange}
            membros={membros}
            onMembroAdicionado={onMembroAdicionado}
          />
        </div>
        <div className="space-y-2">
          <Label>Explanador{sufixo}</Label>
          <SeletorMembro
            placeholder="Quem explanou?"
            value={explanador}
            onChange={onExplanadorChange}
            membros={membros}
            onMembroAdicionado={onMembroAdicionado}
          />
        </div>
      </div>
    </div>
  )
}
