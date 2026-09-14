'use client'
import { use, useMemo, useState } from 'react'
import { History } from 'lucide-react'

import { Avatar } from '@/components/comum/Avatar'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { Indicador } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ListaDados, Vazio } from '@/components/comum/Lista'
import { Secao, VoltarLink } from '@/components/comum/Secao'
import { CarregandoRegional, NotaSomenteLeitura } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { agruparPorMes } from '@/lib/estoque'
import { anoDe, formatarData, formatarDiaMes, formatarNumero, formatarRelativo, rotuloMes } from '@/lib/formato'
import { nomeMembro } from '@/lib/membros'
import { ROTULO_PARTICIPACAO, participacoesDoMembro, type PapelParticipacao } from '@/lib/participacoes'
import { dadosDoNucleo } from '@/lib/regional'

type Periodo = 'ano' | 'anterior' | 'todos'
type Filtro = 'todas' | 'dirigente' | 'leitor' | 'explanador' | 'preparo'

const COR_PAPEL: Record<PapelParticipacao, string> = {
  dirigente: 'border-primary/40 text-primary',
  delegacao: 'border-primary/40 text-primary',
  leitor: '',
  explanador: '',
  preparo: 'border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-300',
}

export default function MembroRegional({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idMembro = Number(id)
  const { dados, agora } = useRegional()
  const [periodo, setPeriodo] = useState<Periodo>('ano')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [completo, setCompleto] = useState(false)

  const base = useMemo(() => {
    const membro = dados?.membros.find(m => m.id === idMembro)
    if (!dados || !membro) return null
    const d = dadosDoNucleo(dados, membro.nucleo_id)
    return {
      membro,
      nucleo: dados.nucleos.find(n => n.id === membro.nucleo_id) ?? null,
      participacoes: participacoesDoMembro(idMembro, d),
      preparos: d.preparos.filter(p => p.mestre_preparo_id === idMembro),
      graus: d.graus.filter(g => g.membro_id === idMembro).sort((a, b) => b.data.localeCompare(a.data)),
    }
  }, [dados, idMembro])

  if (!dados) return <><VoltarLink href="/regional/sessoes" rotulo="Sessões" /><CarregandoRegional /></>
  if (!base) {
    return (
      <>
        <VoltarLink href="/regional/sessoes" rotulo="Sessões" />
        <Vazio>Membro não encontrado na região.</Vazio>
      </>
    )
  }

  const { membro, nucleo, participacoes, preparos, graus } = base
  const anoAtual = agora.getFullYear()
  const noPeriodo = (data: string) => periodo === 'todos' || anoDe(data) === (periodo === 'ano' ? anoAtual : anoAtual - 1)
  const doPeriodo = participacoes.filter(p => noPeriodo(p.data))
  const contar = (...papeis: PapelParticipacao[]) => doPeriodo.filter(p => papeis.includes(p.papel)).length
  const preparosPeriodo = preparos.filter(p => noPeriodo(p.data_preparo))

  const filtradas = participacoes.filter(p =>
    filtro === 'todas' ? true : filtro === 'dirigente' ? p.papel === 'dirigente' || p.papel === 'delegacao' : p.papel === filtro
  )
  const visiveis = completo ? filtradas : filtradas.slice(0, 20)
  const ultimaVez = participacoes.find(p => p.papel !== 'preparo')?.data

  return (
    <>
      <VoltarLink href={`/regional/nucleos/${membro.nucleo_id}?aba=membros`} rotulo={nucleo?.nome ?? 'Núcleo'} />
      <FaixaRegional nucleo={nucleo} />

      <div className="mb-5 flex items-center gap-4">
        <Avatar nome={membro.nome_exibicao || membro.nome} arquivo={membro.foto_arquivo} className="size-16 text-lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{nomeMembro(membro)}</h1>
          {membro.nome_exibicao && membro.nome_exibicao !== membro.nome && (
            <p className="truncate text-sm text-muted-foreground">{membro.nome}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {membro.grau && <Badge variant="secondary">{membro.grau}</Badge>}
            <Badge variant="outline">{membro.tipo_vinculo}</Badge>
            <Badge variant={membro.ativo ? 'default' : 'outline'}>{membro.ativo ? 'Ativo' : 'Inativo'}</Badge>
          </div>
        </div>
      </div>

      <ChipsFiltro
        rotulo="Período"
        valor={periodo}
        onChange={setPeriodo}
        opcoes={[
          { valor: 'ano', rotulo: String(anoAtual) },
          { valor: 'anterior', rotulo: String(anoAtual - 1) },
          { valor: 'todos', rotulo: 'Todo o período' },
        ]}
      />

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador rotulo="Dirigiu" valor={contar('dirigente', 'delegacao')} unidade="sessões" />
        <Indicador rotulo="Leu documentos" valor={contar('leitor')} unidade="sessões" />
        <Indicador rotulo="Fez explanação" valor={contar('explanador')} unidade="sessões" />
        <Indicador rotulo="Mestre de preparo" valor={preparosPeriodo.length} unidade={`· ${formatarNumero(preparosPeriodo.reduce((a, p) => a + Number(p.quantidade_preparada), 0))} L`} />
      </div>
      {ultimaVez && (
        <p className="mt-3 px-1 text-xs text-muted-foreground">Última participação {formatarRelativo(ultimaVez, agora)}</p>
      )}

      <Secao titulo="Histórico de participação" acao={`${participacoes.length} registros`}>
        <ChipsFiltro
          className="mb-3"
          rotulo="Função"
          valor={filtro}
          onChange={v => { setFiltro(v); setCompleto(false) }}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas' },
            { valor: 'dirigente', rotulo: 'Dirigente' },
            { valor: 'leitor', rotulo: 'Leitor' },
            { valor: 'explanador', rotulo: 'Explanador' },
            { valor: 'preparo', rotulo: 'Preparo' },
          ]}
        />
        {filtradas.length === 0 ? (
          <Vazio icone={<History />}>Nenhuma participação registrada.</Vazio>
        ) : (
          <div className="space-y-5">
            {agruparPorMes(visiveis, p => p.data).map(grupo => (
              <section key={grupo.chave}>
                <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{rotuloMes(grupo.chave)}</h3>
                <ListaCard>
                  {grupo.itens.map(p => (
                    <ItemLista
                      key={p.chave}
                      href={p.sessaoId ? `/regional/sessoes/${p.sessaoId}` : p.preparoId ? `/regional/lotes/${p.preparoId}` : undefined}
                      sobre={<Badge variant="outline" className={COR_PAPEL[p.papel]}>{ROTULO_PARTICIPACAO[p.papel]}</Badge>}
                      titulo={p.titulo}
                      subtitulo={p.subtitulo}
                    />
                  ))}
                </ListaCard>
              </section>
            ))}
            {filtradas.length > visiveis.length && (
              <Button variant="outline" className="w-full" onClick={() => setCompleto(true)}>
                Ver histórico completo ({filtradas.length})
              </Button>
            )}
          </div>
        )}
      </Secao>

      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        {(graus.length > 0 || membro.data_ingresso) && (
          <Secao titulo="Trajetória">
            <ListaCard>
              {graus.map(g => (
                <ItemLista key={g.id} titulo={g.grau_anterior ? `${g.grau_anterior} → ${g.grau_novo}` : g.grau_novo} subtitulo={formatarData(g.data)} />
              ))}
              {membro.data_ingresso && <ItemLista titulo="Ingresso no núcleo" subtitulo={formatarData(membro.data_ingresso)} />}
            </ListaCard>
          </Secao>
        )}

        <Secao titulo="Dados cadastrais">
          <ListaDados
            itens={[
              { rotulo: 'Nome completo', valor: membro.nome },
              { rotulo: 'Nome de exibição', valor: membro.nome_exibicao || '—' },
              { rotulo: 'Grau', valor: membro.grau || '—' },
              { rotulo: 'Vínculo', valor: membro.tipo_vinculo },
              ...(membro.tipo_vinculo === 'Visitante' ? [{ rotulo: 'Núcleo de origem', valor: membro.nucleo_origem || '—' }] : []),
              { rotulo: 'Núcleo', valor: nucleo?.nome ?? '—' },
              { rotulo: 'Situação', valor: membro.ativo ? 'Ativo' : 'Inativo' },
              ...(membro.data_nascimento ? [{ rotulo: 'Aniversário', valor: formatarDiaMes(membro.data_nascimento) }] : []),
            ]}
          />
        </Secao>
      </div>

      <NotaSomenteLeitura>Visão somente leitura: o cadastro do membro é mantido pelo próprio núcleo.</NotaSomenteLeitura>
    </>
  )
}
