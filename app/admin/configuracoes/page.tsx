'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Database, Download, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { useAuth } from '@/components/AuthProvider'
import { ArquivoAnexo } from '@/components/comum/ArquivoAnexo'
import { IconeLinha, ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { BlocoFormulario, Campo, InputUnidade, LinhaInterruptor } from '@/components/formularios/Campos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { invalidarConfiguracoes, normalizarConfiguracoes, useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useEstrutura } from '@/hooks/useEstrutura'
import { enviarArquivo, removerArquivo } from '@/lib/arquivos'
import { LISTAS_SISTEMA } from '@/lib/constants'
import { buscarTodos } from '@/lib/consultas'
import { baixarTabelaCSV } from '@/lib/csv'
import { lerNumero } from '@/lib/sessoes'
import { supabase } from '@/lib/supabaseClient'
import type { Configuracoes } from '@/lib/tipos'

const EXPORTACOES = [
  { tabela: 'sessoes', rotulo: 'Sessões' },
  { tabela: 'consumos_sessao', rotulo: 'Consumos das sessões' },
  { tabela: 'preparos', rotulo: 'Preparos' },
  { tabela: 'saidas', rotulo: 'Saídas' },
  { tabela: 'membros', rotulo: 'Membros' },
  { tabela: 'leituras', rotulo: 'Documentos lidos' },
  { tabela: 'historias', rotulo: 'Histórias contadas' },
  { tabela: 'visitantes', rotulo: 'Visitantes' },
]

export default function PaginaConfiguracoes() {
  return (
    <ExigirAdmin>
      <ConfiguracoesNucleo />
    </ExigirAdmin>
  )
}

function ConfiguracoesNucleo() {
  const { nucleo: meuNucleo } = useAuth()
  const { recarregar: recarregarMinhas } = useConfiguracoes()
  const estrutura = useEstrutura()

  const [escolhido, setEscolhido] = useState<number | null>(null)
  const nucleoId = escolhido ?? meuNucleo?.id ?? estrutura.nucleos[0]?.id ?? null
  const nucleo = estrutura.nucleos.find(n => n.id === nucleoId) ?? null

  const [carregada, setCarregada] = useState<{ nucleoId: number; config: Configuracoes; minimo: string } | null>(null)
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [novoLogo, setNovoLogo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState<string | null>(null)

  useEffect(() => {
    if (!nucleoId) return
    let ativo = true
    supabase.from('configuracoes').select('*').eq('nucleo_id', nucleoId).maybeSingle().then(({ data }) => {
      if (!ativo) return
      const config = normalizarConfiguracoes(data)
      setCarregada({ nucleoId, config, minimo: String(config.estoque_minimo_litros) })
      setNovoLogo(null)
    })
    return () => { ativo = false }
  }, [nucleoId])

  const regiaoId = nucleo?.regiao_id ?? null
  useEffect(() => {
    if (!regiaoId) return
    let ativo = true
    supabase.from('listas_sistema').select('lista').eq('regiao_id', regiaoId).then(({ data }) => {
      if (!ativo) return
      const cont: Record<string, number> = {}
      for (const item of (data ?? []) as { lista: string }[]) cont[item.lista] = (cont[item.lista] ?? 0) + 1
      setContagens(cont)
    })
    return () => { ativo = false }
  }, [regiaoId])

  const config = carregada?.nucleoId === nucleoId ? carregada.config : null
  const atualizar = <K extends keyof Configuracoes>(campo: K, valor: Configuracoes[K]) =>
    setCarregada(c => (c ? { ...c, config: { ...c.config, [campo]: valor } } : c))

  const salvar = async () => {
    if (!config || !nucleoId || !carregada) return
    setSalvando(true)

    let logo = config.logo_arquivo
    if (novoLogo) {
      try {
        logo = await enviarArquivo(novoLogo, 'nucleo')
      } catch (erro) {
        setSalvando(false)
        toast.error('Não foi possível enviar o logo', { description: erro instanceof Error ? erro.message : undefined })
        return
      }
    }

    const { error } = await supabase
      .from('configuracoes')
      .update({
        logo_arquivo: logo,
        estoque_minimo_litros: lerNumero(carregada.minimo),
        dias_lote_parado: Math.max(1, Math.round(config.dias_lote_parado)),
        somar_maturacao_no_saldo: config.somar_maturacao_no_saldo,
        calendario_padrao: config.calendario_padrao?.trim() || null,
        exigir_leitor_explanador: config.exigir_leitor_explanador,
        assinatura_relatorio: config.assinatura_relatorio?.trim() || null,
        resumo_mensal_email: config.resumo_mensal_email,
        updated_at: new Date().toISOString(),
      })
      .eq('nucleo_id', nucleoId)

    setSalvando(false)
    if (error) {
      toast.error('Erro ao salvar as configurações', { description: error.message })
      return
    }
    if (novoLogo && config.logo_arquivo) await removerArquivo(config.logo_arquivo)
    atualizar('logo_arquivo', logo)
    setNovoLogo(null)
    invalidarConfiguracoes()
    if (nucleoId === meuNucleo?.id) await recarregarMinhas()
    toast.success(`Configurações de ${nucleo?.nome ?? 'núcleo'} salvas`)
  }

  const exportar = async (tabela: string, rotulo: string) => {
    setExportando(tabela)
    try {
      const registros = await buscarTodos<Record<string, unknown>>((de, ate) =>
        supabase.from(tabela).select('*').order('id').range(de, ate)
      )
      if (registros.length === 0) toast.info(`${rotulo}: nenhum registro para exportar`)
      else baixarTabelaCSV(`guardiao-${tabela}`, registros)
    } catch (erro) {
      toast.error('Erro ao exportar', { description: erro instanceof Error ? erro.message : undefined })
    } finally {
      setExportando(null)
    }
  }

  if (estrutura.indisponivel) {
    return (
      <>
        <Cabecalho titulo="Configurações" />
        <Vazio icone={<Database />}>
          As configurações por núcleo ainda não estão disponíveis. Aplique as migrations de 13 e 14/09/2026 no Supabase.
        </Vazio>
      </>
    )
  }

  if (estrutura.carregando || !config || !carregada) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    )
  }

  const botaoSalvar = (
    <Button onClick={salvar} disabled={salvando}>
      {salvando && <Loader2 className="animate-spin" />}
      {salvando ? 'Salvando…' : 'Salvar configurações'}
    </Button>
  )

  return (
    <div className="mx-auto max-w-2xl md:mx-0">
      <Cabecalho
        titulo="Configurações"
        descricao="Cada núcleo tem as suas; as listas valem para a região inteira."
        acoes={<div className="hidden md:block">{botaoSalvar}</div>}
      />

      <div className="space-y-5">
        <BlocoFormulario titulo="Núcleo">
          <Select value={nucleoId ? String(nucleoId) : ''} onValueChange={v => setEscolhido(Number(v))}>
            <SelectTrigger className="h-10 w-full" aria-label="Núcleo"><SelectValue /></SelectTrigger>
            <SelectContent>
              {estrutura.nucleos.map(n => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.nome} · {estrutura.nomeRegiao(n.regiao_id)}{n.id === meuNucleo?.id ? ' (seu núcleo)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Nome, cidade e região do núcleo são editados em{' '}
            <Link href="/admin/estrutura" className="text-primary underline-offset-4 hover:underline">Regiões e núcleos</Link>.
          </p>
          <Campo rotulo="Logo" ajuda="Usado no cabeçalho dos relatórios impressos.">
            {config.logo_arquivo && !novoLogo && <ArquivoAnexo caminho={config.logo_arquivo} rotulo="Logo atual" />}
            <label className="flex h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-muted/50">
              <ImagePlus className="size-4" />
              {novoLogo ? novoLogo.name : config.logo_arquivo ? 'Trocar logo' : 'Enviar logo'}
              <input type="file" accept="image/*" className="sr-only" onChange={e => setNovoLogo(e.target.files?.[0] ?? null)} />
            </label>
          </Campo>
        </BlocoFormulario>

        <BlocoFormulario titulo="Estoque">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Alerta de estoque baixo" htmlFor="estoque-minimo" ajuda="O Início avisa quando o saldo fica abaixo disso.">
              <InputUnidade
                id="estoque-minimo"
                value={carregada.minimo}
                onChange={e => setCarregada(c => (c ? { ...c, minimo: e.target.value } : c))}
              />
            </Campo>
            <Campo rotulo="Aviso de lote parado há mais de" htmlFor="dias-parado">
              <InputUnidade
                id="dias-parado"
                unidade="dias"
                step="1"
                className="pr-12"
                value={config.dias_lote_parado}
                onChange={e => atualizar('dias_lote_parado', Number(e.target.value))}
              />
            </Campo>
          </div>
          <LinhaInterruptor
            id="somar-maturacao"
            rotulo="Somar lotes em maturação no saldo"
            descricao="Se desligado, só lotes liberados contam no estoque disponível."
            checked={config.somar_maturacao_no_saldo}
            onCheckedChange={v => atualizar('somar_maturacao_no_saldo', v)}
          />
        </BlocoFormulario>

        <Secao titulo="Listas da região" acao={estrutura.nomeRegiao(regiaoId) ?? undefined} className="mt-0">
          <ListaCard>
            {LISTAS_SISTEMA.map(l => (
              <ItemLista
                key={l.lista}
                href={`/admin/configuracoes/listas/${l.lista}${regiaoId ? `?regiao=${regiaoId}` : ''}`}
                titulo={l.rotulo}
                subtitulo={l.descricao}
                fim={<ValorLinha valor={contagens[l.lista] ?? 0} className="font-normal text-muted-foreground" />}
              />
            ))}
          </ListaCard>
        </Secao>

        <BlocoFormulario titulo="Sessões">
          <Campo rotulo="Calendário padrão" htmlFor="calendario" ajuda="Referência para a escala do ano (ex.: 1º e 3º sábado, 20h).">
            <Input
              id="calendario"
              className="h-10"
              placeholder="Ex.: 1º e 3º sábado · 20h"
              value={config.calendario_padrao ?? ''}
              onChange={e => atualizar('calendario_padrao', e.target.value)}
            />
          </Campo>
          <LinhaInterruptor
            id="exigir-condutores"
            rotulo="Exigir leitor e explanador"
            descricao="Vale para novas sessões; registros históricos continuam opcionais."
            checked={config.exigir_leitor_explanador}
            onCheckedChange={v => atualizar('exigir_leitor_explanador', v)}
          />
        </BlocoFormulario>

        <BlocoFormulario titulo="Relatórios">
          <Campo rotulo="Assinatura do relatório" htmlFor="assinatura" ajuda="Aparece no fim do relatório impresso.">
            <Input
              id="assinatura"
              className="h-10"
              placeholder="Nome · cargo"
              value={config.assinatura_relatorio ?? ''}
              onChange={e => atualizar('assinatura_relatorio', e.target.value)}
            />
          </Campo>
          <LinhaInterruptor
            id="resumo-mensal"
            rotulo="Resumo mensal por e-mail"
            descricao="Preferência guardada; o envio automático ainda não está ativo."
            checked={config.resumo_mensal_email}
            onCheckedChange={v => atualizar('resumo_mensal_email', v)}
          />
        </BlocoFormulario>

        <Secao titulo="Dados do seu núcleo" className="mt-0">
          <ListaCard>
            {EXPORTACOES.map(e => (
              <ItemLista
                key={e.tabela}
                onClick={() => exportar(e.tabela, e.rotulo)}
                inicio={<IconeLinha>{exportando === e.tabela ? <Loader2 className="animate-spin" /> : <Download />}</IconeLinha>}
                titulo={`Exportar ${e.rotulo.toLowerCase()}`}
                subtitulo={`CSV de ${meuNucleo?.nome ?? 'seu núcleo'}`}
              />
            ))}
          </ListaCard>
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            O Supabase mantém backups automáticos do banco; a restauração é feita pelo painel do Supabase.
          </p>
        </Secao>

        <div className="md:hidden">{botaoSalvar}</div>
      </div>
    </div>
  )
}
