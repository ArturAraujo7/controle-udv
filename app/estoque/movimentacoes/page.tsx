'use client'
import { useMemo, useState } from 'react'
import { History } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { ListaCard, Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { ItemMovimentacao } from '@/components/estoque/ItemMovimentacao'
import { SUBNAV_ESTOQUE, SubNav } from '@/components/layout/SubNav'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { agruparPorMes, montarMovimentacoes, type TipoMovimentacao } from '@/lib/estoque'
import { anoDe, formatarNumero, rotuloMes } from '@/lib/formato'
import { podeEditar } from '@/lib/permissoes'

type FiltroTipo = 'todas' | TipoMovimentacao

const PASSO = 60

export default function EstoqueMovimentacoes() {
  const { profile } = useAuth()
  const editor = podeEditar(profile)
  const { carregando, erro, preparos, consumos, saidas, sessoes } = useDadosEstoque()
  const [tipo, setTipo] = useState<FiltroTipo>('todas')
  const [ano, setAno] = useState('todos')
  const [limite, setLimite] = useState(PASSO)

  const movimentacoes = useMemo(
    () => montarMovimentacoes({ preparos, sessoes, consumos, saidas }),
    [preparos, sessoes, consumos, saidas]
  )

  const anos = [...new Set(movimentacoes.map(m => anoDe(m.data)))].sort((a, b) => b - a)
  const doAno = movimentacoes.filter(m => ano === 'todos' || anoDe(m.data) === Number(ano))
  const filtradas = doAno.filter(m => tipo === 'todas' || m.tipo === tipo)
  const grupos = agruparPorMes(filtradas.slice(0, limite), m => m.data)

  const contar = (t: TipoMovimentacao) => doAno.filter(m => m.tipo === t).length

  return (
    <>
      <Cabecalho titulo="Estoque" />
      <SubNav itens={SUBNAV_ESTOQUE} />

      {erro && <div className="mb-4"><Vazio>Não foi possível carregar o extrato: {erro}</Vazio></div>}

      <div className="space-y-3">
        <ChipsFiltro
          rotulo="Tipo de movimentação"
          valor={tipo}
          onChange={v => { setTipo(v); setLimite(PASSO) }}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', contagem: doAno.length },
            { valor: 'entrada', rotulo: 'Entradas', contagem: contar('entrada') },
            { valor: 'consumo', rotulo: 'Consumo', contagem: contar('consumo') },
            { valor: 'saida', rotulo: 'Saídas', contagem: contar('saida') },
          ]}
        />
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="periodo" className="text-muted-foreground">Período</Label>
          <Select value={ano} onValueChange={v => { setAno(v); setLimite(PASSO) }}>
            <SelectTrigger id="periodo" className="min-w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo o histórico</SelectItem>
              {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5">
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-xl" />)}
          </div>
        ) : filtradas.length === 0 ? (
          <Vazio icone={<History />}>Nenhuma movimentação neste filtro.</Vazio>
        ) : (
          <div className="space-y-6">
            {grupos.map(grupo => {
              const entradas = grupo.itens.filter(m => m.tipo === 'entrada').reduce((a, m) => a + m.quantidade, 0)
              const baixas = grupo.itens.filter(m => m.tipo !== 'entrada').reduce((a, m) => a + m.quantidade, 0)
              return (
                <section key={grupo.chave}>
                  <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                    <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {rotuloMes(grupo.chave)}
                    </h2>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {entradas > 0 && <span className="text-primary">+{formatarNumero(entradas)} L</span>}
                      {entradas > 0 && baixas > 0 && ' · '}
                      {baixas > 0 && `−${formatarNumero(baixas)} L`}
                    </span>
                  </div>
                  <ListaCard>
                    {grupo.itens.map(mov => (
                      <ItemMovimentacao key={mov.id} mov={mov} podeEditar={editor} mostrarSaldo />
                    ))}
                  </ListaCard>
                </section>
              )
            })}

            {filtradas.length > limite && (
              <Button variant="outline" className="w-full" onClick={() => setLimite(l => l + PASSO)}>
                Mostrar mais ({filtradas.length - limite} restantes)
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground">
              O saldo à direita é o total do estoque logo após cada movimentação.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
