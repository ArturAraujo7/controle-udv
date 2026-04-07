-- Add nome_exibicao column to membros table
ALTER TABLE "public"."membros" ADD COLUMN IF NOT EXISTS "nome_exibicao" text;
