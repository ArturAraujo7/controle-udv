-- ============================================================
-- Tipos de sessão com leitura de documentos e explanação
-- Só as sessões de Escala e Escala Anual têm leitor e explanador. A marcação
-- fica no tipo de sessão (Configurações › Listas), no lugar de "exige explanador".
-- ============================================================

ALTER TABLE public.listas_sistema
  ADD COLUMN IF NOT EXISTS tem_leitura_explanacao boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.listas_sistema.tem_leitura_explanacao IS
  'Tipos de sessão: o formulário mostra leitor de documentos e explanador';

UPDATE public.listas_sistema
SET tem_leitura_explanacao = true
WHERE lista = 'tipos_sessao' AND nome IN ('Escala', 'Escala Anual');

ALTER TABLE public.listas_sistema DROP COLUMN IF EXISTS exige_explanador;

-- Regiões novas já nascem com a marcação nos tipos de escala
CREATE OR REPLACE FUNCTION public.semear_listas_regiao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.listas_sistema (regiao_id, lista, nome, ordem, tem_leitura_explanacao)
  SELECT NEW.id, l.lista, l.nome, l.ordem, (l.lista = 'tipos_sessao' AND l.nome IN ('Escala', 'Escala Anual'))
  FROM (VALUES
    ('tipos_sessao', 'Escala', 1), ('tipos_sessao', 'Escala Anual', 2), ('tipos_sessao', 'Casal', 3),
    ('tipos_sessao', 'Extra', 4), ('tipos_sessao', 'Instrutiva', 5), ('tipos_sessao', 'Da Direção', 6),
    ('tipos_sessao', 'Quadro de Mestres', 7), ('tipos_sessao', 'Adventício', 8), ('tipos_sessao', 'Preparo', 9),
    ('tipos_sessao', 'Caráter Instrutivo', 10),
    ('graus', 'Mestre', 1), ('graus', 'Corpo do Conselho', 2), ('graus', 'Corpo Instrutivo', 3), ('graus', 'Sócio', 4),
    ('tipos_delegacao', 'Transmissão da Assistência', 1), ('tipos_delegacao', 'Transmissão da Representação', 2),
    ('motivos_saida', 'Doação', 1), ('motivos_saida', 'Empréstimo', 2), ('motivos_saida', 'Envio para preparo', 3),
    ('motivos_saida', 'Outro', 4)
  ) AS l(lista, nome, ordem)
  ON CONFLICT (regiao_id, lista, nome) DO NOTHING;
  RETURN NEW;
END;
$$;
