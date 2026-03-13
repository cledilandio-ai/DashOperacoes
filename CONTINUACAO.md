# 📋 Plano de Continuação — DashOperacoes (Módulo Indústria)
> Última atualização: 2026-02-20

> **INSTRUÇÃO:** Todas as respostas, explicações, planos e comentários devem ser estritamente em **Português do Brasil (pt-BR)**. Mesmo que os termos técnicos do código sejam em inglês, a explicação deve ser em português.

---

## ✅ O Que Já Foi Feito

| Item | Status |
|---|---|
| Tabelas criadas no Supabase (`setores`, `equipamentos`, `manutencoes`) | ✅ |
| Colunas adicionadas em `maquinas` (`setor_id`, `tag`, `horas_uso_diario`) | ✅ |
| `ManutencaoProvider` adicionado ao `App.jsx` | ✅ |
| `ErrorBoundary` criado e adicionado ao `App.jsx` | ✅ |
| React Rules of Hooks corrigidos em `Ativos.jsx` e `Manutencao.jsx` | ✅ |
| `ProtectedRoute` corrigido: `user.perfil` → `user.funcao` (mapeamento `Gerente→GESTOR`) | ✅ |
| `IndustriaContext`: só busca após login, queries separadas (sem join com equipamentos) | ✅ |
| `ManutencaoContext`: simplificado, só busca `manutencoes` com join `maquinas(nome)` | ✅ |
| `ProducaoContext`: adicionado `useAuth`, busca e Realtime só após login | ✅ |
| RLS policies criadas para todas as novas tabelas | ✅ |
| Usuário `admin` verificado no banco (funcao: `Gerente`, id: 5) | ✅ |

---

## ✅ Problema Resolvido

**Tela branca** nas páginas `/ativos` e `/admin/manutencao` após login.
**Solução Aplicada:**
1. Remoção de importações inválidas (`produits` e `addVeiculo`) em componentes auxiliares que travavam o renderizador do React Router (Vite).
2. O `MainLayout.jsx` foi corrigido para injetar `{children || <Outlet />}` corretamente.

---

## 🎯 Próximos Passos (em ordem)

### PASSO 1 - Cadastrar Máquinas
1. "Ativos Indústria" → "Novo Ativo" → preencher nome/setor/tag → salvar
2. Verificar se as máquinas estão aparecendo listadas e configuradas corretamente.

### PASSO 2 - Testar Fluxo de O.S. (Ordem de Serviço)
1. "Manutenção (TPM)" → "Nova O.S." → selecionar máquina
2. Verificar se o card cai na coluna correta do Kanban
3. Movimentar a O.S. pelas etapas (Aberta -> Em Execução -> Concluída).

## 📁 Arquivos Modificados

| Arquivo | Descrição |
|---|---|
| `src/contexts/IndustriaContext.jsx` | Reescrito completo |
| `src/contexts/ManutencaoContext.jsx` | Reescrito completo |
| `src/contexts/ProducaoContext.jsx` | +useAuth, +user dependency, cleanup melhorado |
| `src/pages/Ativos.jsx` | Hooks corrigidos + modal "Novo Ativo" |
| `src/pages/Manutencao.jsx` | Reescrito completo |
| `src/components/ProtectedRoute.jsx` | funcao + mapeamento de roles |
| `src/components/ErrorBoundary.jsx` | **Novo** |
| `src/App.jsx` | +ManutencaoProvider, +ErrorBoundary |
| `CRIAR_TABELAS_AGORA.sql` | **Novo** — já rodado no Supabase ✅ |

## � Links Úteis
- **SQL Editor Supabase:** https://supabase.com/dashboard/project/upernlulsbswchlcjqkr/sql/new
- **Dev server:** `npm run dev` na pasta `DashOperacoes`
