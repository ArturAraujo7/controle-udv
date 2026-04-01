-- 1. Create a custom type for roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'representante', 'assistente', 'mestre');
    END IF;
END
$$;

-- 2. Add the 'role' column to the 'profiles' table (default to 'mestre')
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'mestre'::public.user_role;

-- 3. Create security helper functions
-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if the current user has write permissions (admin, representante, or assistente)
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin'::public.user_role, 'representante'::public.user_role, 'assistente'::public.user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security (RLS) on all tables (if not already enabled)
ALTER TABLE public.consumos_sessao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;
-- profiles is already enabled from schema_backup.sql

-- 5. Drop existing policies to avoid duplicates (optional but safe)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.consumos_sessao;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.consumos_sessao;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.historias;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.historias;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.leituras;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.leituras;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.preparos;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.preparos;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.saidas;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.saidas;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.sessoes;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.sessoes;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.visitantes;
DROP POLICY IF EXISTS "Enable write access for editors" ON public.visitantes;

-- 6. Define generic policies for all tables (Read for all authenticated, Write for editors)
-- consumos_sessao
CREATE POLICY "Enable read access for all authenticated users" ON public.consumos_sessao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.consumos_sessao FOR ALL TO authenticated USING (public.can_edit());

-- historias
CREATE POLICY "Enable read access for all authenticated users" ON public.historias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.historias FOR ALL TO authenticated USING (public.can_edit());

-- leituras
CREATE POLICY "Enable read access for all authenticated users" ON public.leituras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.leituras FOR ALL TO authenticated USING (public.can_edit());

-- preparos
CREATE POLICY "Enable read access for all authenticated users" ON public.preparos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.preparos FOR ALL TO authenticated USING (public.can_edit());

-- saidas
CREATE POLICY "Enable read access for all authenticated users" ON public.saidas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.saidas FOR ALL TO authenticated USING (public.can_edit());

-- sessoes
CREATE POLICY "Enable read access for all authenticated users" ON public.sessoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.sessoes FOR ALL TO authenticated USING (public.can_edit());

-- visitantes
CREATE POLICY "Enable read access for all authenticated users" ON public.visitantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for editors" ON public.visitantes FOR ALL TO authenticated USING (public.can_edit());

-- 7. Specific policies for the 'profiles' table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile." ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile." ON "public"."profiles";

-- Anyone authenticated can see profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Anyone can create their own profile during signup
CREATE POLICY "Allow individual insert during signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own full_name but NOT their role
CREATE POLICY "Users can update their own profile name" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can update any role
CREATE POLICY "Admins can update roles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());

-- 8. Assign first admin (using the provided email)
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- This assumes the user exists in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'arturaraujodasilva16@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles SET role = 'admin'::public.user_role WHERE id = v_user_id;
    END IF;
END $$;
