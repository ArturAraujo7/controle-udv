-- Adiciona constraint UNIQUE composta para id_sessao e id_preparo
-- Impede que o mesmo preparo seja cadastrado mais de uma vez na mesma sessão
-- Caso já existam duplicatas, precisariam ser limpas antes de aplicar a constraint, mas como medida de integridade futura é ideal.

ALTER TABLE "public"."consumos_sessao"
ADD CONSTRAINT unique_sessao_preparo UNIQUE (id_sessao, id_preparo);
