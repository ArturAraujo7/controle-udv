# Project Plan: Activity Log (Movimentações)

## 1. Overview
O usuário precisa de um painel/audit log ("local que eu possa ver todas as movimentações do app") refletindo quando usuários mudam sessão, estoques, etc.

## 2. Project Type
**WEB** (Next.js 14 App Router + Supabase)

## 3. Tech Stack
- Frontend: Next.js, TailwindCSS
- Backend: Supabase (PostgreSQL Triggers)

## 4. Success Criteria
- [ ] Qualquer mudança em tabelas cruciais (`preparos`, `sessoes`) gera um log automático ("Fulano de tal alterou...").
- [ ] O usuário consegue visualizar essas informações em uma tela dedicada à atividade.

## 5. File Structure
- `supabase/migrations/xxxx_activity_log.sql`
- `app/(admin)/atividades/page.tsx`
- `components/ActivityTimeline.tsx`

## 6. Task Breakdown

| Task | Agent | Skills | Action | Priority | Dependencies | Verify |
|------|-------|--------|--------|----------|--------------|--------|
| T1 | `database-architect` | `database-design` | Criar tabela `activity_logs` e função de trigger no banco Supabase (logando auth.uid()) | P0 | Nenhuma | Banco atualizado e gatilhos ativos |
| T2 | `frontend-specialist` | `frontend-design` | Criar componente de timeline `ActivityTimeline.tsx` | P1 | T1 | Componente renderizando dados mockados/via banco |
| T3 | `frontend-specialist` | `frontend-design` | Criar a rota no diretório `app` para exibir os logs e aplicar filtros | P1 | T2 | Página interativa mostrando logs reais |

## 7. Phase X
- [ ] Lint: `npm run lint`
- [ ] Segurança/Build: Sem problemas
- Segurança de banco de dados validada (Triggers devem ser seguros contra injeções SQL).
