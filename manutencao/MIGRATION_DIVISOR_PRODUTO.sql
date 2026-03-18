-- ============================================================
-- MIGRATION: Adicionar coluna 'divisor' na tabela produtos
-- Data: 2026-03-17
-- Descrição: Permite configurar a fórmula de produtividade
--            por produto (Produção ÷ divisor = Base do cálculo)
-- ============================================================

ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS divisor NUMERIC DEFAULT 100;

-- Atualiza produtos existentes com o divisor padrão (100)
UPDATE produtos SET divisor = 100 WHERE divisor IS NULL;

-- Verifica resultado
SELECT id, nome, tipo, divisor FROM produtos ORDER BY nome;
