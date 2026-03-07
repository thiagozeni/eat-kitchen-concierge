# EAT Kitchen AI Concierge 🍽️🤖

Um consultor gastronômico inteligente desenvolvido com React, Vite e Gemini AI para o restaurante EAT Kitchen.

## 🚀 Funcionalidades

- **Recomendações Inteligentes**: Sugestões de pratos baseadas no mood e objetivos nutricionais do cliente.
- **Visualização de Pratos**: Exibição de fotos reais dos pratos diretamente no chat.
- **Multilíngue**: Suporte para Português, Inglês, Espanhol e Russo.
- **Interface Moderna**: Design responsivo, animações suaves e modo de zoom em imagens.
- **UX Otimizada**: Botão de cópia de recomendação e rolagem inteligente.

## 🛠️ Tecnologias

- **Frontend**: React 19, Vite, Tailwind CSS 4.
- **Animações**: Motion (Framer Motion).
- **Ícones**: Lucide React.
- **IA**: Google Gemini AI (SDK `@google/genai`).
- **Markdown**: React Markdown.

## 📦 Como rodar localmente

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/eat-kitchen-ai-concierge.git
   cd eat-kitchen-ai-concierge
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Crie um arquivo `.env` na raiz do projeto e adicione sua chave da API do Gemini:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

5. **Acesse no navegador**:
   `http://localhost:3000`

## 🌐 Publicação no GitHub Pages

Para publicar este projeto no GitHub Pages:

1. Instale o pacote `gh-pages`:
   ```bash
   npm install gh-pages --save-dev
   ```

2. Adicione a propriedade `base` no seu `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/nome-do-repositorio/',
     // ... outras configs
   })
   ```

3. Adicione os scripts de deploy no `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Execute o deploy:
   ```bash
   npm run deploy
   ```

## 📄 Licença

Este projeto está sob a licença MIT.
