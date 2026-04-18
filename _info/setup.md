# EAT Kitchen AI Concierge — Setup e Deploy

## Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior (vem junto com Node.js)
- **Chave de API do Google Gemini**: obtida em [aistudio.google.com](https://aistudio.google.com)
- **Git** para clonar o repositório

---

## Instalação e execução local

### 1. Clonar o repositório

```bash
git clone https://github.com/thiagozeni/eat-kitchen-concierge.git
cd eat-kitchen-concierge
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
```

Variáveis opcionais (com valores padrão):
```env
# ALLOWED_ORIGIN=http://localhost:3000   # padrão: http://localhost:3000
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Esse comando roda dois processos em paralelo (via `concurrently`):
- **API Express** — `server/index.ts` com hot reload via `tsx watch` (porta 3001)
- **Vite dev server** — React frontend com HMR (porta 3000)

Acesse em: `http://localhost:3000`

O frontend faz requisições para `/api/chat/stream`. Em desenvolvimento, o Vite proxia essa rota para `http://localhost:3001` (verifique a configuração de proxy no `vite.config.ts` se necessário).

### 5. (Opcional) Rodar apenas o servidor da API

```bash
npm run server
```

---

## Configuração das variáveis de ambiente

| Variável         | Obrigatória | Padrão                   | Descrição                                               |
|------------------|-------------|--------------------------|----------------------------------------------------------|
| `GEMINI_API_KEY` | Sim         | —                        | Chave da API Google Gemini AI (nunca commitar no código) |
| `PORT`           | Não         | `3001`                   | Porta do servidor Express (apenas para dev local)       |
| `ALLOWED_ORIGIN` | Não         | `http://localhost:3000`  | Origin permitida no CORS (apenas para dev local)        |

**Segurança**: O arquivo `.env` deve estar no `.gitignore`. Nunca commite credenciais. Em produção, use as variáveis de ambiente da plataforma (ex: painel da Vercel).

---

## Como converter imagens de pratos

As imagens dos pratos devem estar em `public/images/dishes/` como arquivos `.png`. O script gera variantes WebP otimizadas para uso com `srcset`.

### 1. Garantir que o sharp está instalado

```bash
npm install
# sharp já está listado como devDependency
```

### 2. Colocar os PNGs na pasta correta

```
public/
  images/
    dishes/
      Amalfi.png
      BrowniePool.png
      Ceveat.png
      ... (todos os pratos)
```

Os nomes devem ser exatamente os listados no `SYSTEM_INSTRUCTION` (sem hifens, PascalCase).

### 3. Executar a conversão

```bash
npm run convert-images
```

O script gera para cada `Nome.png`:
- `Nome-400w.webp` — 400px de largura, qualidade 78
- `Nome-800w.webp` — 800px de largura, qualidade 78
- `Nome-1200w.webp` — 1200px de largura, qualidade 78

O relatório final exibe o tamanho original, tamanho WebP e percentual de redução.

**Atenção**: o script não exclui os arquivos PNG originais. Eles ainda são necessários pois o `SYSTEM_INSTRUCTION` referencia os arquivos `.png` e o componente `DishImage` deriva as URLs WebP a partir do nome PNG.

---

## Deploy no Vercel

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Repositório no GitHub conectado à conta Vercel
- Chave `GEMINI_API_KEY` disponível

### 1. Conectar o repositório

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `eat-kitchen-concierge` do GitHub
3. O Vercel detecta automaticamente o framework Vite

### 2. Configurar variáveis de ambiente no Vercel

No painel do projeto, vá em **Settings > Environment Variables** e adicione:

| Nome             | Valor              | Ambientes            |
|------------------|--------------------|----------------------|
| `GEMINI_API_KEY` | `sua_chave_aqui`   | Production, Preview  |

### 3. Configurações de build

O arquivo `vercel.json` já está configurado:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

O Vercel detecta o arquivo `api/chat/stream.ts` automaticamente pela convenção de diretório `api/` e o implanta como uma **Serverless Function**. Nenhuma configuração adicional de rotas é necessária.

### 4. Deploy

Qualquer push para a branch `main` dispara um deploy automático. Para deploy manual:

```bash
npx vercel --prod
```

### 5. Imagens em produção

Em produção, as imagens dos pratos são servidas diretamente do GitHub via:

```
https://raw.githubusercontent.com/thiagozeni/eat-kitchen-concierge/refs/heads/main/public/images/dishes/
```

Isso significa que os arquivos WebP gerados por `convert-images` precisam estar commitados no repositório para que apareçam em produção. Certifique-se de commitar os arquivos da pasta `public/images/dishes/` (tanto os `.png` quanto os `.webp`).

---

## Verificação de tipos

Para checar erros de TypeScript sem gerar build:

```bash
npm run lint
```

---

## Build de produção local

Para testar o build antes do deploy:

```bash
npm run build   # gera em dist/
npm run preview # serve em http://localhost:4173
```

**Atenção**: No `preview`, a API Express não está rodando. As chamadas para `/api/chat/stream` falharão a menos que você também tenha o servidor rodando (`npm run server`) e o Vite esteja configurado com proxy.
