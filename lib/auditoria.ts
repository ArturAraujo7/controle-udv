/** Leitura legível do log de atividades (tabela activity_logs). */

export const ROTULO_TABELA: Record<string, string> = {
  sessoes: 'Sessão',
  preparos: 'Preparo',
  saidas: 'Saída',
  consumos_sessao: 'Consumo de sessão',
  membros: 'Membro',
  membros_graus_historico: 'Mudança de grau',
  leituras: 'Documento lido',
  historias: 'História contada',
  visitantes: 'Visitante',
  configuracoes: 'Configurações',
  listas_sistema: 'Lista do sistema',
  profiles: 'Usuário',
}

export const ROTULO_ACAO: Record<string, string> = {
  INSERT: 'Criou',
  UPDATE: 'Editou',
  DELETE: 'Excluiu',
}

const ROTULO_CAMPO: Record<string, string> = {
  data_realizacao: 'Data',
  tipo: 'Tipo',
  dirigente: 'Dirigente',
  dirigente_id: 'Dirigente (cadastro)',
  dirigente_2_id: 'Segundo dirigente (cadastro)',
  tipo_delegacao: 'Delegação',
  leitor_documentos: 'Leitor de documentos',
  leitor_documentos_id: 'Leitor (cadastro)',
  explanador: 'Explanador',
  explanador_id: 'Explanador (cadastro)',
  quantidade_participantes: 'Participantes',
  observacoes: 'Observações',
  data_aproximada: 'Data aproximada',
  fonte_registro: 'Fonte do registro',
  ata_arquivo: 'Ata anexada',
  data_preparo: 'Data do preparo',
  data_chegada: 'Data de chegada',
  nucleo_origem: 'Núcleo de origem',
  mestre_preparo: 'Mestre do preparo',
  mestre_preparo_id: 'Mestre do preparo (cadastro)',
  procedencia_mariri: 'Mariri',
  procedencia_chacrona: 'Chacrona',
  quantidade_preparada: 'Quantidade',
  grau: 'Grau',
  status: 'Situação',
  data_liberacao: 'Liberação prevista',
  data_saida: 'Data da saída',
  quantidade: 'Quantidade',
  destino: 'Destino',
  preparo_id: 'Lote de origem',
  motivo: 'Motivo',
  tipo_destino: 'Tipo de destino',
  id_preparo: 'Lote',
  id_sessao: 'Sessão',
  quantidade_consumida: 'Quantidade consumida',
  nome: 'Nome',
  nome_exibicao: 'Nome de exibição',
  tipo_vinculo: 'Vínculo',
  ativo: 'Ativo',
  data_ingresso: 'Ingresso',
  data_nascimento: 'Nascimento',
  foto_arquivo: 'Foto',
  documento: 'Documento',
  leitor: 'Leitor',
  leitor_id: 'Leitor (cadastro)',
  titulo_historia: 'História',
  full_name: 'Nome',
  email: 'E-mail',
  role: 'Papel',
  membro_id: 'Membro vinculado',
  grau_anterior: 'Grau anterior',
  grau_novo: 'Novo grau',
  data: 'Data',
  lista: 'Lista',
  ordem: 'Ordem',
  cor: 'Cor',
  exige_explanador: 'Exige explanador',
}

/** Campos técnicos que nunca aparecem no diff. */
const IGNORAR = new Set(['id', 'created_at', 'updated_at', 'user_id', 'motivo_alteracao'])

/** Tabelas cujas edições podem ser desfeitas pela tela de auditoria. */
export const TABELAS_RESTAURAVEIS = new Set(['sessoes', 'preparos', 'saidas', 'membros'])

/** Tabelas que têm a coluna motivo_alteracao. */
export const TABELAS_COM_MOTIVO = new Set(['sessoes', 'preparos', 'saidas'])

export function rotuloCampo(campo: string) {
  return ROTULO_CAMPO[campo] ?? campo.replace(/_/g, ' ')
}

export type Registro = Record<string, unknown> | null | undefined

export type CampoAlterado = { campo: string; rotulo: string; antes: unknown; depois: unknown }

const iguais = (a: unknown, b: unknown) => {
  if (a === b) return true
  if (a == null && b == null) return true
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b)
  return JSON.stringify(a) === JSON.stringify(b)
}

export function camposAlterados(antes: Registro, depois: Registro): CampoAlterado[] {
  const chaves = new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})])
  return [...chaves]
    .filter(campo => !IGNORAR.has(campo) && !iguais(antes?.[campo], depois?.[campo]))
    .map(campo => ({ campo, rotulo: rotuloCampo(campo), antes: antes?.[campo], depois: depois?.[campo] }))
}

/** Campos preenchidos de um registro (criação ou exclusão). */
export function camposPreenchidos(registro: Registro) {
  return Object.entries(registro ?? {})
    .filter(([campo, valor]) => !IGNORAR.has(campo) && valor !== null && valor !== '')
    .map(([campo, valor]) => ({ campo, rotulo: rotuloCampo(campo), valor }))
}

/** Campos que guardam volume de vegetal, exibidos em litros. */
const CAMPOS_LITROS = new Set(['quantidade', 'quantidade_preparada', 'quantidade_consumida', 'estoque_minimo_litros'])

export function formatarValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (typeof valor === 'number') {
    return CAMPOS_LITROS.has(campo)
      ? `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`
      : String(valor)
  }
  if (typeof valor === 'string') {
    if (/_arquivo$/.test(campo)) return 'Arquivo anexado'
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(valor)) {
      return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })
    }
    return valor
  }
  return JSON.stringify(valor)
}

/** Frase curta com as mudanças: "Participantes: 32 → 34 · +1 campo". */
export function resumoAlteracao(antes: Registro, depois: Registro) {
  const campos = camposAlterados(antes, depois)
  if (campos.length === 0) return 'Sem mudanças visíveis'
  const [primeiro, ...resto] = campos
  const base = `${primeiro.rotulo}: ${formatarValor(primeiro.campo, primeiro.antes)} → ${formatarValor(primeiro.campo, primeiro.depois)}`
  return resto.length ? `${base} · +${resto.length} ${resto.length === 1 ? 'campo' : 'campos'}` : base
}

/** Descrição do registro a partir dos dados gravados. */
export function descreverRegistro(tabela: string, dados: Registro) {
  if (!dados) return ROTULO_TABELA[tabela] ?? tabela
  const d = dados as Record<string, string | number | null>
  const data = (valor: unknown) => (typeof valor === 'string' ? formatarValor('data', valor.slice(0, 10)) : '')
  switch (tabela) {
    case 'sessoes': return `Sessão · ${d.tipo ?? '—'} · ${data(d.data_realizacao)}`
    case 'preparos': return `Preparo · ${d.mestre_preparo ?? d.nucleo_origem ?? '—'} · ${data(d.data_preparo)}`
    case 'saidas': return `Saída para ${d.destino ?? '—'} · ${data(d.data_saida)}`
    case 'membros': return `Membro · ${d.nome_exibicao || d.nome || '—'}`
    case 'profiles': return `Usuário · ${d.full_name || d.email || '—'}`
    case 'listas_sistema': return `Lista · ${d.nome ?? '—'}`
    default: return ROTULO_TABELA[tabela] ?? tabela
  }
}

/** Link para o registro atual (quando ainda existe tela para ele). */
export function hrefRegistro(tabela: string, registroId: number | null, registroUuid?: string | null) {
  if (tabela === 'profiles' && registroUuid) return `/admin/usuarios/${registroUuid}`
  if (!registroId) return null
  switch (tabela) {
    case 'sessoes': return `/sessoes/${registroId}`
    case 'preparos': return `/estoque/${registroId}`
    case 'saidas': return `/editar-saida/${registroId}`
    case 'membros': return `/membros/${registroId}`
    case 'configuracoes': return '/admin/configuracoes'
    default: return null
  }
}

/** Variação de litros no estoque causada pela alteração, quando houver. */
export function impactoEstoque(tabela: string, acao: string, antes: Registro, depois: Registro) {
  const campo = tabela === 'preparos' ? 'quantidade_preparada'
    : tabela === 'saidas' ? 'quantidade'
      : tabela === 'consumos_sessao' ? 'quantidade_consumida'
        : null
  if (!campo) return null
  const valorAntes = acao === 'INSERT' ? 0 : Number(antes?.[campo] ?? 0)
  const valorDepois = acao === 'DELETE' ? 0 : Number(depois?.[campo] ?? 0)
  const diferenca = valorDepois - valorAntes
  if (diferenca === 0) return null
  // Preparo soma no estoque; saída e consumo subtraem.
  return tabela === 'preparos' ? diferenca : -diferenca
}
