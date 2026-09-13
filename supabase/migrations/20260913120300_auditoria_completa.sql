-- Guardião v2 — auditoria completa: motivo da alteração, mais tabelas e acesso restrito.

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS motivo text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS registro_uuid uuid;

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_registro_idx ON public.activity_logs(tabela_afetada, registro_id);

-- ============================================================
-- Mensagem legível por tabela
-- ============================================================
CREATE OR REPLACE FUNCTION public.mensagem_atividade(p_op text, p_tabela text, p_row jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    (CASE p_op WHEN 'INSERT' THEN 'Criou' WHEN 'UPDATE' THEN 'Editou' ELSE 'Excluiu' END)
    || ' ' ||
    CASE p_tabela
      WHEN 'sessoes' THEN 'sessão (' || COALESCE(p_row->>'tipo', '—') || ')'
      WHEN 'preparos' THEN 'preparo (' || COALESCE(p_row->>'mestre_preparo', '—') || ')'
      WHEN 'saidas' THEN 'saída para ' || COALESCE(p_row->>'destino', '—')
      WHEN 'consumos_sessao' THEN 'consumo de sessão'
      WHEN 'membros' THEN 'membro ' || COALESCE(p_row->>'nome', '—')
      WHEN 'membros_graus_historico' THEN 'mudança de grau (' || COALESCE(p_row->>'grau_novo', '—') || ')'
      WHEN 'leituras' THEN 'leitura de documento (' || COALESCE(p_row->>'documento', '—') || ')'
      WHEN 'historias' THEN 'história contada (' || COALESCE(p_row->>'titulo_historia', '—') || ')'
      WHEN 'visitantes' THEN 'visitante ' || COALESCE(p_row->>'nome', '—')
      WHEN 'configuracoes' THEN 'configurações do núcleo'
      WHEN 'listas_sistema' THEN 'item de lista (' || COALESCE(p_row->>'nome', '—') || ')'
      WHEN 'profiles' THEN 'usuário ' || COALESCE(p_row->>'full_name', p_row->>'email', '—')
      ELSE p_tabela
    END;
$$;

-- ============================================================
-- Trigger genérico (substitui a versão anterior)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_id text;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN v_old := to_jsonb(OLD); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN v_new := to_jsonb(NEW); END IF;

  -- Ignora updates que não mudaram nenhum dado real.
  IF TG_OP = 'UPDATE'
     AND (v_old - 'motivo_alteracao' - 'updated_at') = (v_new - 'motivo_alteracao' - 'updated_at') THEN
    RETURN NEW;
  END IF;

  v_row := COALESCE(v_new, v_old);
  v_id := v_row->>'id';

  INSERT INTO public.activity_logs (
    user_id, acao, tabela_afetada, registro_id, registro_uuid,
    dados_antigos, dados_novos, mensagem_automatica, motivo
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN v_id ~ '^[0-9]+$' THEN v_id::bigint END,
    CASE WHEN v_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_id::uuid END,
    v_old,
    v_new,
    public.mensagem_atividade(TG_OP, TG_TABLE_NAME, v_row),
    NULLIF(v_new->>'motivo_alteracao', '')
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Triggers em todas as tabelas de dados
-- ============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'preparos', 'sessoes', 'consumos_sessao', 'saidas', 'membros',
    'membros_graus_historico', 'leituras', 'historias', 'visitantes',
    'configuracoes', 'listas_sistema', 'profiles'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_%1$s ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_log_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
       FOR EACH ROW EXECUTE FUNCTION public.log_activity()', t);
  END LOOP;
END $$;

-- ============================================================
-- Acesso: só administradores leem o log; ninguém escreve direto
-- ============================================================
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Leitura por administradores" ON public.activity_logs;
CREATE POLICY "Leitura por administradores" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON TABLE public.activity_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.activity_logs FROM authenticated;
GRANT SELECT ON TABLE public.activity_logs TO authenticated;
