-- ==============================================================================
-- MIGRATION V7: CORREÇÃO DE PRODUTOS E ACESSOS
-- Resolve o problema de falha ao adicionar/apagar produtos e flexibiliza login
-- ==============================================================================

-- 1. GARANTIR RLS E ACESSO NA TABELA PRODUTOS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total produtos" ON public.produtos;
CREATE POLICY "Acesso total produtos" ON public.produtos FOR ALL USING (true);

-- 2. FLEXIBILIZAR LOGIN E SENHA NA TABELA OPERADORES
-- Removemos restrições de NOT NULL se existirem e garantimos que campos aceitam nulo
ALTER TABLE public.operadores ALTER COLUMN login DROP NOT NULL;
ALTER TABLE public.operadores ALTER COLUMN senha DROP NOT NULL;

-- 3. GARANTIR QUE PRODUTOS TENHA DATA DE REGISTRO
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. COMENTÁRIO DE SUCESSO
COMMENT ON TABLE public.produtos IS 'Tabela de produtos com RLS corrigido para acesso total.';
