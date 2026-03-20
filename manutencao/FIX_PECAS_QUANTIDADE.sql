-- ==============================================================================
-- FIX: TABELA PECAS - ADICIONAR COLUNAS PARA HIERARQUIA DE ATIVOS
-- Cole e execute no SQL Editor do Supabase para corrigir o erro de 'quantidade'
-- ==============================================================================

ALTER TABLE public.pecas 
    ADD COLUMN IF NOT EXISTS quantidade INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS referencia TEXT,
    ADD COLUMN IF NOT EXISTS fabricante TEXT,
    ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Garantir que colunas de vinculação existam (caso não rodou o V5)
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS equipamento_id BIGINT REFERENCES public.equipamentos(id) ON DELETE CASCADE;
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS maquina_id BIGINT REFERENCES public.maquinas(id) ON DELETE CASCADE;

-- Política de Acesso (Caso falte)
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total pecas" ON public.pecas;
CREATE POLICY "Acesso total pecas" ON public.pecas FOR ALL USING (true);
