---
name: Frontend Frotas
description: Identidade visual, componentes e UX para interfaces de frotas (Admin e Motorista).
---

# Skill: Identidade Visual e Interface (UI/UX)
**COMUNICAÇÃO OBRIGATÓRIA: O agente deve se comunicar estritamente em Português do Brasil (PT-BR).**

Esta skill padroniza a interface e a experiência do usuário para manter inconsistência entre os módulos do ecossistema.

## 1. Paleta de Cores Padrão
Use classes Tailwind.

| Elemento | Cor | Classe Tailwind |
| :--- | :--- | :--- |
| **Admin Sidebar** | Slate Escuro | `bg-slate-900 text-slate-100` |
| **Botões Ação** | Azul Real | `bg-blue-600 hover:bg-blue-700` |
| **Botão Sucesso** | Verde Esmeralda | `bg-green-600` |
| **Botão Perigo** | Vermelho Rose | `bg-red-600` |
| **Dashboard Background** | Cinza Claro | `bg-slate-50` |
| **Header Motorista** | Azul Fixo | `bg-blue-600 text-white` (Sticky Top) |

## 2. Estrutura de Layouts

### A. Layout Administrativo (Desktop Focado)
Deve possuir uma **Sidebar Lateral Fixa** à esquerda e **Conteúdo Rolável** à direita.

**Componente Recomendado:** `AdminSidebar.tsx`
- Links com ícones `lucide-react` (tamanho 20px).
- Destaque para a rota ativa (`bg-slate-800 text-blue-400`).
- Rodapé com botão de Logout e versão do sistema.

### B. Layout Motorista (Mobile Focado)
Deve ser simples, botões grandes e livre de distrações.

**Padrão `MotoristaView`:**
1.  **Header Fixo:** Nome do sistema e status de conexão.
2.  **Card de Status:** Mostra o status atual do veículo com cor de fundo correspondente (Verde = Livre, Azul = Em Rota).
3.  **Botões de Ação Grandes:** Botões em grid ou lista vertical larga para atualizar status com um toque.
4.  **Formulários Simplificados:** Inputs grandes (`p-3` ou `p-4`), labels claros.

## 3. Feedback Visual e Interações
- **Loading:** Sempre mostrar feedback visual em ações assíncronas (ex: "Enviando...", "Obtendo GPS..."). Use `animate-pulse` ou spinners.
- **Modais:** Usar modais centralizados com `fixed inset-0 bg-black/50` para confirmações críticas (ex: Fechar Ordem de Serviço).
- **Toasts:** Notificações flutuantes para sucesso/erro, desaparecendo após 3-5 segundos.

## 4. Ícones Padrão (Lucide React)
- **Painel/Home:** `LayoutDashboard`
- **Veículos:** `Truck`
- **Motoristas:** `Users`
- **Manutenção:** `Wrench`
- **Pneus:** `CircleDashed` (ou `Disc`)
- **Configurações:** `Settings`
- **Sair:** `LogOut`
