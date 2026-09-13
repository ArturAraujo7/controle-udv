'use client'

import { SeletorMembro, MembroSimples } from '@/app/components/SeletorMembro'
import { SeletorMultiploMembro } from '@/app/components/SeletorMultiploMembro'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useLista } from '@/hooks/useListas'
import type { MembroRef } from '@/lib/sessoes'

export type { MembroRef }

/**
 * Bloco "quem conduziu a sessão" — dirigentes (até 2, com classificação da
 * delegação), leitor e explanador. Compartilhado pelos formulários de sessão.
 */
export function CamposCondutores({
  dirigentes,
  tipoDelegacao,
  leitor,
  explanador,
  membros,
  rotuloDirigente = 'Quem dirigiu?',
  exigirLeitorExplanador = false,
  exigirExplanador = false,
  erros,
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
  exigirLeitorExplanador?: boolean
  exigirExplanador?: boolean
  erros?: Partial<Record<'dirigente' | 'leitor' | 'explanador', string>>
  onDirigentesChange: (valor: MembroRef[]) => void
  onTipoDelegacaoChange: (valor: string) => void
  onLeitorChange: (valor: MembroRef) => void
  onExplanadorChange: (valor: MembroRef) => void
  onMembroAdicionado: (membro: MembroSimples) => void
}) {
  const tiposDelegacao = useLista('tipos_delegacao', tipoDelegacao)
  const obrigatorio = <span className="text-destructive" aria-hidden="true">*</span>

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Mestre dirigente {!!erros && obrigatorio}</Label>
        <SeletorMultiploMembro
          placeholder={rotuloDirigente}
          value={dirigentes}
          onChange={onDirigentesChange}
          membros={membros}
          onMembroAdicionado={onMembroAdicionado}
          max={2}
        />
        {erros?.dirigente ? (
          <p className="text-xs text-destructive" role="alert">{erros.dirigente}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Adicione um segundo dirigente quando houver delegação.</p>
        )}
      </div>

      {dirigentes.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="delegacao">Classificação da delegação</Label>
          <Select value={tipoDelegacao} onValueChange={onTipoDelegacaoChange}>
            <SelectTrigger id="delegacao" className="h-10 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tiposDelegacao.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Leitor de documentos {exigirLeitorExplanador && obrigatorio}</Label>
          <SeletorMembro
            placeholder="Quem leu?"
            value={leitor}
            onChange={onLeitorChange}
            membros={membros}
            onMembroAdicionado={onMembroAdicionado}
          />
          {erros?.leitor && <p className="text-xs text-destructive" role="alert">{erros.leitor}</p>}
        </div>
        <div className="space-y-2">
          <Label>Explanador {(exigirLeitorExplanador || exigirExplanador) && obrigatorio}</Label>
          <SeletorMembro
            placeholder="Quem explanou?"
            value={explanador}
            onChange={onExplanadorChange}
            membros={membros}
            onMembroAdicionado={onMembroAdicionado}
          />
          {erros?.explanador && <p className="text-xs text-destructive" role="alert">{erros.explanador}</p>}
        </div>
      </div>
    </div>
  )
}
