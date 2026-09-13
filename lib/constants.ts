/**
 * Constantes de domínio — fonte única para formulários e relatórios.
 * Mantenha em sincronia com os CHECK constraints do banco.
 */

export const TIPOS_SESSAO = [
  'Escala',
  'Escala Anual',
  'Casal',
  'Extra',
  'Instrutiva',
  'Da Direção',
  'Quadro de Mestres',
  'Adventício',
  'Preparo',
  'Caráter Instrutivo',
] as const

export const TIPOS_DELEGACAO = [
  'Transmissão da Assistência',
  'Transmissão da Representação',
] as const

/** Ordenados por hierarquia institucional. */
export const GRAUS_MEMBRO = [
  'Mestre',
  'Corpo do Conselho',
  'Corpo Instrutivo',
  'Sócio',
] as const

export type TipoSessao = (typeof TIPOS_SESSAO)[number]
export type TipoDelegacao = (typeof TIPOS_DELEGACAO)[number]
export type GrauMembro = (typeof GRAUS_MEMBRO)[number]
