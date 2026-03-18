---
name: Preferências de Projeto (Estilos, DB e Idioma PT-BR)
description: Define como o assistente deve estruturar o projeto, incluindo idioma obrigatório PT-BR, padrões de componentes (SearchSelect, Modais) e modelagem do banco.
---

# Preferências OBRIGATÓRIAS de Projeto

Ao me chamar no contexto deste projeto (Painel Integrado), você DEVE seguir rigidamente as seguintes premissas sistêmicas:

## 1. Comunicação e Idioma
- **TODA a comunicação, explicações, comentários estruturais e documentações** DEVEM ser geradas e respondidas obrigatoriamente em **Português do Brasil (PT-BR)**.
- O tom de voz com o usuário ("ger") deve ser: dinâmico, colaborativo, muito educado ("chefe", "amigo") e objetivo, focando em resolução limpa sem burocracias pesadas.

## 2. Padrões de Interface Frontend (UX/UI)
- **Pesquisa Inteligente (SearchSelect):** 
  - Fica EXTREMAMENTE PROIBIDO criar listas com `<select>` padrão do navegador para dados vindo do banco (como Máquinas, Setores, Operadores e Peças). 
  - Sempre utilize ou adapte o componente inteligente `SearchSelect.jsx`. Ele atua como um dropdown autocomplete que permite pesquisar simultaneamente por *nome*, *descrição* ou *TAG* via *includes()*.
- **Modais de Ação:** 
  - Todos os formulários (Cadastro, Edição) devem sempre abrir como Modais flutuantes por cima da tela. Use overlays limpos (ex: `<div className="fixed inset-0 bg-black/50...">`) para prender o foco.
- **Feedback Constante (UX):** 
  - Toda ação que envia dados ao banco deve trocar dinamicamente o estado dos botões para visual de loading ("Salvando...", `disabled={true}`) para evitar acúmulos/clicks duplos do usuário.
- **Tratamento de Strings no BD:** 
  - Strings de identificação e cadastro estático (Nomes, Placas, Chassis, TAGs, Modelos) devem obrigatoriamente passar por `e.target.value.toUpperCase()` antes de ir pro hook state da UI.

## 3. Padrão de Banco de Dados e Scripts
- O nome de tabelas e colunas (PostgreSQL Supabase) deve ser **sintético** e sempre em formato snake_case `minusculo` (Ex: tabela `manutencoes`, coluna `descricao_problema`).
- Em arquivos `.sql` de **MIGRATION**, use SEMPRE proteções `CREATE TABLE IF NOT EXISTS` e deduplicações como `ALTER TABLE public... ADD COLUMN IF NOT EXISTS`.
- Todas as execuções de correção, como "merges" (exclusões de registros atrelados de forma duplicada), devem seguir OBRIGATORIAMENTE a trilha segura de hierarquia relacional SQL:
  > **Regra de Ouro DB:** `1. Transferir os Filhos` / `2. Arrumar o Pai` / `3. Deletar a Sobra Tardia`. Se usar Delete antes, causará erro nos relacionamentos (FKs).

## 4. Pastas Estruturadas
- O projeto raiz deve manter-se cravado e limpo contendo apenas bibliotecas (`node_modules`), source (`src`), public (`public`), configurações Node/Vite (`package.json`, `vite.config.js`) e workers git/github Actions.
- Ferramentas avulsas criadas no improviso como robôs em Node (`Scrapers`), arquivos de notas (`.md`), `.json` pesados de logs, scripts de backup ou rotinas SQL soltas, DEVEM ser hospedadas pontualmente na pasta `/manutencao`. Nada suja a raiz do front-end.

## 5. Padrão White-Label (Cabeçalhos e Documentos)
- NENHUM formulário, relatório ou impressão visual pode e deve conter logos mockadas, hardcodes ou o nome "Café Serra Grande" / "Logo".
- Todas as impressões devem imperativamente consumir o `useConfig()` provido por `ConfiguracoesContext.jsx`.
- Esse hook devolve o State global `config`, de onde você sempre deve renderizar `config.logo_base64` num `<img src>` e `config.nome_empresa` em `<h2/>` para padronizar perfeitamente as views imprimíveis.
