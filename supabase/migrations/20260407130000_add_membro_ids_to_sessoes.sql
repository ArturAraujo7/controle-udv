-- Add member reference columns to sessoes table
ALTER TABLE "public"."sessoes" ADD COLUMN IF NOT EXISTS "dirigente_id" bigint REFERENCES "public"."membros"("id");
ALTER TABLE "public"."sessoes" ADD COLUMN IF NOT EXISTS "explanador_id" bigint REFERENCES "public"."membros"("id");
ALTER TABLE "public"."sessoes" ADD COLUMN IF NOT EXISTS "leitor_documentos_id" bigint REFERENCES "public"."membros"("id");

-- Adicionando indexação para as consultas mais rápidas pelas FKs (Foreign Keys)
CREATE INDEX IF NOT EXISTS "sessoes_dirigente_id_idx" ON "public"."sessoes"("dirigente_id");
CREATE INDEX IF NOT EXISTS "sessoes_explanador_id_idx" ON "public"."sessoes"("explanador_id");
CREATE INDEX IF NOT EXISTS "sessoes_leitor_id_idx" ON "public"."sessoes"("leitor_documentos_id");
