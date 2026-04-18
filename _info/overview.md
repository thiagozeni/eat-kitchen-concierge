# EAT Kitchen AI Concierge — Visão Geral

## O que é

O **EAT Kitchen AI Concierge** é um consultor gastronômico inteligente desenvolvido especificamente para o restaurante **EAT Kitchen**. Trata-se de uma aplicação web de página única (SPA) que incorpora um chatbot com inteligência artificial para ajudar clientes a escolher pratos do cardápio.

A IA não processa pedidos nem pagamentos. Seu papel é exclusivamente orientar a decisão de compra: entender o momento do cliente, identificar preferências e restrições alimentares, recomendar pratos adequados com fotos reais, e sugerir upgrades ou complementos (entradas, sobremesas) de forma natural e não invasiva.

A identidade visual segue a linguagem da marca EAT Kitchen, com o slogan "PESSOAS. COMIDA. VERDADE" exibido no rodapé da interface.

## Para quem é

Destinado aos clientes do restaurante EAT Kitchen durante o processo de escolha do pedido. A aplicação suporta **8 idiomas**, tornando-a adequada para um público internacional:

| Código | Idioma     | Bandeira |
|--------|------------|----------|
| `pt`   | Português  | BR       |
| `en`   | English    | US       |
| `es`   | Español    | ES       |
| `ru`   | Русский    | RU       |
| `de`   | Deutsch    | DE       |
| `it`   | Italiano   | IT       |
| `zh`   | 中文        | CN       |
| `ja`   | 日本語      | JP       |

O idioma padrão é Português. O cliente pode trocar o idioma a qualquer momento pelo seletor no cabeçalho — em telas grandes aparece como botões com bandeiras; em telas pequenas, como um `<select>` dropdown. A troca de idioma reinicia a conversa (com confirmação se já houver mensagens).

## Status atual

- **Status**: Em desenvolvimento ativo
- **URL de produção**: não documentada no repositório (deploy via Vercel)
- **Repositório GitHub**: `github.com/thiagozeni/eat-kitchen-concierge`
  - Referenciado diretamente no código como base URL para imagens em produção:
    `https://raw.githubusercontent.com/thiagozeni/eat-kitchen-concierge/refs/heads/main/public/images/dishes/`

## Funcionalidades principais

- Recomendações personalizadas baseadas no humor/objetivo do cliente
- Exibição de fotos reais dos pratos diretamente no chat, com zoom ao clicar
- Suporte a vídeos incorporados via Google Drive
- Botões de atalho de humor na tela inicial (Algo leve, Alta proteína, Vegetariano, etc.)
- Botão de copiar recomendação (aparece ao hover em mensagens da IA)
- Confirmação antes de resetar a conversa ou trocar de idioma
- Rolagem inteligente com botão flutuante para descer ao final
- Modal informativo "Sobre o Concierge" com as capacidades da IA
- Nomes de pratos clicáveis: ao clicar no nome em negrito numerado, a mensagem é enviada automaticamente
