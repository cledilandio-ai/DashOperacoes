-- TABELA GLOBAL PARA CONFIGURAÇÕES DE IMPRESSÃO (WHITE-LABEL)

CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Garante que só vai existir 1 linha na tabela
    nome_empresa TEXT NOT NULL DEFAULT 'Minha Empresa',
    cnpj TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    logo_base64 TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insere o setup inicial apenas se estiver vazio
INSERT INTO public.configuracoes_empresa (id, nome_empresa) 
VALUES (1, 'Café Serra Grande') 
ON CONFLICT (id) DO NOTHING;
