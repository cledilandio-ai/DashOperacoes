-- ==============================================================================
-- MIGRATION V8: CORREÇÃO DEFINITIVA DE FUNCIONÁRIOS (OPERADORES)
-- Adiciona a coluna 'turno' e garante flexibilidade nos campos de acesso.
-- Execute no SQL Editor do Supabase.
-- ==============================================================================

-- 1. ADICIONAR COLUNA TURNO SE NÃO EXISTIR
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS turno TEXT DEFAULT '1º TURNO';

-- 2. GARANTIR QUE LOGIN E SENHA SEJAM OPCIONAIS (PARA "APENAS REGISTRO")
ALTER TABLE public.operadores ALTER COLUMN login DROP NOT NULL;
ALTER TABLE public.operadores ALTER COLUMN senha DROP NOT NULL;

-- 3. GARANTIR QUE PERFIL EXISTE (CASO NÃO TENHA SIDO CRIADO ANTERIORMENTE)
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS perfil TEXT DEFAULT 'OPERADOR';

-- 4. GARANTIR QUE A TABELA É ACESSÍVEL (RLS)
ALTER TABLE public.operadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total operadores" ON public.operadores;
CREATE POLICY "Acesso total operadores" ON public.operadores FOR ALL USING (true);

-- 5. SUCESSO
COMMENT ON COLUMN public.operadores.turno IS 'Turno de trabalho flexível do colaborador.';
