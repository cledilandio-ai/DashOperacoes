-- ==============================================================================
-- MIGRACAO V4.2: MÓDULO DE INDÚSTRIA ( BASEADO EM DATA ESTIMADA )
-- Ajustando para não depender de horímetro físico
-- ==============================================================================

-- 1. AJUSTES EM MÁQUINAS (Configuração de Uso)

ALTER TABLE public.maquinas ADD COLUMN IF NOT EXISTS horas_uso_diario DECIMAL(4,1) DEFAULT 8.0; -- Ex: 16h/dia
-- Removemos a dependência estrita de horimetro_atual para cálculos, mas mantemos como referência informativa se quiserem preencher.

-- 2. AJUSTES EM EQUIPAMENTOS

ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS horas_uso_diario DECIMAL(4,1); -- Opcional, herda da máquina se null

-- 3. PLANOS DE PREVENTIVA (Continua baseado em horas teóricas, mas calcularemos DATA)

-- A tabela preventivas_maquinas precisa guardar a DATA DA ÚLTIMA EXECUÇÃO para projetar a próxima
ALTER TABLE public.preventivas_maquinas ADD COLUMN IF NOT EXISTS data_ultima_execucao DATE DEFAULT CURRENT_DATE;

-- Campo calculado/cacheado para facilitar consultas (opcional, mas bom pra performance)
ALTER TABLE public.preventivas_maquinas ADD COLUMN IF NOT EXISTS data_proxima_estimada DATE;

-- 4. POLÍTICAS RLS (Atualizando se necessário)
-- Já criadas na V4.1
