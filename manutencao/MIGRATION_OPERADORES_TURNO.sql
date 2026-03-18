-- ==============================================================================
-- MIGRATION V6: GESTÃO DE TURNOS E EQUIPE
-- Adiciona suporte a turno e organização mais fina da equipe
-- ==============================================================================

-- 1. ADICIONAR COLUNA DE TURNO NA TABELA OPERADORES
ALTER TABLE public.operadores 
    ADD COLUMN IF NOT EXISTS turno TEXT;

-- 2. COMENTÁRIO PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.operadores.turno IS 'Turno de trabalho do operador (Ex: 1º Turno, 2º Turno, Noite)';

-- 3. AJUSTE DE RLS (GARANTIR QUE ADMIN PODE TUDO)
-- (Geralmente já configurado, mas garante integridade)
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total operadores" ON public.operadores;
CREATE POLICY "Acesso total operadores" ON public.operadores FOR ALL USING (true);
