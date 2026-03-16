# Plano: Rebranding "Guardião"

## Overview
O usuário solicitou uma mudança completa de identidade visual do aplicativo. O novo nome é **Guardião**, evocando o papel de zelar pela memória, pelo vegetal e pela organização do centro.

As novas cores principais estabelecidas são:
- **Dourado (Gold/Amber)**: Representando a luz, a nobreza e o Sol.
- **Azul Celeste (Sky/Light Blue)**: Representando a clareza, a altura e a pureza.
- **Branco**: Fundo e limpeza do modo claro.
- **Preto/Dark**: Fundo e elegância do modo escuro.

Também inclui a criação de um logotipo (avatar em SVG) que represente esse conceito de forma moderna e limpa.

## Projeto
**WEB** → `frontend-specialist`, focando completamente em Tailwind, UI/UX e componentes.

## Escopo das Mudanças

### T1: Configuração do Design System (Cores)
- **O que faremos**: O `tailwind.config.ts` hoje não tem extensões de cor customizadas além do `background` default. Vamos injetar as variáveis nominais para `dourado` e `celestial`.
- **Cores Customizadas**:
  - `gold`: Escala do dourado forte, do `gold-400` (amarelo brilhante) ao `gold-600` (dourado intenso).
  - `celestial`: Escala do azul do `celestial-400` ao `celestial-600`.
  - Fundos (*background/foreground*): Ajustaremos no `globals.css` para que o modo claro seja essencialmente um branco *off-white*, e o modo escuro seja um `black` ou `#0a0a0a` muito profundo.

### T2: Criação do Avatar SVG "Guardião"
- **O que faremos**: Criar um componente `<Logo />` em React puro (SVG).
- **Design do Logo**: Um emblema geométrico moderno misturando a silhueta sutil de um escudo protetor e/ou o sol/luz (dourado) com recortes em azul celeste. Um SVG vetorial, responsivo, que fica bem no header da aplicação e no modo Light/Dark.

### T3: Refatoração de UI (Substituindo cores genéricas)
- **O que faremos**: Atualmente o app usa o verde (`green-600`) para ações principais e estoques. E usa azul (`blue-600`) para relatórios/sessões. 
- **Nova Mapeação**:
  - **Dourado** passa a ser a **Cor Primária** (Botões principais, destaques, Ícone do Guardião).
  - **Celeste** passa a ser a **Cor Secundária** (Acentos, botões de ação secundária, links, inputs focados).
  - Remover estilos padrão sem graça e substituir pela nova identidade premium.
  - Atualizar os textos "Controle UDV" para "Guardião".
- **Arquivos-Chave**: `app/page.tsx`, `layout.tsx` (title, meta), todos os botões e cards de resumo.

## Critérios de Validação (Verify)
- [ ] O logo vetorial carrega perfeitamente e é redimensionável no header.
- [ ] As cores antigas genéricas de sistema (`green-600` em tudo) sumiram.
- [ ] Modo Dark agora tem um impacto forte e sofisticado com o Dourado se destacando no preto puro/cinza muito escuro.
- [ ] Título da aba do navegador é atualizado de "Controle UDV" para "Guardião".

## Riscos Visuais
| Risco | Impacto | Mitigação |
|---|---|---|
| Dourado com baixo contraste no modo Claro | Acessibilidade ruim | Usaremos no texto e no fundo um dourado levemente voltado para o ocre no modo claro (`gold-600/700`), e um dourado mais brilhante no dark mode (`gold-400`). |
| O texto "Controle UDV" sumir pode desorientar | Identificação comprometida | Deixaremos "Guardião" com um subtítulo "Controle e Memória" pra fazer a ponte com o uso atual. |

## Próximos Passos
Ao aprovar, vou criar o componente `<Logo />` de imediato e aplicar o novo Design System no `tailwind`.
