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

/** ISO → "02/08" */
export function formatarDiaMes(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

/** ISO → "sábado, 2 de agosto de 2026" */
export function formatarDataExtensa(iso: string | null | undefined) {
  if (!iso) return '—'
  const texto = new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Horário gravado da sessão → "20:00" (as sessões são gravadas sem fuso). */
export function formatarHora(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

/** Carimbo de data/hora real (ex.: created_at), no fuso do aparelho → "02/08/2026, 14:32" */
export function formatarDataHora(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** "há 3 dias", "ontem", "há 2 h" */
export function formatarRelativo(iso: string | null | undefined, agora = new Date()) {
  if (!iso) return '—'
  const minutos = Math.round((agora.getTime() - new Date(iso).getTime()) / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  const meses = Math.round(dias / 30)
  if (meses < 12) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`
  const anos = Math.round(meses / 12)
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`
}

/** "2026-08-02..." → "2026-08" */
export function chaveMes(iso: string) {
  return iso.slice(0, 7)
}

/** "2026-08" → "Agosto de 2026" */
export function rotuloMes(chave: string) {
  const [ano, mes] = chave.split('-').map(Number)
  const nome = new Date(Date.UTC(ano, mes - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`
}

/** "2026-08-02..." → 2026 */
export function anoDe(iso: string) {
  return Number(iso.slice(0, 4))
}

/** Hoje no fuso do aparelho → "2026-08-02" (padrão dos campos de data). */
export function hojeISO(agora = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`
}

/** Separa o timestamp da sessão nos campos de data e hora do formulário. */
export function separarDataHora(iso: string | null | undefined) {
  if (!iso) return { data: '', hora: '20:00' }
  const [data, resto = ''] = iso.split(/[T ]/)
  return { data, hora: resto.slice(0, 5) || '20:00' }
}

export function saudacao(agora = new Date()) {
  const hora = agora.getHours()
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Variação percentual; `null` quando não há base de comparação. */
export function variacaoPercentual(atual: number, anterior: number) {
  if (!anterior) return null
  return ((atual - anterior) / anterior) * 100
}
