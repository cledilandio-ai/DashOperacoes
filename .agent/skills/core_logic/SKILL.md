---
name: Lógica Core Frotas
description: Regras de negócio essenciais como Smart Odometer, GPS e Preventivas.
---

# Skill: Funcionalidades Core e Lógica de Negócio
**COMUNICAÇÃO OBRIGATÓRIA: O agente deve se comunicar estritamente em Português do Brasil (PT-BR).**

Esta skill documenta as lógicas de negócio críticas que devem ser replicadas ou consultadas ao manter o sistema.

## 1. Smart Odometer (Validação Inteligente de KM)
O sistema possui uma lógica robusta para aceitar input de quilometragem, lidando com:
1.  **Virada de Odômetro:** Detecta automaticamente se o odômetro virou (passou de 999.999 para 0). Se Atual > 900k e Input < 100k, calcula o novo milhão.
2.  **Trava de Erro de Digitação:** Alerta se a diferença for maior que 10.000km (configurável) de uma vez.
3.  **Registros Retroativos:** Permite registrar manutenções antigas (KM menor que o atual), desde que não conflitem com preventivas anteriores do mesmo tipo. **Importante:** Registros retroativos NÃO reduzem o KM total do veículo no cadastro.

**Função Chave:** `validarKMInput(input, currentKM, allowLower)`

## 2. Rastreamento e Status (GPS)
A atualização de status pelo motorista deve ser resiliente a falhas de rede e GPS.

**Regras de Implementação:**
- **Timeout:** Usar 45 segundos (`timeout: 45000`) para obtenção de GPS.
- **Cache:** Aceitar posições de até 1 minuto atrás (`maximumAge: 60000`) para resposta rápida.
- **Fallback:** Se o GPS falhar, permitir o envio do status com flag de erro ou coordenadas nulas, mas alertar o motorista.
- **Feedback:** Mostrar estado "Obtendo GPS..." durante a espera.

## 3. Gestão de Pneus
O ciclo de vida dos pneus deve seguir o fluxo:
1.  **Compra/Estoque:** Pneu entra como `NOVO` ou `USADO` no estoque.
2.  **Montagem:** Sai do estoque e é vinculado a um `veiculoId` e `posicao` (ex: "Eixo 1 LE").
3.  **Rodízio:** Troca de posição dentro do mesmo veículo ou entre veículos.
4.  **Descarte/Recapagem:** Sai do veículo para processos externos.

**Estrutura de Dados:** JSON stringificado no Checklist para salvar medições rápidas (`{ "eixo1_le": 12, "eixo1_ld": 11 }`).

## 4. Ordem de Serviço (OS)
- **Tipos:** Preventiva (gatilho por KM), Corretiva (Manual), Preditiva.
- **Fechamento:** Ao fechar uma OS, o sistema deve:
    1. Validar o KM (atualizar o veículo se for maior).
    2. Calcular a próxima preventiva baseada no intervalo do `TipoPreventiva`.
    3. Gerar custos (Peças + Mão de Obra).

## 5. Autenticação Simplificada
- Uso de Cookies seguros para sessão.
- Server Actions para Login (`loginAction`).
- Middleware (`middleware.ts`) para proteger rotas `/dashboard`.
