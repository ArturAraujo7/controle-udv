-- Expandir a tabela visitantes
ALTER TABLE "public"."visitantes"
ADD COLUMN "telefone" text,
ADD COLUMN "data_primeira_visita" date;
