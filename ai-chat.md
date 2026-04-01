# AI Chatbot Assistant (Project Planner)
**Project Type**: WEB

## Overview
Implementar um assistente de IA focado em responder dúvidas em linguagem natural sobre as sessões, preparos, distribuições e funções litúrgicas usando o Gemini Flash.

## Success Criteria
- [ ] O componente flutuante de chat aparece e abre corretamente.
- [ ] A API busca os dados atualizados das tabelas essenciais usando o cliente Supabase.
- [ ] O modelo Gemini Flash recebe o contexto e do histórico (limitado a 10).
- [ ] A resposta da IA é transmistida por streaming.
- [ ] A interface não trava e suporta Dark Mode.

## Tech Stack
- Frontend: Next.js + React (Components)
- Estilização: TailwindCSS
- Modelo LLM: `@google/generative-ai` (Gemini Flash)
- Dados: Supabase JS Client (`@supabase/supabase-js`)

## File Structure
- `app/api/ia/chat/route.ts` [NEW] - API Route para gerenciar as buscas e streaming.
- `components/AIChatWidget.tsx` [NEW] - UI do chat.
- `app/layout.tsx` [MODIFY] - Injecao do componente.

## Task Breakdown

### Task 1: Instalação das dependências
- **Agent**: `orchestrator`
- **Skill**: bash-linux
- **INPUT**: Necessidade da SDK do Google.
- **OUTPUT**: `npm install @google/generative-ai` executado.
- **VERIFY**: Pacote registrado no `package.json`.

### Task 2: Implementação da API de Chat Stream
- **Agent**: `backend-specialist`
- **Skill**: nextjs-react-expert
- **INPUT**: Requisição POST com o array local de mensagens (`history`).
- **OUTPUT**: Rota `/api/ia/chat` que busca no banco (`sessoes`, `consumos`, `preparos` etc.), junta os dados num JSON compacto, constrói o prompt, executa o `gemini-1.5-flash` stream e retorna para o client via `ReadableStream`.
- **VERIFY**: Realizar POST manua/cURL local validando se dados fluem de forma contínua em formato texto.

### Task 3: Implementação do Chat Widget UI
- **Agent**: `frontend-specialist`
- **Skill**: frontend-design
- **INPUT**: A API de stream criada.
- **OUTPUT**: Componente `AIChatWidget` (botão bottom-right + painel 380x480). Suporte a enviar via enter, carregar streams iterando os chunks do `response.body`.
- **VERIFY**: Teste de UI interativo garantindo a correta exibição progressiva do texto e scroll automático até o fim.

### Task 4: Injeção Global no Layout
- **Agent**: `frontend-specialist`
- **Skill**: nextjs-react-expert
- **INPUT**: Componente Widget.
- **OUTPUT**: Adição ao `app/layout.tsx` na camada ideal (`absolute` ou `fixed`).
- **VERIFY**: Widget operante em todas as páginas e sem problemas de z-index.

## ✅ PHASE X COMPLETE
[Pending all checks]
