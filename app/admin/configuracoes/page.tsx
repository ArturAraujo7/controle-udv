'use client'
import { useEffect, useState } from 'react'
import { Database, Download, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { ExigirAdmin } from '@/components/admin/ExigirAdmin'
import { ArquivoAnexo } from '@/components/comum/ArquivoAnexo'
import { IconeLinha, ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { BlocoFormulario, Campo, InputUnidade, LinhaInterruptor } from '@/components/formularios/Campos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CONFIGURACOES_PADRAO, useConfiguracoes } from '@/hooks/useConfiguracoes'
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
  const { recarregar } = useConfiguracoes()
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [indisponivel, setIndisponivel] = useState(false)
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [novoLogo, setNovoLogo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [exportando, setExportando] = useState<string | null>(null)
  const [estoqueMinimo, setEstoqueMinimo] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle(),
      supabase.from('listas_sistema').select('lista'),
    ]).then(([c, l]) => {
      if (!ativo) return
      if (c.error || !c.data) {
        setIndisponivel(true)
        return
      }
      const carregada: Configuracoes = { ...CONFIGURACOES_PADRAO, ...c.data, estoque_minimo_litros: Number(c.data.estoque_minimo_litros) }
      setConfig(carregada)
      setEstoqueMinimo(String(carregada.estoque_minimo_litros))
      const cont: Record<string, number> = {}
      for (const item of (l.data ?? []) as { lista: string }[]) cont[item.lista] = (cont[item.lista] ?? 0) + 1
      setContagens(cont)
    })
    return () => { ativo = false }
  }, [])

  const atualizar = <K extends keyof Configuracoes>(campo: K, valor: Configuracoes[K]) =>
    setConfig(c => (c ? { ...c, [campo]: valor } : c))

  const salvar = async () => {
    if (!config) return
    if (!config.nucleo_nome.trim()) {
      toast.error('Informe o nome do núcleo')
      return
    }
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
        nucleo_nome: config.nucleo_nome.trim(),
        nucleo_regiao: config.nucleo_regiao?.trim() || null,
        nucleo_cidade: config.nucleo_cidade?.trim() || null,
        logo_arquivo: logo,
        estoque_minimo_litros: lerNumero(estoqueMinimo),
        dias_lote_parado: Math.max(1, Math.round(config.dias_lote_parado)),
        somar_maturacao_no_saldo: config.somar_maturacao_no_saldo,
        calendario_padrao: config.calendario_padrao?.trim() || null,
        exigir_leitor_explanador: config.exigir_leitor_explanador,
        assinatura_relatorio: config.assinatura_relatorio?.trim() || null,
        resumo_mensal_email: config.resumo_mensal_email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setSalvando(false)
    if (error) {
      toast.error('Erro ao salvar as configurações', { description: error.message })
      return
    }
    if (novoLogo && config.logo_arquivo) await removerArquivo(config.logo_arquivo)
    atualizar('logo_arquivo', logo)
    setNovoLogo(null)
    await recarregar()
    toast.success('Configurações salvas')
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

  if (indisponivel) {
    return (
      <>
        <Cabecalho titulo="Configurações do núcleo" />
        <Vazio icone={<Database />}>
          As configurações ainda não estão disponíveis. Aplique as migrations de 13/09/2026 no Supabase.
        </Vazio>
      </>
    )
  }

  if (!config) {
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
        titulo="Configurações do núcleo"
        descricao="Visível só para administradores."
        acoes={<div className="hidden md:block">{botaoSalvar}</div>}
      />

      <div className="space-y-5">
        <BlocoFormulario titulo="Núcleo">
          <Campo rotulo="Nome do núcleo" htmlFor="nucleo-nome" obrigatorio>
            <Input id="nucleo-nome" className="h-10" value={config.nucleo_nome} onChange={e => atualizar('nucleo_nome', e.target.value)} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Região" htmlFor="nucleo-regiao">
              <Input id="nucleo-regiao" className="h-10" value={config.nucleo_regiao ?? ''} onChange={e => atualizar('nucleo_regiao', e.target.value)} />
            </Campo>
            <Campo rotulo="Cidade / UF" htmlFor="nucleo-cidade">
              <Input id="nucleo-cidade" className="h-10" value={config.nucleo_cidade ?? ''} onChange={e => atualizar('nucleo_cidade', e.target.value)} />
            </Campo>
          </div>
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
              <InputUnidade id="estoque-minimo" value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value)} />
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

        <Secao titulo="Listas do sistema" acao="editáveis" className="mt-0">
          <ListaCard>
            {LISTAS_SISTEMA.map(l => (
              <ItemLista
                key={l.lista}
                href={`/admin/configuracoes/listas/${l.lista}`}
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

        <Secao titulo="Dados" className="mt-0">
          <ListaCard>
            {EXPORTACOES.map(e => (
              <ItemLista
                key={e.tabela}
                onClick={() => exportar(e.tabela, e.rotulo)}
                inicio={<IconeLinha>{exportando === e.tabela ? <Loader2 className="animate-spin" /> : <Download />}</IconeLinha>}
                titulo={`Exportar ${e.rotulo.toLowerCase()}`}
                subtitulo="Arquivo CSV com todos os registros"
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
