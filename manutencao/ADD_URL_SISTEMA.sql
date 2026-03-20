-- Adiciona coluna de URL oficial do sistema para geração de QR Codes corretos
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS url_sistema TEXT DEFAULT 'https://dash-operacoes.vercel.app';

-- Atualiza o registro existente (ID 1)
UPDATE configuracoes_empresa SET url_sistema = 'https://dash-operacoes.vercel.app' WHERE id = 1 AND url_sistema IS NULL;
