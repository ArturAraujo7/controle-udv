import { supabase } from './supabaseClient'
import type { ConsumoSessao, Historia, Leitura, Sessao, Visitante } from './tipos'

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

export type LeituraForm = { chave: string; documento: string; leitor: MembroRef }
export type HistoriaForm = { chave: string; titulo: string }
export type VisitanteForm = { chave: string; nome: string; nucleo_origem: string }

export type FilhosSessao = {
  leituras: LeituraForm[]
  historias: HistoriaForm[]
  visitantes: VisitanteForm[]
}

export const FILHOS_VAZIOS: FilhosSessao = { leituras: [], historias: [], visitantes: [] }

export const novaChave = () => crypto.randomUUID()

/** Sessão com consumos, leituras, histórias e visitantes — para editar ou duplicar. */
export async function carregarSessaoCompleta(id: number) {
  const [sessao, consumos, leituras, historias, visitantes] = await Promise.all([
    supabase.from('sessoes').select('*').eq('id', id).single(),
    supabase.from('consumos_sessao').select('id, id_sessao, id_preparo, quantidade_consumida').eq('id_sessao', id),
    supabase.from('leituras').select('*').eq('id_sessao', id).order('id'),
    supabase.from('historias').select('*').eq('id_sessao', id).order('id'),
    supabase.from('visitantes').select('*').eq('id_sessao', id).order('id'),
  ])

  if (sessao.error || !sessao.data) return null

  return {
    sessao: sessao.data as Sessao,
    consumos: (consumos.data ?? []) as ConsumoSessao[],
    filhos: {
      leituras: ((leituras.data ?? []) as Leitura[]).map(l => ({
        chave: novaChave(),
        documento: l.documento,
        leitor: { id: l.leitor_id, nome: l.leitor || '' },
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
 * Grava leituras, histórias e visitantes da sessão. Com `substituir`, apaga os
 * registros anteriores antes de inserir. Devolve as mensagens de erro, se houver.
 */
export async function salvarFilhosSessao(idSessao: number, filhos: FilhosSessao, substituir: boolean) {
  const linhas = {
    leituras: filhos.leituras
      .filter(l => l.documento.trim())
      .map(l => ({ id_sessao: idSessao, documento: l.documento.trim(), leitor: l.leitor.nome.trim() || null, leitor_id: l.leitor.id })),
    historias: filhos.historias
      .filter(h => h.titulo.trim())
      .map(h => ({ id_sessao: idSessao, titulo_historia: h.titulo.trim() })),
    visitantes: filhos.visitantes
      .filter(v => v.nome.trim())
      .map(v => ({ id_sessao: idSessao, nome: v.nome.trim(), nucleo_origem: v.nucleo_origem.trim() || null })),
  }

  const erros: string[] = []
  for (const tabela of ['leituras', 'historias', 'visitantes'] as const) {
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
