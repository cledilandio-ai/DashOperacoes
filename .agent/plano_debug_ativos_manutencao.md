# Plano de Debug — Páginas Ativos e Manutenção (Tela Branca)

## Status Atual (2026-02-20)
- ✅ Tabelas criadas no Supabase via `CRIAR_TABELAS_AGORA.sql`
- ✅ `ErrorBoundary` adicionado em `App.jsx`
- ✅ React Rules of Hooks corrigidos em `Ativos.jsx` e `Manutencao.jsx`
- ✅ `ProtectedRoute` corrigido (`user.perfil` → `user.funcao` com mapeamento)
- ✅ Queries separadas em `IndustriaContext` (sem join de `equipamentos`)
- ✅ `ProducaoContext`, `IndustriaContext`, `ManutencaoContext` só buscam dados após login
- ❌ Ainda tela branca nas páginas `/ativos` e `/admin/manutencao`
- ❌ Erro persistente: `ProducaoContext.jsx` com `removeChannel` / WebSocket crash

---

## Causa Raiz Suspeita Principal (Não Confirmada)

O `ProducaoContext` faz uma assinatura de Realtime do Supabase.
Quando o usuário navega entre rotas, o React faz o cleanup do efeito anterior.
O `channel.unsubscribe()` / `supabase.removeChannel()` **lança um erro não capturado**
que interrompe o ciclo de renderização do React, deixando a página branca.

O `ErrorBoundary` **não captura** erros em `useEffect` cleanup — apenas erros de render.

---

## Próximos Passos (Em Ordem de Prioridade)

### PASSO 1 — Desativar Realtime do ProducaoContext temporariamente
**Arquivo:** `src/contexts/ProducaoContext.jsx`

Comentar TODO o bloco de assinatura de Realtime e só deixar o `fetchDados()`:

```js
useEffect(() => {
    if (!user) return;
    fetchDados();
    // REALTIME DESATIVADO TEMPORARIAMENTE PARA DEBUG
    // const channel = supabase.channel(...)...
}, [user]);
```

**Objetivo:** Confirmar se o erro do Realtime é o que quebra a navegação.
Se as páginas carregarem após isso → problema confirmado no Realtime.

---

### PASSO 2 — Se PASSO 1 confirmar: Corrigir Realtime definitivamente

Usar `useRef` para guardar o canal e desativar Strict Mode temporariamente:

```js
const channelRef = useRef(null);

useEffect(() => {
    if (!user) return;
    fetchDados();

    channelRef.current = supabase
        .channel('producao_changes')
        .on('postgres_changes', {...}, fetchDados)
        .subscribe();

    return () => {
        const ch = channelRef.current;
        channelRef.current = null;
        if (ch) {
            Promise.resolve(ch.unsubscribe()).catch(() => {});
        }
    };
}, [user]);
```

---

### PASSO 3 — Se PASSO 1 NÃO resolver: Investigar o `MainLayout`

**Arquivo:** `src/layouts/MainLayout.jsx`

O `Outlet` ou o layout pode estar causando problema.
Verificar se o componente filho está sendo renderizado corretamente.

Testar rota sem `MainLayout`:
```jsx
// Temporário no App.jsx para debug:
<Route path="/ativos-debug" element={<Ativos />} />
```

Acessar `localhost:5173/ativos-debug` sem ProtectedRoute e sem MainLayout.

---

### PASSO 4 — Verificar RLS do Supabase com usuário `Gerente`

O usuário de teste tem `funcao: 'Gerente'`. O `ProtectedRoute` já foi corrigido
para mapear `Gerente → GESTOR`. Mas confirmar no console do browser:

Abrir DevTools → Console → após login, verificar:
```
Login realizado com sucesso: {..., funcao: 'Gerente', ...}
```

Se `funcao` for `Gerente`, as rotas que permitem `GESTOR` devem abrir.

---

### PASSO 5 — Adicionar logs temporários no Ativos.jsx

No início do componente, após os hooks:

```js
console.log('Ativos RENDER - context:', !!context, 'loading:', loading, 'setores:', setores.length);
```

Isso vai confirmar se o componente está chegando a renderizar.

---

## Arquivos Modificados Nesta Sessão

| Arquivo | O que mudou |
|---|---|
| `src/contexts/IndustriaContext.jsx` | Reescrito — só busca com user, queries separadas |
| `src/contexts/ManutencaoContext.jsx` | Reescrito — simplificado, só com tabela manutencoes |
| `src/contexts/ProducaoContext.jsx` | Adicionado useAuth, só busca/subscribe com user |
| `src/pages/Ativos.jsx` | Hooks movidos para antes do return condicional |
| `src/pages/Manutencao.jsx` | Reescrito — hooks corrigidos, context com fallback |
| `src/components/ProtectedRoute.jsx` | Corrigido: user.perfil → user.funcao com mapeamento |
| `src/components/ErrorBoundary.jsx` | **Novo** — captura erros de render |
| `src/App.jsx` | +ManutencaoProvider, +ErrorBoundary |
| `CRIAR_TABELAS_AGORA.sql` | **Novo** — SQL para criar tabelas no Supabase |

---

## Estrutura de Tabelas Criadas no Supabase

```
setores          (id, nome, responsavel)
maquinas         +columns: horimetro_atual, status_atual, setor_id, tag, horas_uso_diario
equipamentos     (id, nome, maquina_id, horimetro_atual)
manutencoes      (id, tipo, status, prioridade, descricao, maquina_id, data_abertura)
```

## Credenciais do Supabase
- URL: `https://upernlulsbswchlcjqkr.supabase.co`
- Anon key: `eyJhbGciOiJI...` (no supabaseClient.js)
- SQL Editor: `https://supabase.com/dashboard/project/upernlulsbswchlcjqkr/sql/new`

## Usuário de Teste
- login: `admin` (ou similar)
- funcao: `Gerente` (mapeado para `GESTOR` no ProtectedRoute)
- id: 5
