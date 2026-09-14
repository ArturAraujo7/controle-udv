-- Adiciona informações de contato e rastreio úteis primariamente para visitantes
-- (Mas podem ser usadas por qualquer membro)
ALTER TABLE "public"."membros"
ADD COLUMN "telefone" text,
ADD COLUMN "data_primeira_visita" date;
