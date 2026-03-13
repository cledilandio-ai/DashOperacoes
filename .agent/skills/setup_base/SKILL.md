---
name: Setup Base Frotas
description: Estrutura inicial e configurações de banco de dados para sistemas de gestão de frotas.
---

# Skill: Setup Base para Gestão de Frotas
**COMUNICAÇÃO OBRIGATÓRIA: O agente deve se comunicar estritamente em Português do Brasil (PT-BR).**

Esta skill define a arquitetura base para novos projetos de gestão de frotas derivados do sistema original.

## 1. Stack Tecnológico
- **Framework:** Next.js 15 (App Router)
- **Banco de Dados:** PostgreSQL (via Prisma ORM) ou SQLite (local)
- **Estilização:** Tailwind CSS v4 (inline theme)
- **Ícones:** Lucide React

## 2. Estrutura de Diretórios Recomendada
```
/app
  /actions.ts        # Server Actions (Lógica de Negócio)
  /api               # Endpoints API (se necessário)
  /dashboard         # Área Administrativa (Protegida)
    /layout.tsx      # Sidebar + Auth Check
    /frota           # Gestão de Veículos
    /motorista       # Gestão de Usuários
  /motorista         # Área Pública/Restrita do Motorista (Mobile First)
  /globals.css       # Estilos Globais + Print Styles
/components
  /ui                # Componentes Genéricos (Botões, Inputs)
  /dashboard         # Cards, Gráficos
  /motorista         # Views específicas do motorista
/prisma
  schema.prisma      # Definição do Banco de Dados
```

## 3. Modelo de Dados Core (Prisma)
Copie este núcleo para iniciar o `schema.prisma`. Ele contém a estrutura vital de Veículo, Usuário e Logs.

```prisma
model Veiculo {
  id              String   @id @default(uuid())
  placa           String   @unique
  tipo            String   // "toco", "trucado", "cavalo"
  statusAtual     String   @default("NA_EMPRESA") 
  kmAtual         Int      @default(0)
  statusUpdatedAt DateTime @default(now())
  
  logsStatus      StatusLog[]
  ordensServico   OrdemServico[]
  condutorPrincipal Usuario? @relation("CondutorPrincipal", fields: [condutorPrincipalId], references: [id])
  condutorPrincipalId String?
}

model Usuario {
  id        String   @id @default(uuid())
  nome      String
  email     String   @unique
  senha     String   // Hash
  cargo     String   // "GESTOR", "MOTORISTA"
  veiculosPrincipais Veiculo[] @relation("CondutorPrincipal")
}

model StatusLog {
  id        String   @id @default(uuid())
  veiculoId String
  veiculo   Veiculo  @relation(fields: [veiculoId], references: [id])
  status    String
  latitude  Float?
  longitude Float?
  observacao String?
  dataHora  DateTime @default(now())
  motoristaNome String?
}
```

## 4. Configuração Global (CSS)
Garanta que `app/globals.css` tenha configurações de impressão para relatórios limpos:

```css
@media print {
  aside, nav, header, footer { display: none !important; }
  .no-print { display: none !important; }
  body, main { background: white !important; color: black !important; margin: 0 !important; }
}
```
