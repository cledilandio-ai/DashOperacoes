-- ==============================================================================
-- MIGRATION V5: HIERARQUIA DE ATIVOS EM ÁRVORE
-- Estrutura: Galpão → Setor → Sub-setor → Máquina → Equipamento → Peça
-- Execute no Supabase SQL Editor
-- ==============================================================================

-- 1. EXPANDIR TABELA SETORES PARA SUPORTAR HIERARQUIA
-- -------------------------------------------------------

-- Adiciona referência ao nó pai (self-referencing FK)
-- pai_id = NULL significa que é um nó raiz (ex: Galpão)
ALTER TABLE public.setores
    ADD COLUMN IF NOT EXISTS pai_id BIGINT REFERENCES public.setores(id) ON DELETE CASCADE;

-- Tipo do nó para ícone/cor na UI
-- Valores: 'GALPAO', 'SETOR', 'SUBSETOR'
ALTER TABLE public.setores
    ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'SETOR';

-- Descrição opcional do setor/galpão
ALTER TABLE public.setores
    ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Ordem de exibição dentro do mesmo nó pai
ALTER TABLE public.setores
    ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Remove constraint UNIQUE no nome (pois "Moagem" pode existir em dois galpões distintos)
-- Rodamos condicionalmente para não gerar erro se já tiver sido removida
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'setores_nome_key'
        AND conrelid = 'public.setores'::regclass
    ) THEN
        ALTER TABLE public.setores DROP CONSTRAINT setores_nome_key;
    END IF;
END $$;

-- 2. GARANTIR COLUNAS NECESSÁRIAS EM MAQUINAS
-- -------------------------------------------------------
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS fabricante TEXT;
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS status_atual TEXT DEFAULT 'DISPONIVEL';
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS horimetro_atual INTEGER DEFAULT 0;
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS horas_uso_diario NUMERIC(4,1) DEFAULT 8;
ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS codigo_qr TEXT;

-- Ajuste para compatibilidade com hierarquia: coluna 'setor' (texto) deve ser opcional
ALTER TABLE public.maquinas ALTER COLUMN setor DROP NOT NULL;

-- 3. GARANTIR COLUNAS EM EQUIPAMENTOS
-- -------------------------------------------------------
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS maquina_id BIGINT REFERENCES public.maquinas(id) ON DELETE CASCADE;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS setor_id BIGINT REFERENCES public.setores(id); -- Equipamento "solto" no setor
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO';
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS fabricante TEXT;
ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS modelo TEXT;

-- 4. GARANTIR COLUNAS EM PECAS
-- -------------------------------------------------------
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS equipamento_id BIGINT REFERENCES public.equipamentos(id) ON DELETE SET NULL;
ALTER TABLE public.pecas ADD COLUMN IF NOT EXISTS maquina_id BIGINT REFERENCES public.maquinas(id) ON DELETE SET NULL;

-- 5. ATUALIZAR POLÍTICAS RLS DA TABELA SETORES
-- -------------------------------------------------------
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total setores" ON public.setores;
CREATE POLICY "Acesso total setores" ON public.setores FOR ALL USING (true);

-- 6. SEEDS: CONVERTER DADOS EXISTENTES (COMPATIBILIDADE)
-- -------------------------------------------------------
-- Os setores existentes continuam funcionando com pai_id = NULL
-- Eles se tornam automaticamente nós raiz da árvore
-- Se quiser transformar os existentes em "GALPAO", execute:
-- UPDATE public.setores SET tipo = 'GALPAO' WHERE pai_id IS NULL;

-- PRONTO! Execute o bloco acima no SQL Editor do Supabase.
-- Depois acesse a tela de Ativos para usar a nova hierarquia.
