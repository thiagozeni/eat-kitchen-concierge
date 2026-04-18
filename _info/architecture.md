# EAT Kitchen AI Concierge — Arquitetura

## Stack completa

### Frontend
| Tecnologia         | Versão    | Função                                        |
|--------------------|-----------|-----------------------------------------------|
| React              | ^19.0.0   | Framework de UI                               |
| Vite               | ^6.2.0    | Build tool e dev server (porta 3000)          |
| TypeScript         | ~5.8.2    | Tipagem estática                              |
| Tailwind CSS       | ^4.1.14   | Estilização utilitária                        |
| Motion (Framer)    | ^12.23.24 | Animações (entrada de mensagens, modais)      |
| Lucide React       | ^0.546.0  | Ícones (Send, Bot, User, Leaf, etc.)          |
| React Markdown     | ^10.1.0   | Renderização de Markdown no chat              |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | Utilitários para classes CSS condicionais |

### Backend (desenvolvimento local)
| Tecnologia         | Versão    | Função                                        |
|--------------------|-----------|-----------------------------------------------|
| Node.js + Express  | ^4.21.2   | Servidor HTTP local                           |
| tsx                | ^4.21.0   | Execução de TypeScript sem compilação         |
| concurrently       | ^9.2.1    | Roda API e Vite em paralelo com `npm run dev` |
| dotenv             | ^17.2.3   | Carregamento de variáveis de ambiente         |

### Backend (produção)
| Tecnologia         | Versão    | Função                                        |
|--------------------|-----------|-----------------------------------------------|
| Vercel Functions   | —         | Serverless handler em `api/chat/stream.ts`    |

### IA
| Tecnologia         | Versão    | Função                                        |
|--------------------|-----------|-----------------------------------------------|
| Google Gemini AI   | ^1.29.0   | Modelo `gemini-flash-latest` para respostas   |
| @google/genai SDK  | ^1.29.0   | SDK oficial da Google para Gemini             |

### Processamento de imagens
| Tecnologia         | Versão    | Função                                        |
|--------------------|-----------|-----------------------------------------------|
| sharp              | ^0.33.5   | Conversão PNG → WebP em múltiplos tamanhos    |
| better-sqlite3     | ^12.4.1   | SQLite (dependência presente, uso futuro)     |

---

## Fluxo de dados

```
Cliente (browser)
       |
       | 1. Digita mensagem ou clica em opção rápida
       v
  EatKitchenAI (src/services/ai.ts)
       |
       | 2. POST /api/chat/stream
       |    { message, history[], language }
       v
  API Handler (api/chat/stream.ts OU server/index.ts)
       |
       | 3. Valida payload (tamanho, idioma, histórico)
       | 4. Recupera GEMINI_API_KEY do ambiente
       | 5. Cria sessão de chat com system instruction + instrução de idioma
       v
  Google Gemini AI (gemini-flash-latest)
       |
       | 6. Gera resposta em streaming (Server-Sent Events)
       v
  API Handler
       |
       | 7. Faz pipe dos chunks: data: {"text":"..."}\n\n
       | 8. Finaliza com: data: [DONE]\n\n
       v
  EatKitchenAI.sendMessageStream() — AsyncGenerator
       |
       | 9. Parseia SSE, acumula texto, yielda cada chunk
       |10. Salva histórico local (user + model)
       v
  App.tsx handleSend()
       |
       |11. Cria mensagem do assistente no 1° chunk
       |12. Atualiza conteúdo da mensagem a cada chunk subsequente
       v
  MessageBubble → ReactMarkdown → DishImage
       |
       |13. Renderiza texto em Markdown
       |14. Converte tags img para componente DishImage (com WebP srcset)
       |15. Nomes numerados em negrito tornam-se clicáveis
```

---

## Componentes principais e responsabilidades

### `src/App.tsx`
Componente raiz. Gerencia todo o estado da aplicação:
- `language` — idioma atual (padrão: `pt`)
- `messages` — array de mensagens do chat
- `isLoading` — estado de carregamento
- `ai` — instância de `EatKitchenAI` (recriada ao trocar idioma)
- `selectedImage` — imagem aberta no zoom overlay
- `pendingAction` — ação pendente de confirmação (reset ou troca de idioma)
- `copiedId` — ID da mensagem copiada (para feedback visual)

Contém as constantes de UI: `LANGUAGES`, `TRANSLATIONS` (textos em 8 idiomas), `CONFIRM_TEXTS`, `getQuickOptions`.

Renderiza: cabeçalho, lista de mensagens, botões de opção rápida, input, overlay de zoom, modal de confirmação, modal de ajuda.

### `src/services/ai.ts` — classe `EatKitchenAI`
Camada de abstração da IA no frontend:
- Mantém o histórico da conversa em memória (array de `HistoryEntry`)
- Envia mensagens via `POST /api/chat/stream` com histórico completo
- Implementa `sendMessageStream()` como `AsyncGenerator<string>` que parseia SSE
- Gerencia o histórico: adiciona mensagem do usuário antes da resposta e da IA após a resposta completa; remove a mensagem do usuário se a IA não responder

### `api/chat/stream.ts` — Vercel Function (produção)
Handler serverless para produção no Vercel:
- Aceita apenas `POST`
- Valida payload: mensagem (máx 2000 chars), idioma (whitelist de 8 valores), histórico (máx 40 entradas, cada texto máx 8000 chars), corpo da requisição (máx 20 KB)
- Cria sessão Gemini com `system instruction` + instrução de idioma dinâmica
- Faz streaming da resposta via SSE (`text/event-stream`)
- Trata erros com `[ERROR]` no stream se headers já foram enviados

### `server/index.ts` — Express Server (desenvolvimento)
Servidor local equivalente ao handler de produção:
- Adiciona CORS restrito ao `ALLOWED_ORIGIN` (padrão: `http://localhost:3000`)
- Limite de 20 KB no body
- Mesma lógica de validação e streaming da Vercel Function
- Escuta na porta definida por `PORT` (padrão: 3001)

### `src/App.tsx` — `markdownComponents`
Customiza a renderização do Markdown:
- **`img`**: detecta ambiente (localhost vs produção), resolve URLs relativas de imagens para o path correto (local ou GitHub raw), suporta Dropbox (parâmetro `raw=1`), suporta vídeos do Google Drive (iframe), aplica proxy `images.weserv.nl` para imagens externas, renderiza via `DishImage`
- **`strong`**: textos em negrito com formato `"N. Nome"` (número + ponto) tornam-se clicáveis e enviam a mensagem automaticamente (seleção de prato)

### `DishImage` (componente memoizado em `App.tsx`)
Renderiza fotos dos pratos com:
- `srcset` para WebP em 3 tamanhos (400w, 800w, 1200w)
- Lazy loading
- Spinner de carregamento enquanto a imagem carrega
- Fallback visual de "Imagem Indisponível" em caso de erro
- Cursor zoom-in que abre o overlay de zoom ao clicar

### `MessageBubble` (componente memoizado em `App.tsx`)
Renderiza cada mensagem do chat com animação de entrada, avatar (User ou Bot), bolha estilizada diferente para usuário (verde) e assistente (branco), botão de copiar ao hover.

### `scripts/convert-images.mjs`
Script utilitário de pré-processamento:
- Lê todos os `.png` em `public/images/dishes/`
- Gera variantes WebP em 400px, 800px e 1200px de largura (qualidade 78)
- Salva no mesmo diretório com sufixo `-400w.webp`, `-800w.webp`, `-1200w.webp`
- Exibe relatório de redução de tamanho

---

## Variáveis de ambiente

| Variável         | Onde é usada              | Obrigatória | Descrição                                      |
|------------------|---------------------------|-------------|------------------------------------------------|
| `GEMINI_API_KEY` | `server/index.ts`, `api/chat/stream.ts` | Sim | Chave da API Google Gemini AI |
| `PORT`           | `server/index.ts`         | Não         | Porta do servidor Express local (padrão: 3001) |
| `ALLOWED_ORIGIN` | `server/index.ts`         | Não         | Origin permitida no CORS (padrão: `http://localhost:3000`) |

Em produção (Vercel), apenas `GEMINI_API_KEY` é necessária e deve ser configurada como variável de ambiente no painel da Vercel.

---

## Scripts npm disponíveis

| Script            | Comando executado                                               | Descrição                                                  |
|-------------------|-----------------------------------------------------------------|------------------------------------------------------------|
| `dev`             | `concurrently "tsx watch server/index.ts" "vite"`              | Roda API Express + Vite em paralelo com hot reload          |
| `server`          | `node --loader tsx/esm server/index.ts`                        | Roda apenas o servidor Express                             |
| `build`           | `vite build`                                                   | Gera build de produção em `dist/`                          |
| `preview`         | `vite preview`                                                 | Serve o build de produção localmente                       |
| `clean`           | `rm -rf dist`                                                  | Remove o diretório de build                                |
| `lint`            | `tsc --noEmit`                                                 | Verificação de tipos TypeScript sem gerar arquivos         |
| `convert-images`  | `node scripts/convert-images.mjs`                              | Converte imagens PNG para WebP em múltiplos tamanhos        |

---

## Configuração Vercel (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

O Vercel detecta automaticamente o handler em `api/chat/stream.ts` pela convenção de diretório `api/`, sem necessidade de configuração adicional de rotas.
