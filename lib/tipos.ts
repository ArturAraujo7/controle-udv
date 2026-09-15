/**
 * Tipos das tabelas do banco usados pela interface.
 * Campos marcados como opcionais (`?`) dependem das migrations de 13/09/2026.
 */

export type Papel = 'admin' | 'representante' | 'assistente' | 'mestre' | 'central'
export type SituacaoUsuario = 'pendente' | 'ativo' | 'desativado'

export type Preparo = {
  id: number
  tipo: 'Local' | 'Doação' | null
  data_preparo: string
  data_chegada: string | null
  nucleo_origem: string | null
  mestre_preparo: string
  mestre_preparo_id: number | null
  procedencia_mariri: string | null
  procedencia_chacrona: string | null
  quantidade_preparada: number
  grau: string | null
  status: 'Disponível' | 'Esgotado' | 'Em Maturação' | null
  data_liberacao?: string | null
  observacoes?: string | null
  user_id: string | null
  created_at: string
}

export type ConsumoSessao = {
  id: number
  id_sessao: number
  id_preparo: number
  quantidade_consumida: number
}

export type Saida = {
  id: number
  data_saida: string
  quantidade: number
  destino: string
  preparo_id: number | null
  observacoes: string | null
  motivo?: string | null
  tipo_destino?: 'Núcleo' | 'Pessoa' | null
  created_at: string
}

export type Sessao = {
  id: number
  data_realizacao: string
  tipo: string
  dirigente: string
  dirigente_id: number | null
  dirigente_2_id: number | null
  tipo_delegacao: string | null
  explanador: string | null
  explanador_id: number | null
  leitor_documentos: string | null
  leitor_documentos_id: number | null
  quantidade_participantes: number
  user_id: string | null
  created_at: string
  observacoes?: string | null
  data_aproximada?: boolean
  fonte_registro?: 'Livro de atas' | 'Relato oral' | 'Outro' | null
  ata_arquivo?: string | null
}

export type Membro = {
  id: number
  nome: string
  nome_exibicao: string | null
  grau: string | null
  tipo_vinculo: 'Local' | 'Visitante'
  nucleo_origem: string | null
  ativo: boolean
  user_id: string | null
  created_at: string
  data_ingresso?: string | null
  data_nascimento?: string | null
  foto_arquivo?: string | null
}

export type MudancaGrau = {
  id: number
  membro_id: number
  grau_anterior: string | null
  grau_novo: string
  data: string
  created_at: string
}

/** Chamada feita numa sessão (tabela chamadas_sessao). */
export type ChamadaSessao = {
  id: number
  id_sessao: number
  chamada: string
  autor: string | null
  pessoa: string | null
  membro_id: number | null
}

export type Historia = {
  id: number
  id_sessao: number
  titulo_historia: string
}

export type Visitante = {
  id: number
  id_sessao: number
  nome: string
  nucleo_origem: string | null
  membro_id?: number | null
}

export type Perfil = {
  id: string
  full_name: string | null
  email: string | null
  role: Papel
  status?: SituacaoUsuario
  membro_id?: number | null
  /** Núcleo do usuário (nulo para o Mestre Central). */
  nucleo_id?: number | null
  /** Região do Mestre Central. */
  regiao_id?: number | null
}

export type UsuarioAdmin = Perfil & {
  status: SituacaoUsuario
  criado_em: string
  ultimo_acesso: string | null
  provedor: string | null
}

/** Configurações de um núcleo (nome e cidade ficam em `nucleos`). */
export type Configuracoes = {
  logo_arquivo: string | null
  estoque_minimo_litros: number
  dias_lote_parado: number
  somar_maturacao_no_saldo: boolean
  calendario_padrao: string | null
  exigir_leitor_explanador: boolean
  assinatura_relatorio: string | null
  resumo_mensal_email: boolean
}

export type NomeLista =
  | 'tipos_sessao'
  | 'graus'
  | 'tipos_delegacao'
  | 'chamadas'
  | 'historias'
  | 'nucleos'
  | 'motivos_saida'

export type Regiao = {
  id: number
  nome: string
  created_at: string
}

export type Nucleo = {
  id: number
  nome: string
  regiao_id: number
  cidade: string | null
  ativo: boolean
  created_at: string
}

/** Resultado de dados_regionais(): tudo da região, em somente leitura. */
export type DadosRegionais = {
  regiao: Regiao | null
  nucleos: (Nucleo & { configuracao: (Configuracoes & { nucleo_id: number }) | null })[]
  sessoes: (Sessao & { nucleo_id: number })[]
  consumos: (ConsumoSessao & { nucleo_id: number })[]
  preparos: (Preparo & { nucleo_id: number })[]
  saidas: (Saida & { nucleo_id: number })[]
  membros: (Membro & { nucleo_id: number })[]
  chamadas: (ChamadaSessao & { nucleo_id: number })[]
  historias: (Historia & { nucleo_id: number })[]
  visitantes: (Visitante & { nucleo_id: number })[]
  graus: (MudancaGrau & { nucleo_id: number })[]
  responsaveis: { nucleo_id: number; nome: string | null; papel: Papel }[]
}

export type ItemLista = {
  id: number
  regiao_id?: number
  lista: NomeLista
  nome: string
  ordem: number
  ativo: boolean
  cor: string | null
  /** Tipos de sessão: mostra leitor de documentos e explanador. */
  tem_leitura_explanacao: boolean
  /** Só na lista de chamadas. */
  autor?: string | null
}

export type RegistroAtividade = {
  id: number
  user_id: string | null
  acao: 'INSERT' | 'UPDATE' | 'DELETE'
  tabela_afetada: string
  registro_id: number | null
  registro_uuid?: string | null
  dados_antigos: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  mensagem_automatica: string | null
  motivo?: string | null
  created_at: string
}
