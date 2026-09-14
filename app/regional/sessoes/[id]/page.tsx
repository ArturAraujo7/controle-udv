'use client'
import Link from 'next/link'
import { use } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Droplets, History, Music, Printer } from 'lucide-react'

import { ArquivoAnexo } from '@/components/comum/ArquivoAnexo'
import { Avatar } from '@/components/comum/Avatar'
import { ResumoLinha } from '@/components/comum/Indicadores'
import { IconeLinha, ItemLista, ListaCard, ListaDados, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao, VoltarLink } from '@/components/comum/Secao'
import { CarregandoRegional, NotaSomenteLeitura } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { calcularSaldos, ehSessaoHistorica } from '@/lib/estoque'
import { anoDe, formatarData, formatarDataExtensa, formatarDataHora, formatarDiaMes, formatarHora, formatarNumero, hojeISO } from '@/lib/formato'
import { nomeMembro, rotuloMestre } from '@/lib/membros'
import { dadosDoNucleo } from '@/lib/regional'

export default function SessaoRegional({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idSessao = Number(id)
  const { dados, agora } = useRegional()

  if (!dados) return <><VoltarLink href="/regional/sessoes" rotulo="Sessões" /><CarregandoRegional /></>

  const sessao = dados.sessoes.find(s => s.id === idSessao)
  if (!sessao) {
    return (
      <>
        <VoltarLink href="/regional/sessoes" rotulo="Sessões" />
        <Vazio icone={<History />}>Sessão não encontrada na região.</Vazio>
      </>
    )
  }

  const nucleo = dados.nucleos.find(n => n.id === sessao.nucleo_id) ?? null
  const d = dadosDoNucleo(dados, sessao.nucleo_id)
  const lotes = new Map(calcularSaldos(d.preparos, d.consumos, d.saidas, { hoje: hojeISO(agora), sessoes: d.sessoes }).map(l => [l.id, l]))
  const consumos = d.consumos.filter(c => c.id_sessao === sessao.id)
  const total = consumos.reduce((a, c) => a + Number(c.quantidade_consumida), 0)
  const historica = ehSessaoHistorica(sessao)

  const ordenadas = [...d.sessoes].sort((a, b) => a.data_realizacao.localeCompare(b.data_realizacao) || a.id - b.id)
  const indice = ordenadas.findIndex(s => s.id === sessao.id)
  const anterior = ordenadas[indice - 1]
  const proxima = ordenadas[indice + 1]
  const ordinal = historica
    ? null
    : ordenadas.filter(s => !ehSessaoHistorica(s) && anoDe(s.data_realizacao) === anoDe(sessao.data_realizacao)).findIndex(s => s.id === sessao.id) + 1

  const membroPorId = new Map(d.membros.map(m => [m.id, m]))
  const pessoa = (idMembro: number | null, texto: string | null | undefined) => {
    const membro = idMembro ? membroPorId.get(idMembro) : undefined
    return { idMembro: membro?.id ?? null, nome: membro ? nomeMembro(membro) : texto?.trim() || null, foto: membro?.foto_arquivo ?? null }
  }
  const nomes = (sessao.dirigente || '').split(' / ')
  const condutores = [
    { papel: 'Dirigente', ...pessoa(sessao.dirigente_id, nomes[0]) },
    ...(sessao.dirigente_2_id || nomes[1] ? [{ papel: `Dirigente · ${sessao.tipo_delegacao || 'delegação'}`, ...pessoa(sessao.dirigente_2_id, nomes[1]) }] : []),
    { papel: 'Leitor de documentos', ...pessoa(sessao.leitor_documentos_id, sessao.leitor_documentos) },
    { papel: 'Explanador', ...pessoa(sessao.explanador_id, sessao.explanador) },
  ]

  const chamadas = d.chamadas.filter(c => c.id_sessao === sessao.id)
  const historias = d.historias.filter(h => h.id_sessao === sessao.id)
  const visitantes = d.visitantes.filter(v => v.id_sessao === sessao.id)
  const porPessoa = sessao.quantidade_participantes > 0 ? (total * 1000) / sessao.quantidade_participantes : 0

  return (
    <>
      <Cabecalho
        voltar={{ href: `/regional/nucleos/${sessao.nucleo_id}?aba=sessoes`, rotulo: nucleo?.nome ?? 'Núcleo' }}
        titulo={formatarDataExtensa(sessao.data_realizacao)}
        descricao={historica ? 'Memória institucional' : `${formatarHora(sessao.data_realizacao)} · ${ordinal}ª sessão de ${anoDe(sessao.data_realizacao)}`}
        acoes={
          <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
            <Printer /> <span className="hidden sm:inline">Exportar ata</span>
          </Button>
        }
      />
      <FaixaRegional nucleo={nucleo} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge>{sessao.tipo}</Badge>
        {historica && <Badge variant="secondary">Registro histórico</Badge>}
        {sessao.tipo_delegacao && <Badge variant="outline">{sessao.tipo_delegacao}</Badge>}
      </div>

      <nav aria-label="Sessões vizinhas do núcleo" className="mb-4 flex justify-between gap-3 text-xs print:hidden">
        {anterior ? (
          <Link href={`/regional/sessoes/${anterior.id}`} className="inline-flex items-center gap-0.5 py-1 font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-3.5" /> Anterior · {formatarDiaMes(anterior.data_realizacao)}
          </Link>
        ) : <span />}
        {proxima && (
          <Link href={`/regional/sessoes/${proxima.id}`} className="inline-flex items-center gap-0.5 py-1 font-medium text-muted-foreground hover:text-foreground">
            Próxima · {formatarDiaMes(proxima.data_realizacao)} <ChevronRight className="size-3.5" />
          </Link>
        )}
      </nav>

      {historica ? (
        <div className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          <BookOpen className="mt-0.5 size-4 shrink-0" />
          Sessão registrada como memória institucional, sem participantes e sem consumo de vegetal.
        </div>
      ) : (
        <ResumoLinha
          itens={[
            { rotulo: 'Participantes', valor: sessao.quantidade_participantes },
            { rotulo: 'Consumo', valor: `${formatarNumero(total)} L` },
            { rotulo: 'Por pessoa', valor: `${Math.round(porPessoa)} ml` },
          ]}
        />
      )}

      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        <Secao titulo="Condução">
          <ListaCard>
            {condutores.map(c => (
              <ItemLista
                key={c.papel}
                href={c.idMembro ? `/regional/membros/${c.idMembro}` : undefined}
                inicio={<Avatar nome={c.nome} arquivo={c.foto} />}
                sobre={<span className="text-[11px] text-muted-foreground">{c.papel}</span>}
                titulo={c.nome ?? '—'}
              />
            ))}
          </ListaCard>
        </Secao>

        {!historica && (
          <Secao titulo="Vegetal servido" acao={`Total ${formatarNumero(total)} L`}>
            {consumos.length === 0 ? (
              <Vazio icone={<Droplets />}>Nenhum consumo registrado.</Vazio>
            ) : (
              <ListaCard>
                {consumos.map(c => {
                  const lote = lotes.get(c.id_preparo)
                  return (
                    <ItemLista
                      key={c.id}
                      href={`/regional/lotes/${c.id_preparo}`}
                      inicio={<IconeLinha><Droplets /></IconeLinha>}
                      titulo={lote ? (lote.tipo === 'Doação' ? lote.nucleo_origem || 'Doação' : rotuloMestre(lote.mestre_preparo)) : `Lote #${c.id_preparo}`}
                      subtitulo={lote ? `${formatarData(lote.data_preparo)}${lote.grau ? ` · Grau ${lote.grau}` : ''}` : undefined}
                      fim={<ValorLinha valor={`${formatarNumero(c.quantidade_consumida)} L`} detalhe={lote ? `saldo atual ${formatarNumero(lote.saldo)} L` : undefined} />}
                    />
                  )
                })}
              </ListaCard>
            )}
          </Secao>
        )}

        {chamadas.length > 0 && (
          <Secao titulo="Chamadas" acao={`${chamadas.length} ${chamadas.length === 1 ? 'chamada' : 'chamadas'}`}>
            <ListaCard>
              {chamadas.map(c => {
                const quem = c.membro_id ? membroPorId.get(c.membro_id) : undefined
                return (
                  <ItemLista
                    key={c.id}
                    href={quem ? `/regional/membros/${quem.id}` : undefined}
                    inicio={<IconeLinha><Music /></IconeLinha>}
                    sobre={c.autor ? <span className="text-[11px] text-muted-foreground">{c.autor}</span> : undefined}
                    titulo={c.chamada}
                    subtitulo={`Feita por ${quem ? nomeMembro(quem) : c.pessoa || '—'}`}
                  />
                )
              })}
            </ListaCard>
          </Secao>
        )}

        {historias.length > 0 && (
          <Secao titulo="Histórias contadas">
            <ListaCard>{historias.map(h => <ItemLista key={h.id} titulo={h.titulo_historia} quebrarTexto />)}</ListaCard>
          </Secao>
        )}

        {visitantes.length > 0 && (
          <Secao titulo="Visitantes" acao={`${visitantes.length} ${visitantes.length === 1 ? 'pessoa' : 'pessoas'}`}>
            <ListaCard>
              {visitantes.map(v => <ItemLista key={v.id} inicio={<Avatar nome={v.nome} />} titulo={v.nome} subtitulo={v.nucleo_origem || undefined} />)}
            </ListaCard>
          </Secao>
        )}

        {sessao.observacoes && (
          <Secao titulo="Observações">
            <Card><CardContent><p className="whitespace-pre-wrap text-sm">{sessao.observacoes}</p></CardContent></Card>
          </Secao>
        )}

        {(sessao.fonte_registro || sessao.ata_arquivo) && (
          <Secao titulo="Fonte do registro">
            <div className="space-y-3">
              {sessao.fonte_registro && <ListaDados itens={[{ rotulo: 'Origem', valor: sessao.fonte_registro }]} />}
              {sessao.ata_arquivo && <ArquivoAnexo caminho={sessao.ata_arquivo} rotulo="Abrir ata" />}
            </div>
          </Secao>
        )}

        <Secao titulo="Registro">
          <ListaDados
            itens={[
              { rotulo: 'Núcleo', valor: nucleo?.nome ?? '—' },
              { rotulo: 'Registrado em', valor: formatarDataHora(sessao.created_at) },
            ]}
          />
        </Secao>
      </div>

      <NotaSomenteLeitura>Visão somente leitura: só o núcleo pode editar esta sessão.</NotaSomenteLeitura>
    </>
  )
}
