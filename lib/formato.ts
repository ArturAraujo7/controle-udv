/** Formatação de valores do domínio — usar em toda a interface. */

/** 12.5 → "12,5 L" (até 2 casas, sem zeros à direita desnecessários). */
export function formatarLitros(valor: number | null | undefined) {
  return `${formatarNumero(valor)} L`
}

/** 12.5 → "12,5" · 12 → "12" · 12.345 → "12,35" */
export function formatarNumero(valor: number | null | undefined) {
  return (valor ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** ISO → "02/08/2026" (sem deslocar o dia por fuso). */
export function formatarData(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
