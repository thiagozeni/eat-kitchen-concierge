# EAT Kitchen AI Concierge — Decisões Técnicas

## Por que Google Gemini AI

### Escolha do modelo: `gemini-flash-latest`
O handler usa explicitamente `gemini-flash-latest` (não `gemini-pro` nem `gemini-ultra`). Isso indica uma escolha deliberada por:

- **Velocidade**: o Flash é otimizado para latência baixa, essencial para streaming em tempo real em um contexto de restaurante onde o cliente está aguardando
- **Custo**: o Flash tem custo significativamente menor por token que os modelos Pro/Ultra, adequado para um caso de uso de alto volume (múltiplos clientes simultâneos)
- **Qualidade suficiente**: para o escopo do sistema (recomendações de cardápio com regras bem definidas no system prompt), o Flash entrega qualidade adequada

### SDK `@google/genai` v1.x
O projeto usa o novo SDK `@google/genai` (não o antigo `@google-cloud/vertexai` nem a versão beta `@google/generative-ai`). A versão ^1.29.0 indica que o projeto foi atualizado para usar a API de geração unificada da Google, que suporta a interface `chats.create()` com `sendMessageStream`.

### Gemini vs alternativas
O README original menciona apenas Gemini. Não há evidência de que OpenAI ou Anthropic foram considerados. A escolha possivelmente foi feita por:
- Integração direta com o ecossistema Google
- Custo competitivo no tier Flash
- Suporte nativo a streaming com SSE via SDK

---

## Por que streaming de resposta (Server-Sent Events)

### Problema resolvido
Sem streaming, o usuário veria uma tela em branco enquanto o modelo gera toda a resposta (podendo levar 3-8 segundos para respostas longas com descrições de pratos). Com streaming, os primeiros caracteres aparecem em menos de 1 segundo.

### Implementação escolhida: SSE (Server-Sent Events)
O protocolo SSE foi escolhido sobre WebSockets por simplicidade:
- É unidirecional (servidor → cliente), o que é exatamente o que a aplicação precisa
- Funciona nativamente sobre HTTP/1.1
- Compatível com Vercel Serverless Functions sem configuração adicional
- Não requer biblioteca adicional no frontend — usa `fetch` + `ReadableStream` nativo

### Formato do protocolo
```
data: {"text":"chunk de texto"}\n\n
data: [DONE]\n\n
data: [ERROR]\n\n
```

O `[DONE]` sinaliza fim bem-sucedido; `[ERROR]` sinaliza erro durante o stream (quando headers já foram enviados, impossibilitando retornar HTTP 5xx).

### Tratamento de estado de streaming no frontend
A classe `EatKitchenAI` implementa `sendMessageStream()` como `AsyncGenerator<string>`, o que permite ao `App.tsx` consumir o stream com `for await`. O estado da mensagem no React é atualizado progressivamente: na chegada do primeiro chunk, cria a mensagem; nos chunks seguintes, substitui o conteúdo via `setMessages(prev => prev.map(...))`. Isso evita criação de múltiplas mensagens durante o stream.

---

## Por que 8 idiomas específicos

### Idiomas escolhidos
Os 8 idiomas (Português, Inglês, Espanhol, Russo, Alemão, Italiano, Chinês, Japonês) representam os principais grupos de turistas internacionais e comunidades de imigrantes no Brasil, especialmente em São Paulo onde restaurantes com esse perfil são comuns.

### Implementação: instrução dinâmica, não modelos separados
A decisão de usar um único modelo com instrução de idioma concatenada ao `SYSTEM_INSTRUCTION` é relevante:

```typescript
const languageInstruction = `\nAtenda EXCLUSIVAMENTE em ${LANGUAGE_NAMES[lang]}. Mesma personalidade e regras, apenas traduza a comunicação.`;
```

Isso significa:
- **Uma única API key e um único modelo** para todos os idiomas
- **Zero latência adicional** para troca de idioma (sem cold start de outro modelo)
- **Consistência das regras de negócio** — o mesmo system prompt de cardápio vale para todos os idiomas
- **Risco de drift**: o modelo pode ocasionalmente misturar idiomas em respostas longas, mas a instrução `EXCLUSIVAMENTE` mitiga isso

### Saudações pré-definidas no frontend
O arquivo `src/services/ai.ts` armazena as saudações para os 8 idiomas em `GREETINGS`. Isso é importante porque a saudação inicial é exibida imediatamente (sem chamada à API), tornando o tempo de carregamento percebido zero.

---

## Por que Vercel Functions para produção

### Problema arquitetural
O frontend React rodando no browser não pode fazer chamadas diretas ao Gemini AI — isso exporia a `GEMINI_API_KEY` publicamente. É necessário um servidor intermediário.

### Por que serverless (Vercel Functions) em vez de servidor dedicado
- **Zero configuração de servidor**: o arquivo `api/chat/stream.ts` é automaticamente detectado pela convenção de diretório `api/` da Vercel
- **Escala automática**: cada requisição de chat é uma invocação independente — não há estado compartilhado entre usuários
- **Custo zero no tier gratuito** para uso moderado
- **Deploy integrado ao Git**: cada push na `main` atualiza automaticamente o frontend (dist/) e a API (Vercel Function)

### Duplicação do código de validação
Uma consequência da arquitetura dual (Express para dev, Vercel Function para prod) é que o código de `validateRequest()` e o `SYSTEM_INSTRUCTION` estão duplicados em `server/index.ts` e `api/chat/stream.ts`. Isso foi aceito como trade-off para manter cada arquivo autocontido e sem dependências compartilhadas — o que evita erros de importação de módulos entre contextos de execução diferentes.

### Por que não usar apenas o Vercel Function localmente
O Vercel CLI (`vercel dev`) pode emular functions localmente, mas o projeto optou por um servidor Express separado. Isso dá mais controle sobre o comportamento local, evita dependência do CLI da Vercel no fluxo de desenvolvimento e permite usar `tsx watch` com hot reload nativo.

---

## Decisões técnicas relevantes encontradas no código

### Limite de payload e histórico
```typescript
if (bytes > 20 * 1024) { reject(new Error('Payload too large')); }
if (history.length > 40) { return { ok: false, error: 'Histórico inválido.' }; }
// cada texto no histórico limitado a 8000 chars
```
O histórico é limitado a 40 entradas e cada texto a 8000 caracteres para controlar o custo por requisição (tokens enviados ao Gemini) e evitar abusos. Como o histórico completo é enviado a cada mensagem (stateless na API), o contexto máximo é explicitamente controlado no cliente.

### Gerenciamento de histórico no frontend (stateful)
A instância `EatKitchenAI` mantém o histórico em memória no browser. Isso foi escolhido em vez de manter sessão no servidor por simplicidade e para evitar necessidade de banco de dados. O `better-sqlite3` está listado como dependência mas não é utilizado no código atual — provavelmente planejado para persistência futura.

### Detecção de ambiente para URLs de imagens
```typescript
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const GITHUB_BASE = 'https://raw.githubusercontent.com/...';
```
As imagens são referenciadas com path relativo no system prompt (`Amalfi.png`), mas o componente resolve para path local ou GitHub conforme o ambiente. Essa abordagem evita ter que manter dois system prompts diferentes para dev e produção.

### Nomes de pratos clicáveis via Markdown
O componente `strong` customizado detecta o padrão `"N. Texto"` em negrito e converte em elemento clicável que dispara `handleSend(text)`. Isso cria uma UX onde o usuário pode clicar no nome numerado do prato em vez de digitar — sem necessidade de botões separados ou estado adicional.

### Imagens WebP com srcset responsivo
```typescript
const toWebp = (size: number) => src.replace(/\.png$/i, `-${size}w.webp`);
const webpSrcSet = `${toWebp(400)} 400w, ${toWebp(800)} 800w, ${toWebp(1200)} 1200w`;
```
A derivação automática das URLs WebP a partir do nome PNG evita que o system prompt precise ser atualizado para incluir os novos nomes de arquivo. O modelo referencia apenas `.png`; o componente converte para WebP com srcset.

### CORS restrito no servidor local
```typescript
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000';
```
O CORS no servidor Express aceita apenas um origin específico, não `*`. Isso é boa prática mesmo em desenvolvimento, evitando que outras aplicações rodando localmente consumam a API.

### Confirmação antes de ações destrutivas
A função `requestAction()` verifica se `messages.length > 1` antes de executar reset ou troca de idioma. Se houver conversa em andamento, exibe modal de confirmação. Se for o estado inicial (apenas saudação), executa imediatamente. Isso evita perda acidental de contexto de conversa.
