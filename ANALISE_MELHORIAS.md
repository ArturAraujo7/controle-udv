# Análise e Plano de Melhorias — Guardião (Controle UDV)

> Análise completa do sistema de gestão de estoque, produção e consumo do chá hoasca e registro de sessões do Núcleo Jardim Real.
> Data da análise: 06/07/2026 · Base: branch `main` (commit `d279b28`)

---

## Sumário

1. [Visão geral do sistema](#1-visão-geral-do-sistema)
2. [Pontos fortes (o que já está bom)](#2-pontos-fortes)
3. [Melhorias visuais e de UX](#3-melhorias-visuais-e-de-ux)
4. [Melhorias técnicas](#4-melhorias-técnicas)
5. [Melhorias estruturais e funcionalidades novas](#5-melhorias-estruturais-e-funcionalidades-novas)
6. [Roadmap sugerido em 4 fases](#6-roadmap-sugerido-em-4-fases)

---

## 1. Visão geral do sistema

### Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.1.6 (App Router) + React 19.2.3 + React Compiler |
| Linguagem | TypeScript 5 (strict mode) |
| Estilo | Tailwind CSS 4, next-themes (dark mode), Lucide (ícones) |
| Backend | Supabase (PostgreSQL + Auth + RLS), sem ORM |
| Gráficos | Recharts 3.8 |
| IA | Google Gemini (widget de chat com streaming) |
| Impressão | react-to-print |
| Testes | Jest + Testing Library (cobertura mínima: 1 arquivo, 2 testes) |

### Dimensão do projeto

- **19 rotas**: dashboard, login, estoque (+detalhe), sessões, nova/editar sessão, sessão histórica, preparo, saída, membros, perfil, relatórios, atividades, admin (usuários e auditoria).
- **~7.100 linhas** de TypeScript/TSX em 35 arquivos.
- **10 tabelas** no banco: `sessoes`, `preparos`, `consumos_sessao`, `saidas`, `membros`, `profiles`, `activity_logs`, e três órfãs (`visitantes`, `leituras`, `historias`).
- **RLS habilitado em todas as tabelas** com 4 papéis: `admin`, `representante`, `assistente` (editores) e `mestre` (leitura).

### Modelo de negócio (como funciona hoje)

```
Estoque atual = Σ preparos.quantidade_preparada
              − Σ consumos_sessao.quantidade_consumida
              − Σ saidas.quantidade
```

- Uma sessão pode consumir de **múltiplos preparos** (via `consumos_sessao`).
- Preparos têm dois tipos: **Produção Local** e **Doação Recebida** (com núcleo de origem).
- Sessões históricas (memória institucional) são marcadas com `quantidade_participantes = 0`.
- Migração **texto → chave estrangeira** em andamento: campos legados (`dirigente`, `mestre_preparo` como texto) coexistem com os novos FKs (`dirigente_id`, `mestre_preparo_id`), com ferramenta de backfill em `/admin/auditoria`.

---

## 2. Pontos fortes

Vale registrar o que já está bem resolvido — a base é sólida:

- ✅ **Identidade visual coesa**: paleta dourado + celestial consistente, gradientes bem aplicados nas ações primárias, dark mode completo via next-themes.
- ✅ **Segurança server-side real**: RLS em todas as tabelas com funções `is_admin()` / `can_edit()` no banco — as checagens de papel no frontend são apenas defesa em profundidade, como deve ser.
- ✅ **Trilha de auditoria**: triggers gravando INSERT/UPDATE/DELETE com estado antes/depois (JSONB) em `activity_logs` nas 4 tabelas críticas.
- ✅ **Rota de IA respeita RLS**: [app/api/ia/chat/route.ts](app/api/ia/chat/route.ts) injeta o token do usuário no client Supabase em vez de usar service key.
- ✅ **Relatórios com impressão** e diretivas `print:` bem usadas em [app/relatorios/page.tsx](app/relatorios/page.tsx).
- ✅ **Sessões multi-preparo** modeladas corretamente via tabela de junção `consumos_sessao`.
- ✅ **Fetching paralelo** com `Promise.all` e tratamento do limite de 1000 itens do Supabase em [hooks/useDashboardDados.ts:103-112](hooks/useDashboardDados.ts).
- ✅ **PWA** com manifest e viewport configurados.

---

## 3. Melhorias visuais e de UX

### 3.1 🔴 Crítico — Substituir `alert()` e `confirm()` por toasts e modais

O maior fator que faz o app parecer "não profissional" hoje. Há **41 chamadas a `alert()`** e **5 a `confirm()`** espalhadas por praticamente todas as páginas — erros, sucessos e confirmações de exclusão aparecem como pop-up nativo do navegador, que bloqueia a tela e destoa completamente do visual dourado/celestial do app.

**Solução sugerida:**
- Adicionar a lib [`sonner`](https://sonner.emilkowal.ski/) (toast leve, com dark mode) ou criar um componente próprio de toast com o tema do app.
- Criar um componente `<ConfirmDialog>` reutilizável (o app já tem o padrão de modal com `animate-in zoom-in-95` no dashboard — basta extrair e generalizar).
- Padrão: sucesso → toast verde discreto; erro → toast vermelho com mensagem acionável; exclusão → modal com botão destrutivo destacado.

### 3.2 🔴 Validação de formulários em tempo real

Hoje **não existe validação em nível de campo** — o usuário só descobre o erro num `alert()` após o submit ([app/nova-sessao/page.tsx](app/nova-sessao/page.tsx), [app/novo-preparo/page.tsx](app/novo-preparo/page.tsx), etc.).

**Solução sugerida:**
- Adotar **Zod** para schemas de validação (reutilizáveis também no server — ver seção 4.4).
- Mensagens de erro inline abaixo do campo, borda vermelha no campo inválido.
- Marcar campos obrigatórios com `*`.
- Validações de domínio: quantidade > 0, data não futura (para preparos/consumos), consumo ≤ saldo do preparo selecionado.

### 3.3 🟡 Skeleton loaders e estados de carregamento

- Dashboard mostra `"..."` como placeholder de valores e `"Carregando..."` como texto centralizado.
- Estoque mostra `"Calculando..."`.

**Solução:** componente `<Skeleton>` simples (div com `animate-pulse` + `bg-gray-200 dark:bg-gray-800` — 5 linhas de Tailwind) aplicado nos cards do dashboard, lista de estoque e lista de sessões. Efeito imediato de "app bem feito".

### 3.4 🟡 Unificar o design system dos inputs e espaçamentos

Inconsistências mapeadas:

| Problema | Exemplos |
|---|---|
| 3+ estilos de input | `bg-transparent` + `border-b` em alguns campos do preparo; `bg-white border` em outros; `bg-gray-50` em outros |
| Border-radius misturado | `rounded-lg`, `rounded-xl`, `rounded-2xl` sem critério |
| Padding inconsistente | seções com `p-4` e outras com `p-6` |

**Solução:** criar componentes base em `components/ui/` — `<Input>`, `<Select>`, `<Textarea>`, `<Button>`, `<Card>` — com o estilo do tema, e migrar as páginas gradualmente. Não precisa de shadcn/ui inteiro; 5-6 componentes próprios resolvem e mantêm a identidade visual.

### 3.5 🟡 Acessibilidade (WCAG básico)

Estado atual: **nenhum** `aria-label`, HTML não semântico (divs clicáveis em vez de `<button>`, sem `<nav>`/`<main>`), modais sem focus trap nem fechamento por Esc.

**Prioridades (nesta ordem):**
1. `aria-label` em todos os botões que só têm ícone (header: tema, sino, perfil, logout; lápis de edição nos cards).
2. Trocar divs clicáveis por `<button>`/`<a>` reais (ganha navegação por teclado de graça).
3. Focus trap + Esc nos modais (dashboard, sessões, membros).
4. Conferir contraste do texto dourado sobre fundo claro (gold-400/500 sobre branco provavelmente falha WCAG AA — usar gold-600+ para texto).

### 3.6 🟢 Navegação e descoberta

- **Sem menu de navegação** — só o header com ícones e os cards do dashboard. Para ir de Estoque a Sessões é preciso voltar à home.
- **Sem breadcrumbs** em páginas profundas (`/estoque/[id]`, `/editar-sessao/[id]`).

**Solução:** uma barra de navegação fina abaixo do header (ou menu hambúrguer no mobile) com as 4-5 áreas principais: Início · Estoque · Sessões · Membros · Relatórios. Breadcrumb simples nas páginas de detalhe/edição.

### 3.7 🟢 Refinamentos menores

- **Estados vazios com propósito**: em vez de "Nenhuma movimentação registrada." num box tracejado, adicionar ícone + botão de ação ("Registrar primeiro preparo").
- **Tooltips/help text** em campos de domínio específico (`grau` do preparo, `tipo de delegação`).
- **Filtros e ordenação** nas listas: sessões por tipo/dirigente/período, estoque por status/grau (hoje só há busca textual).
- **Feedback otimista** nas ações rápidas (marcar membro inativo, por exemplo).

---

## 4. Melhorias técnicas

### 4.1 🔴 Integridade do estoque no banco de dados

**Este é o risco mais sério do sistema.** Todo o cálculo de saldo é feito no cliente ([hooks/useDashboardDados.ts:120-125](hooks/useDashboardDados.ts), [app/estoque/page.tsx](app/estoque/page.tsx)). O dropdown de preparos filtra por saldo > 0, mas **no momento do save não há revalidação** — dois usuários editando ao mesmo tempo, ou uma edição de sessão antiga, podem deixar o estoque negativo silenciosamente.

**Solução sugerida (migração SQL):**

```sql
-- View com o saldo calculado no banco
create or replace view saldo_preparos as
select p.id,
       p.quantidade_preparada
         - coalesce((select sum(c.quantidade_consumida) from consumos_sessao c where c.id_preparo = p.id), 0)
         - coalesce((select sum(s.quantidade) from saidas s where s.preparo_id = p.id), 0)
       as saldo
from preparos p;

-- Trigger que impede consumo/saída maior que o saldo disponível
create or replace function check_saldo_preparo() returns trigger as $$
begin
  if (select saldo from saldo_preparos where id = new.id_preparo) < 0 then
    raise exception 'Saldo insuficiente no preparo %', new.id_preparo;
  end if;
  return new;
end;
$$ language plpgsql;
```

Benefícios em cascata: o frontend passa a **ler o saldo pronto da view** (elimina o fetch de todas as linhas de `consumos_sessao` e `saidas` só para somar), e o banco garante que o estoque nunca fica negativo, não importa quantos usuários editem ao mesmo tempo.

### 4.2 🔴 Camada de acesso a dados

Hoje cada página escreve suas próprias chamadas `supabase.from(...)` — são dezenas de queries duplicadas, cada uma com seu próprio tratamento de erro (ou nenhum).

**Solução sugerida:**
- Criar `lib/queries/` com módulos por domínio: `sessoes.ts`, `preparos.ts`, `estoque.ts`, `membros.ts`. Cada função encapsula a query, o tratamento de erro e a tipagem.
- Considerar **TanStack Query** para cache, revalidação e estados de loading/erro padronizados — combina bem com o padrão client-side atual e elimina dezenas de `useState`/`useEffect` manuais (são 137+ instâncias hoje).
- Gerar os tipos do banco com `supabase gen types typescript` em vez de manter interfaces manuais (elimina os 12 usos de `any`/`unknown` e desvios entre schema e código — ex.: o hook usa `tipo_origem` e `observacao` enquanto outras partes usam `tipo` e `observacoes`).

### 4.3 🟡 Refatorar as páginas gigantes e eliminar duplicação

| Arquivo | Linhas | Problema |
|---|---|---|
| [app/page.tsx](app/page.tsx) | 561 | Dashboard: fetching + UI + 2 modais + timeline num componente só |
| [app/editar-sessao/[id]/page.tsx](app/editar-sessao/[id]/page.tsx) | 481 | Quase idêntico a nova-sessao |
| [app/membros/page.tsx](app/membros/page.tsx) | 424 | CRUD + busca + modal num arquivo |
| [app/nova-sessao/page.tsx](app/nova-sessao/page.tsx) | 394 | Lógica de consumos duplicada com editar-sessao |
| [SeletorMembro.tsx](app/components/SeletorMembro.tsx) + [SeletorMultiploMembro.tsx](app/components/SeletorMultiploMembro.tsx) | 261 + 270 | ~80% de código compartilhado |

**Refatorações de maior retorno:**
1. **Um único `<FormularioSessao>`** usado por nova-sessao, editar-sessao, nova-sessao-historica e editar-sessao-historica (4 páginas com o mesmo formulário hoje).
2. **Unificar os seletores de membro** num componente com prop `multiple`.
3. Extrair os modais do dashboard (`<ModalDetalheSessao>`) — ele já é duplicado na página de sessões.

### 4.4 🟡 Constantes de domínio centralizadas + enums no banco

Os 10 tipos de sessão estão hardcoded em **4 arquivos** (`nova-sessao`, `editar-sessao`, `nova-sessao-historica`, `editar-sessao-historica`); os graus de membro em `membros/page.tsx`; o `grau` do preparo é TEXT livre no banco (typos criam valores inconsistentes que quebram filtros de relatório).

**Solução:**
- Criar `lib/constants.ts` com `TIPOS_SESSAO`, `GRAUS_MEMBRO`, `GRAUS_PREPARO`, `TIPOS_DELEGACAO` — fonte única para todos os formulários e relatórios.
- Adicionar CHECK constraints (ou enums Postgres) correspondentes no banco, como já existe para `preparos.status`.

### 4.5 🟡 Concluir a migração texto → chave estrangeira

O modelo híbrido atual é frágil:

- [editar-sessao/[id]/page.tsx:129-136](app/editar-sessao/[id]/page.tsx) reconstrói os nomes dos dirigentes fazendo `sessao.dirigente.split(' / ')` — se o formato do texto legado variar, o nome errado é associado ao ID.
- Não há validação de que o nome parseado corresponde ao membro do FK.

**Plano de conclusão:**
1. Rodar o backfill completo pela ferramenta de `/admin/auditoria` até zerar registros com FK nulo.
2. Passar a exibir sempre o nome via join com `membros` (nunca mais parsear o texto).
3. Marcar os campos texto legados como deprecados e, após um período de segurança, removê-los.

### 4.6 🟡 Datas e timezone

- [nova-sessao/page.tsx:121](app/nova-sessao/page.tsx): `` `${formData.data_realizacao}T${formData.hora}:00` `` — string sem timezone gravada em coluna `timestamptz`. O Postgres interpreta como UTC ou timezone do servidor, o que pode deslocar sessões noturnas para o dia seguinte/anterior dependendo de onde o código roda.
- Splits manuais de string de data espalhados pelas páginas de edição.

**Solução:** util central `lib/datas.ts` com `paraTimestampLocal(data, hora)` (anexando o offset de Brasília ou usando `date-fns-tz`) e `formatarData`/`formatarHora` — todas as páginas usam só esses helpers.

### 4.7 🟡 Performance dos relatórios

`useDashboardDados` busca **todas as linhas** de `preparos`, `consumos_sessao` e `saidas` (queries globais nas linhas [90-92](hooks/useDashboardDados.ts)) só para somar três números no cliente. Funciona hoje, mas degrada linearmente com o crescimento dos dados.

**Solução (em ordem de esforço):**
1. Trocar as 3 queries globais por **uma chamada RPC** que retorna o estoque já agregado (ou ler da view `saldo_preparos` da seção 4.1).
2. Mover as agregações de relatório (totais, médias, per capita) para funções SQL/RPC com o filtro de período.
3. Paginação nas listas de sessões e movimentações quando passarem de ~100 itens.

### 4.8 🟡 Segurança

- **`activity_logs` com `GRANT ALL` para `authenticated`** ([migração:26](supabase/migrations/20260405000000_create_activity_logs.sql)) — qualquer usuário autenticado pode ler *e escrever/apagar* a trilha de auditoria, o que anula seu propósito. Corrigir para: INSERT apenas via trigger (definer), SELECT apenas para `admin`, sem UPDATE/DELETE para ninguém.
- **`GEMINI_API_KEY`**: está correta (server-only, sem prefixo `NEXT_PUBLIC_`), manter assim; garantir que `.env.local` nunca entre no git (já está no `.gitignore` — ok).
- **Validação server-side**: com RLS os dados estão protegidos por papel, mas não por conteúdo — qualquer editor pode gravar quantidade negativa ou data absurda. Os triggers da seção 4.1 + CHECK constraints (`quantidade > 0`) fecham isso.
- **Error boundaries**: adicionar `app/error.tsx` e `app/global-error.tsx` para falhas não capturadas não renderizarem tela branca.

### 4.9 🟢 Testes

Cobertura atual: 1 arquivo com 2 testes triviais. Prioridade de testes (maior valor por esforço):

1. **Cálculo de saldo** (função pura extraída para `lib/estoque.ts`): entradas − consumos − saídas, casos de borda (preparo sem consumo, saldo zero).
2. **Agregações de relatório**: totais por período, per capita, sessões por mês.
3. **Validações Zod** dos formulários (quando existirem — seção 3.2).
4. Smoke test das páginas principais com Testing Library.

### 4.10 🟢 Limpeza de código

- **Remover/arquivar as tabelas órfãs** `visitantes`, `leituras` e `historias` — existem no schema, têm FKs e RLS, mas nenhuma tela cria registros nelas. Como ficou decidido que presença individual não será necessária, elas são peso morto: uma migração `drop table` (com backup antes) simplifica o schema e a manutenção das policies. Se preferir cautela, renomear para `_deprecated_*` por um ciclo antes de dropar.
- Padronizar nomes de campos divergentes entre código e banco (`observacao` vs `observacoes`, `tipo` vs `tipo_origem`).

---

## 5. Melhorias estruturais e funcionalidades novas

### 5.1 🏛️ Preparação para múltiplos núcleos (multi-tenancy)

Como há intenção de servir outros núcleos no futuro, vale **preparar o terreno agora** — retrofit de multi-tenancy depois é uma das migrações mais dolorosas que existem.

**Desenho sugerido (incremental, sem quebrar nada):**

1. **Tabela `nucleos`**: `id`, `nome`, `sigla`, `regiao`, `ativo`.
2. **Coluna `nucleo_id`** (FK, NOT NULL com default do Jardim Real) em: `sessoes`, `preparos`, `saidas`, `membros`, `consumos_sessao` (herdada da sessão) e `profiles` (núcleo do usuário).
3. **RLS por núcleo**: policies passam de "todo autenticado lê tudo" para "lê registros do próprio núcleo" (com papel `admin_geral` que enxerga todos). As funções `is_admin()`/`can_edit()` ganham a dimensão do núcleo.
4. **Frontend**: enquanto houver um núcleo só, nada muda visualmente; quando entrar o segundo, adiciona-se seletor de núcleo no header e o `nucleo_id` do perfil filtra tudo automaticamente via RLS.

O passo 1+2 pode ser feito já (baixo risco); os passos 3+4 só quando o segundo núcleo for real.

### 5.2 📤 Exportação CSV / PDF

O print existe e é bom, mas relatórios institucionais pedem arquivo:

- **CSV**: geração client-side trivial (montar string e `Blob` + download) para sessões do período, movimentações e estoque.
- **PDF**: usar o print CSS já existente com `window.print()` para "Salvar como PDF" já cobre 90%; se quiser PDF programático com cabeçalho institucional, `react-pdf` ou endpoint com `puppeteer` ficam para depois.

### 5.3 🔔 Alerta de estoque baixo

Com a view `saldo_preparos` (4.1), fica barato:

- Limite configurável (ex.: 10 L) numa tabela `configuracoes` simples.
- Banner âmbar no dashboard quando `estoque_total < limite`: *"Estoque abaixo de X litros — considere agendar um preparo."*
- Destaque visual nos preparos próximos do esgotamento na página de estoque (a barra de progresso já existe, basta colorir por faixa).

### 5.4 📋 Painel de auditoria completo

Os JSONB `dados_antigos`/`dados_novos` já são gravados em `activity_logs` mas **nunca são exibidos**. Evoluir `/admin/auditoria` (ou `/atividades`) para mostrar diff legível de cada alteração ("Mestre X alterou a quantidade do preparo de 12 L → 15 L em 05/07"). Isso transforma dados que já existem em prestação de contas real — valor institucional alto para custo baixo.

### 5.5 🫖 Ciclo de maturação do preparo

O status `Em Maturação` existe no CHECK constraint mas não tem workflow: adicionar `data_prevista_liberacao` ao preparo e mostrar no estoque um badge "Em maturação até DD/MM" — o preparo só aparece no dropdown de consumo quando liberado.

### 5.6 📅 Sugestões de menor prioridade

- Calendário anual de sessões (visão de grade com as sessões de escala).
- Busca global no header (sessão, preparo ou membro por nome/data).
- Dashboard com comparativo ano a ano (consumo médio, participação média).
- Backup automatizado agendado do banco (Supabase já faz, mas vale documentar o processo de restore).

---

## 6. Roadmap sugerido em 4 fases

Cada fase é independente e entrega valor visível ao fim. Estimativas assumem trabalho incremental.

### Fase 1 — Fundamentos de qualidade percebida *(rápida, alto impacto visual)*

| # | Item | Ref |
|---|---|---|
| 1 | Toasts (sonner) substituindo os 41 `alert()` | §3.1 |
| 2 | `<ConfirmDialog>` substituindo os 5 `confirm()` | §3.1 |
| 3 | Skeleton loaders no dashboard, estoque e sessões | §3.3 |
| 4 | `lib/constants.ts` com tipos de sessão, graus e delegações | §4.4 |
| 5 | Corrigir policy de `activity_logs` (SELECT só admin, sem GRANT ALL) | §4.8 |
| 6 | `app/error.tsx` (error boundary global) | §4.8 |

### Fase 2 — Robustez do domínio *(o coração do sistema confiável)*

| # | Item | Ref |
|---|---|---|
| 1 | View `saldo_preparos` + trigger de saldo no banco | §4.1 |
| 2 | Validação Zod nos formulários com erro inline | §3.2 |
| 3 | CHECK constraints de quantidade > 0 e enums de grau | §4.4 |
| 4 | Util central de datas com timezone correto | §4.6 |
| 5 | Concluir backfill texto→FK e eliminar parsing de `' / '` | §4.5 |
| 6 | Testes de cálculo de saldo e agregações | §4.9 |

### Fase 3 — Refino e completude *(elegância e produtividade)*

| # | Item | Ref |
|---|---|---|
| 1 | Componentes base `components/ui/` (Input, Button, Card…) e unificação visual | §3.4 |
| 2 | `<FormularioSessao>` único para as 4 páginas de sessão | §4.3 |
| 3 | Unificar seletores de membro | §4.3 |
| 4 | Navegação (menu + breadcrumbs) e acessibilidade básica | §3.5, §3.6 |
| 5 | Exportação CSV + filtros/ordenação nas listas | §5.2, §3.7 |
| 6 | Alerta de estoque baixo | §5.3 |
| 7 | Painel de auditoria com diff antes/depois | §5.4 |

### Fase 4 — Escala e futuro *(quando o crescimento chegar)*

| # | Item | Ref |
|---|---|---|
| 1 | Tabela `nucleos` + coluna `nucleo_id` (preparação multi-núcleo) | §5.1 |
| 2 | RLS por núcleo + seletor no frontend (quando houver 2º núcleo) | §5.1 |
| 3 | Camada de dados `lib/queries/` + TanStack Query + tipos gerados | §4.2 |
| 4 | Agregações no banco (RPC) e paginação | §4.7 |
| 5 | Drop das tabelas órfãs (`visitantes`, `leituras`, `historias`) | §4.10 |
| 6 | Ciclo de maturação do preparo | §5.5 |

---

## Conclusão

O Guardião tem **fundação técnica acima da média** para um sistema desse porte: RLS bem configurado, auditoria com triggers, identidade visual própria e o modelo de domínio correto (multi-preparo por sessão, tipos de entrada, memória histórica). O que o separa de um sistema "sério e completo" são três frentes bem definidas:

1. **Percepção** — os `alert()` nativos, a ausência de validação inline e os loadings em texto puro contradizem o cuidado visual do resto do app (Fase 1 resolve).
2. **Confiabilidade** — o saldo do estoque, que é o dado mais importante do sistema, hoje não tem nenhuma garantia no banco (Fase 2 resolve).
3. **Sustentabilidade** — páginas de 400-560 linhas com lógica duplicada e constantes espalhadas encarecem cada evolução futura (Fases 3-4 resolvem).

Seguindo o roadmap na ordem proposta, cada fase deixa o sistema visivelmente melhor sem nunca quebrá-lo no meio do caminho.
