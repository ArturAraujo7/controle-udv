-- Guardião v2 — situação dos usuários, vínculo com membro e proteção de papel.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membro_id bigint REFERENCES public.membros(id) ON DELETE SET NULL;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pendente', 'ativo', 'desativado'));

-- ============================================================
-- Correção de segurança: a policy "Users can update their own profile name"
-- permitia que qualquer usuário alterasse o próprio papel (role).
-- Papel, situação e vínculo só podem ser alterados por administradores.
-- ============================================================
CREATE OR REPLACE FUNCTION public.proteger_campos_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_admin()
     AND (NEW.role IS DISTINCT FROM OLD.role
          OR NEW.status IS DISTINCT FROM OLD.status
          OR NEW.membro_id IS DISTINCT FROM OLD.membro_id) THEN
    RAISE EXCEPTION 'Somente administradores podem alterar papel, situação ou vínculo de usuários';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_campos_profile ON public.profiles;
CREATE TRIGGER trg_proteger_campos_profile
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_profile();

-- ============================================================
-- Usuários desativados perdem permissão de escrita
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND status = 'ativo'
      AND role IN ('admin'::public.user_role, 'representante'::public.user_role, 'assistente'::public.user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'ativo' AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Novos cadastros chegam como "pendente" para revisão do administrador.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'mestre'::public.user_role, 'pendente')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- Lista de usuários com dados de acesso (só administradores)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  status text,
  membro_id bigint,
  criado_em timestamptz,
  ultimo_acesso timestamptz,
  provedor text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.role, p.status, p.membro_id,
         u.created_at, u.last_sign_in_at, (u.raw_app_meta_data->>'provider')::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.full_name NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_listar_usuarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios() TO authenticated;
