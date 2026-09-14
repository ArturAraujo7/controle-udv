import { supabase } from './supabaseClient'
import type { ChamadaSessao, ConsumoSessao, Historia, Sessao, Visitante } from './tipos'

export type MembroRef = { id: number | null; nome: string }

export type CondutoresForm = {
  dirigentes: MembroRef[]
  tipo_delegacao: string
  leitor: MembroRef
  explanador: MembroRef
}

export const CONDUTORES_VAZIOS: CondutoresForm = {
  dirigentes: [],
  tipo_delegacao: 'Transmissão da Assistência',
  leitor: { id: null, nome: '' },
  explanador: { id: null, nome: '' },
}

/** Converte as colunas da sessão para o bloco de condutores do formulário. */
export function condutoresDaSessao(sessao: Sessao): CondutoresForm {
  const nomes = (sessao.dirigente || '').split(' / ').map(n => n.trim()).filter(Boolean)
  const dirigentes: MembroRef[] = []
  if (nomes[0] || sessao.dirigente_id) dirigentes.push({ id: sessao.dirigente_id, nome: nomes[0] ?? '' })
  if (nomes[1] || sessao.dirigente_2_id) dirigentes.push({ id: sessao.dirigente_2_id, nome: nomes[1] ?? '' })

  return {
    dirigentes,
    tipo_delegacao: sessao.tipo_delegacao || CONDUTORES_VAZIOS.tipo_delegacao,
    leitor: { id: sessao.leitor_documentos_id, nome: sessao.leitor_documentos || '' },
    explanador: { id: sessao.explanador_id, nome: sessao.explanador || '' },
  }
}

/** Colunas da tabela `sessoes` a partir do bloco de condutores. */
export function colunasCondutores(c: CondutoresForm) {
  return {
    dirigente: c.dirigentes.map(d => d.nome).join(' / '),
    dirigente_id: c.dirigentes[0]?.id ?? null,
    dirigente_2_id: c.dirigentes[1]?.id ?? null,
    tipo_delegacao: c.dirigentes.length > 1 ? c.tipo_delegacao : null,
    leitor_documentos: c.leitor.nome.trim() || null,
    leitor_documentos_id: c.leitor.id,
    explanador: c.explanador.nome.trim() || null,
    explanador_id: c.explanador.id,
  }
}

/** Chamada feita na sessão: item do catálogo (nome e autor) e quem fez. */
export type ChamadaForm = { chave: string; chamada: string; autor: string | null; pessoa: MembroRef }
export type HistoriaForm = { chave: string; titulo: string }
export type VisitanteForm = { chave: string; nome: string; nucleo_origem: string }

export type FilhosSessao = {
  chamadas: ChamadaForm[]
  historias: HistoriaForm[]
  visitantes: VisitanteForm[]
}

export const FILHOS_VAZIOS: FilhosSessao = { chamadas: [], historias: [], visitantes: [] }

export const novaChave = () => crypto.randomUUID()

/** Sessão com consumos, chamadas, histórias e visitantes — para editar ou duplicar. */
export async function carregarSessaoCompleta(id: number) {
  const [sessao, consumos, chamadas, historias, visitantes] = await Promise.all([
    supabase.from('sessoes').select('*').eq('id', id).single(),
    supabase.from('consumos_sessao').select('id, id_sessao, id_preparo, quantidade_consumida').eq('id_sessao', id),
    supabase.from('chamadas_sessao').select('*').eq('id_sessao', id).order('id'),
    supabase.from('historias').select('*').eq('id_sessao', id).order('id'),
    supabase.from('visitantes').select('*').eq('id_sessao', id).order('id'),
  ])

  if (sessao.error || !sessao.data) return null

  return {
    sessao: sessao.data as Sessao,
    consumos: (consumos.data ?? []) as ConsumoSessao[],
    filhos: {
      chamadas: ((chamadas.data ?? []) as ChamadaSessao[]).map(c => ({
        chave: novaChave(),
        chamada: c.chamada,
        autor: c.autor,
        pessoa: { id: c.membro_id, nome: c.pessoa || '' },
      })),
      historias: ((historias.data ?? []) as Historia[]).map(h => ({ chave: novaChave(), titulo: h.titulo_historia })),
      visitantes: ((visitantes.data ?? []) as Visitante[]).map(v => ({
        chave: novaChave(),
        nome: v.nome,
        nucleo_origem: v.nucleo_origem || '',
      })),
    } satisfies FilhosSessao,
  }
}

/**
 * Grava chamadas, histórias e visitantes da sessão. Com `substituir`, apaga os
 * registros anteriores antes de inserir. Devolve as mensagens de erro, se houver.
 */
export async function salvarFilhosSessao(idSessao: number, filhos: FilhosSessao, substituir: boolean) {
  const linhas = {
    chamadas_sessao: filhos.chamadas
      .filter(c => c.chamada.trim())
      .map(c => ({
        id_sessao: idSessao,
        chamada: c.chamada.trim(),
        autor: c.autor?.trim() || null,
        pessoa: c.pessoa.nome.trim() || null,
        membro_id: c.pessoa.id,
      })),
    historias: filhos.historias
      .filter(h => h.titulo.trim())
      .map(h => ({ id_sessao: idSessao, titulo_historia: h.titulo.trim() })),
    visitantes: filhos.visitantes
      .filter(v => v.nome.trim())
      .map(v => ({ id_sessao: idSessao, nome: v.nome.trim(), nucleo_origem: v.nucleo_origem.trim() || null })),
  }

  const erros: string[] = []
  for (const tabela of ['chamadas_sessao', 'historias', 'visitantes'] as const) {
    if (substituir) {
      const { error } = await supabase.from(tabela).delete().eq('id_sessao', idSessao)
      if (error) { erros.push(error.message); continue }
    }
    if (linhas[tabela].length > 0) {
      const { error } = await supabase.from(tabela).insert(linhas[tabela])
      if (error) erros.push(error.message)
    }
  }
  return erros
}

/** Número decimal digitado com vírgula ou ponto. */
export function lerNumero(texto: string) {
  const n = Number(texto.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
