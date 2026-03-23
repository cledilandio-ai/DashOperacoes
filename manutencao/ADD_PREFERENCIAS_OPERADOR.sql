-- Adiciona colunas de preferência na tabela de operadores
ALTER TABLE public.operadores 
ADD COLUMN IF NOT EXISTS maquina_preferencial_id BIGINT REFERENCES public.maquinas(id),
ADD COLUMN IF NOT EXISTS produto_preferencial_id BIGINT REFERENCES public.produtos(id),
ADD COLUMN IF NOT EXISTS turno_preferencial_id BIGINT REFERENCES public.turnos(id);

-- Adiciona coluna de turno no registro de produção (para auditoria e relatórios)
ALTER TABLE public.producao_lancamentos
ADD COLUMN IF NOT EXISTS turno_id BIGINT REFERENCES public.turnos(id);

-- Comentários para documentação
COMMENT ON COLUMN public.operadores.maquina_preferencial_id IS 'ID da máquina onde este operador trabalha fixo.';
COMMENT ON COLUMN public.operadores.produto_preferencial_id IS 'ID do produto que este operador costuma produzir fixa.';
COMMENT ON COLUMN public.operadores.turno_preferencial_id IS 'ID do turno padrão deste operador.';
COMMENT ON COLUMN public.producao_lancamentos.turno_id IS 'ID do turno em que a produção foi realizada.';
