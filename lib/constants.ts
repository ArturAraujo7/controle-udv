import type { NomeLista } from './tipos'

/**
 * Constantes de domínio. As listas editáveis (tipos de sessão, graus, etc.)
 * ficam na tabela `listas_sistema`; os valores abaixo são o padrão usado
 * enquanto ela não existe ou está vazia (ver hooks/useListas.ts).
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

export const MOTIVOS_SAIDA = [
  'Doação',
  'Empréstimo',
  'Envio para preparo',
  'Outro',
] as const

/** Espelha o CHECK sessoes_fonte_registro_check. */
export const FONTES_REGISTRO = ['Livro de atas', 'Relato oral', 'Outro'] as const

/** Espelha o CHECK saidas_tipo_destino_check. */
export const TIPOS_DESTINO = ['Núcleo', 'Pessoa'] as const

export const LISTAS_SISTEMA: { lista: NomeLista; rotulo: string; descricao?: string }[] = [
  { lista: 'tipos_sessao', rotulo: 'Tipos de sessão' },
  { lista: 'graus', rotulo: 'Graus institucionais' },
  { lista: 'tipos_delegacao', rotulo: 'Tipos de delegação' },
  { lista: 'documentos', rotulo: 'Documentos', descricao: 'Catálogo para "Documentos lidos"' },
  { lista: 'historias', rotulo: 'Histórias', descricao: 'Catálogo para "Histórias contadas"' },
  { lista: 'nucleos', rotulo: 'Núcleos conhecidos', descricao: 'Origem de doações e destino de saídas' },
  { lista: 'motivos_saida', rotulo: 'Motivos de saída' },
]

export type TipoSessao = (typeof TIPOS_SESSAO)[number]
export type TipoDelegacao = (typeof TIPOS_DELEGACAO)[number]
export type GrauMembro = (typeof GRAUS_MEMBRO)[number]
