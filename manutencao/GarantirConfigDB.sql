-- Garante que a tabela existe com as colunas básicas
CREATE TABLE IF NOT EXISTS configuracoes_empresa (
    id BIGINT PRIMARY KEY,
    nome_empresa TEXT,
    cnpj TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    url_sistema TEXT,
    logo_base64 TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas faltantes caso a tabela já exista mas esteja desatualizada
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS url_sistema TEXT;
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS logo_base64 TEXT;

-- Garante que existe pelo menos o registro com ID 1
INSERT INTO configuracoes_empresa (id, nome_empresa)
VALUES (1, 'MINHA EMPRESA')
ON CONFLICT (id) DO NOTHING;
