-- ADICIONA AS COLUNAS DE PRAZO LIMITE E JUSTIFICATIVA NO SISTEMA DE MANUTENÇÃO (I.E.M.)

-- 1. Coluna do tempo limite (SLA) da O.S. (Em Horas)
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS prazo_limite_horas INTEGER DEFAULT 24;

-- 2. Coluna para o mantenedor blindar os seus pontos caso o atraso seja externo
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS justificativa_atraso TEXT;
