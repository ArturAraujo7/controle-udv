-- Add Support for Secondary Director (Múltiplos Dirigentes)
ALTER TABLE "public"."sessoes" ADD COLUMN IF NOT EXISTS "dirigente_2_id" bigint REFERENCES "public"."membros"("id");
ALTER TABLE "public"."sessoes" ADD COLUMN IF NOT EXISTS "tipo_delegacao" text;

-- Adicionando indexação para as consultas mais rápidas pelas FKs (Foreign Keys)
CREATE INDEX IF NOT EXISTS "sessoes_dirigente_2_id_idx" ON "public"."sessoes"("dirigente_2_id");
