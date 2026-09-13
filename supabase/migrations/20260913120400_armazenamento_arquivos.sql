-- Guardião v2 — bucket privado para fotos de membros, atas e logo do núcleo.

INSERT INTO storage.buckets (id, name, public)
VALUES ('arquivos', 'arquivos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Arquivos: leitura por autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos: envio por editores" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos: alteração por editores" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos: exclusão por editores" ON storage.objects;

CREATE POLICY "Arquivos: leitura por autenticados" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'arquivos');

CREATE POLICY "Arquivos: envio por editores" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'arquivos' AND public.can_edit());

CREATE POLICY "Arquivos: alteração por editores" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'arquivos' AND public.can_edit());

CREATE POLICY "Arquivos: exclusão por editores" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'arquivos' AND public.can_edit());
