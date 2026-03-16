# Plano: Sessão Histórica (Registro de Memória)

## Overview

O centro precisa registrar sessões que aconteceram **antes** do início do uso do app. Essas sessões são puramente para memória institucional — não há controle de estoque de vegetal, não há quantidade de participantes. São registros simples de "essa sessão aconteceu".

## Tipo de Projeto

**WEB** → `frontend-specialist` + `backend-specialist`

## Contexto Atual

A tabela `sessoes` já existe no Supabase com os campos:
- `id`, `data_realizacao`, `tipo`, `dirigente`, `explanador`, `leitor_documentos`, `quantidade_participantes`, `user_id`
- Ligada à tabela `consumos_sessao` (1:N) pelo campo `id_sessao`

A feature atual de "Nova Sessão" **exige** o vínculo com pelo menos um preparo de vegetal.

## O que É Diferente na Sessão Histórica

| Campo | Sessão Normal | Sessão Histórica |
|---|---|---|
| Data | ✅ Obrigatório | ✅ Obrigatório |
| Tipo | ✅ Obrigatório | ✅ Obrigatório |
| Dirigente | ✅ Obrigatório | ✅ Obrigatório |
| Explanação | Opcional | Opcional |
| Leitor | Opcional | Opcional |
| Participantes (qtd) | ✅ Informado | ❌ **Não informado** |
| Vegetal (preparo/qtd) | ✅ Obrigatório | ❌ **Não existe** |

## Critérios de Sucesso

- [ ] O usuário consegue registrar uma sessão histórica preenchendo apenas: data, tipo, dirigente (+ opcionals: explanador, leitor)
- [ ] Nenhum campo de preparo/vegetal aparece no formulário
- [ ] Nenhuma entrada na tabela `consumos_sessao` é criada por esse fluxo
- [ ] A sessão histórica aparece na lista `/sessoes` como uma sessão normal
- [ ] No modal de detalhes, sessões históricas mostram "Sessão histórica — sem registro de vegetal" no lugar da seção de consumo
- [ ] A sessão histórica aparece na home (`page.tsx`) no histórico de movimentações mas com indicação especial (ex: "0 L — Sessão Histórica")
- [ ] O botão de acesso está disponível na home (Ação rápida) e/ou na tela de sessões

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + TailwindCSS (existente)
- **Backend**: Supabase (sem migração de schema — usa a tabela `sessoes` existente)
- **Sem nova migração de BD**: a tabela atual comporta a sessão histórica (`quantidade_participantes` já aceita NULL, `consumos_sessao` simplesmente não recebe registros)

## Estrutura de Arquivos

```
app/
  nova-sessao-historica/
    page.tsx          [NEW] Formulário simplificado de sessão histórica
```

## Tarefa Breakdown

### T1 — Criar página de formulário `nova-sessao-historica`
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`, `react-best-practices`
- **INPUT**: Estrutura do formulário de `nova-sessao/page.tsx` como referência
- **OUTPUT**: `app/nova-sessao-historica/page.tsx` — formulário com: data, hora (padrão 20:00), tipo, dirigente, explanador (opcional), leitor (opcional). **Sem** campo de participantes e **sem** bloco de vegetal.
- **VERIFY**: Página acessível em `/nova-sessao-historica`. Formulário salva na tabela `sessoes` sem criar registros em `consumos_sessao`. Campo `quantidade_participantes` enviado como `0` (coluna é NOT NULL).

### T2 — Adicionar acesso ao formulário
- **Agent**: `frontend-specialist`
- **INPUT**: `app/page.tsx` (home) e `app/sessoes/page.tsx` (listagem)
- **OUTPUT**: Adicionar botão "Sessão Histórica" na seção de ações da home (botão secundário, abaixo de "Nova Sessão") e/ou um botão flutuante/link na tela de sessões.
- **VERIFY**: Botão visível na home redireciona para `/nova-sessao-historica`.

### T3 — Ajustar exibição no modal de detalhes da sessão (sessoes e home)
- **Agent**: `frontend-specialist`
- **INPUT**: Modal de detalhes em `app/sessoes/page.tsx` e `app/page.tsx`
- **OUTPUT**: Quando uma sessão não tem consumos na `consumos_sessao` **e** `quantidade_participantes` é NULL, exibir badge/texto "📜 Sessão Histórica" em vez da seção "O que foi servido".
- **VERIFY**: Ao criar uma sessão histórica e abrir o modal, a seção de vegetal não aparece; em vez disso aparece o texto de sessão histórica.

### T4 — Ajustar exibição na lista de movimentações da home
- **Agent**: `frontend-specialist`
- **INPUT**: `app/page.tsx` — lógica de montagem de `ultimasMovimentacoes`
- **OUTPUT**: Sessões sem consumo (`totalConsumidoNaSessao === 0`) com `quantidade_participantes === null` devem aparecer na lista com `tipo_movimento: 'historico'` e exibir um ícone/cor diferente (ex: ícone `BookMarked`, cor âmbar). Sessões normais sem consumo (ex: sessões antigas) devem continuar sem aparecer (como hoje).
- **VERIFY**: Após criar uma sessão histórica, ela aparece na home no histórico recente com visual diferenciado, sem mostrar "- 0,00 L".

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| `quantidade_participantes` NOT NULL no Supabase | Erro ao salvar | ✅ **Resolvido**: enviar `0` fixo no insert — coluna é NOT NULL, confirmado pelo usuário. |
| Sessões sem consumo aparecerem na home de forma errada | UI quebrada | Lógica de filtro já existente na home — só aparece se `totalConsumidoNaSessao > 0`. Alterar para incluir históricas de forma explícita. |

## Verificação Final

### Automated
```bash
npm run build
npm run lint
npx tsc --noEmit
```

### Manual
1. Acessar `/nova-sessao-historica`
2. Preencher: data passada, tipo "Escala", dirigente "M. Teste"
3. Salvar → deve redirecionar para home sem erros
4. Verificar que a sessão aparece em `/sessoes` na lista
5. Clicar na sessão → modal deve mostrar badge "Sessão Histórica" sem seção de vegetal
6. Verificar na home → sessão aparece no histórico recente com ícone diferenciado
7. Verificar que o estoque **não mudou** (nenhum consumo foi registrado)
