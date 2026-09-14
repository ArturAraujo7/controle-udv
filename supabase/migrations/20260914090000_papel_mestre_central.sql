-- Guardião — novo papel "Mestre Central" (visão regional, somente leitura).
-- Em arquivo próprio: um valor novo de enum não pode ser usado na mesma transação em que é criado.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'central';
