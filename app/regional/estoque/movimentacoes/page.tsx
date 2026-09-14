'use client'
import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Droplets, History } from 'lucide-react'

import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { IconeLinha, ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { SubNav } from '@/components/layout/SubNav'
import { BadgeNucleo, CarregandoRegional } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { agruparPorMes, type TipoMovimentacao } from '@/lib/estoque'
import { anoDe, formatarData, formatarNumero, rotuloMes } from '@/lib/formato'
import { cn } from '@/lib/utils'

const SUBNAV = [
  { href: '/regional/estoque', rotulo: 'Por núcleo' },
  { href: '/regional/estoque/movimentacoes', rotulo: 'Movimentações' },
]

const ICONE = { entrada: ArrowDownLeft, consumo: Droplets, saida: ArrowUpRight }
const PASSO = 60

export default function MovimentacoesRegionais() {
  const { dados, resumo, nomeNucleo } = useRegional()
  const [tipo, setTipo] = useState<'todas' | TipoMovimentacao>('todas')
  const [nucleo, setNucleo] = useState('todos')
  const [ano, setAno] = useState('todos')
  const [limite, setLimite] = useState(PASSO)

  const todas = useMemo(
    () =>
      (resumo?.resumos ?? [])
        .flatMap(r => r.movimentacoes.map(m => ({ ...m, nucleoId: r.nucleo.id })))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [resumo]
  )

  if (!dados || !resumo) return <><Cabecalho titulo="Estoque" /><CarregandoRegional /></>

  const anos = [...new Set(todas.map(m => anoDe(m.data)))].sort((a, b) => b - a)
  const base = todas
    .filter(m => nucleo === 'todos' || String(m.nucleoId) === nucleo)
    .filter(m => ano === 'todos' || anoDe(m.data) === Number(ano))
  const filtradas = base.filter(m => tipo === 'todas' || m.tipo === tipo)
  const grupos = agruparPorMes(filtradas.slice(0, limite), m => m.data)
  const contar = (t: TipoMovimentacao) => base.filter(m => m.tipo === t).length

  return (
    <>
      <Cabecalho titulo="Estoque" />
      <FaixaRegional />
      <SubNav itens={SUBNAV} />

      <div className="space-y-3">
        <ChipsFiltro
          rotulo="Tipo de movimentação"
          valor={tipo}
          onChange={v => { setTipo(v); setLimite(PASSO) }}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', contagem: base.length },
            { valor: 'entrada', rotulo: 'Entradas', contagem: contar('entrada') },
            { valor: 'consumo', rotulo: 'Consumo', contagem: contar('consumo') },
            { valor: 'saida', rotulo: 'Saídas', contagem: contar('saida') },
          ]}
        />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select value={nucleo} onValueChange={v => { setNucleo(v); setLimite(PASSO) }}>
            <SelectTrigger className="h-10 w-full md:w-56" aria-label="Núcleo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os núcleos</SelectItem>
              {dados.nucleos.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ano} onValueChange={v => { setAno(v); setLimite(PASSO) }}>
            <SelectTrigger className="h-10 w-full md:w-40" aria-label="Ano"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o histórico</SelectItem>
              {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5">
        {filtradas.length === 0 ? (
          <Vazio icone={<History />}>Nenhuma movimentação neste filtro.</Vazio>
        ) : (
          <div className="space-y-6">
            {grupos.map(grupo => (
              <section key={grupo.chave}>
                <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{rotuloMes(grupo.chave)}</h2>
                <ListaCard>
                  {grupo.itens.map(m => {
                    const Icone = ICONE[m.tipo]
                    const entrada = m.tipo === 'entrada'
                    return (
                      <ItemLista
                        key={`${m.nucleoId}-${m.id}`}
                        href={m.tipo === 'entrada' ? `/regional/lotes/${m.refId}` : m.tipo === 'consumo' ? `/regional/sessoes/${m.refId}` : undefined}
                        inicio={
                          <IconeLinha className={cn(entrada && 'bg-primary/10 text-primary', m.tipo === 'saida' && 'bg-destructive/10 text-destructive')}>
                            <Icone />
                          </IconeLinha>
                        }
                        sobre={<BadgeNucleo nome={nomeNucleo(m.nucleoId)} />}
                        titulo={m.titulo}
                        subtitulo={`${formatarData(m.data)} · ${m.subtitulo}`}
                        fim={
                          <ValorLinha
                            valor={`${entrada ? '+' : '−'}${formatarNumero(m.quantidade)} L`}
                            detalhe={`saldo ${formatarNumero(m.saldoApos)} L`}
                            className={entrada ? 'text-primary' : undefined}
                          />
                        }
                      />
                    )
                  })}
                </ListaCard>
              </section>
            ))}
            {filtradas.length > limite && (
              <Button variant="outline" className="w-full" onClick={() => setLimite(l => l + PASSO)}>
                Mostrar mais ({filtradas.length - limite} restantes)
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">O saldo à direita é o estoque do núcleo logo após cada movimentação.</p>
          </div>
        )}
      </div>
    </>
  )
}
