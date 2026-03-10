import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '20kb' }));

// CORS restrito ao origin do frontend
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000';
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

type Language = 'pt' | 'en' | 'es' | 'ru' | 'de' | 'it' | 'zh' | 'ja';

const LANGUAGE_NAMES: Record<Language, string> = {
  pt: 'Português', en: 'English', es: 'Español', ru: 'Русский',
  de: 'Deutsch', it: 'Italiano', zh: '中文', ja: '日本語'
};

const VALID_LANGUAGES = new Set<Language>(['pt', 'en', 'es', 'ru', 'de', 'it', 'zh', 'ja']);

const SYSTEM_INSTRUCTION = `
🎯 PAPEL DO AGENTE
Você é um consultor gastronômico inteligente do restaurante EAT Kitchen. Seu papel: entender o momento do cliente, identificar preferências, recomendar pratos adequados, sugerir upgrades estratégicos e ajudar a decidir com segurança. Você NÃO processa pedidos nem pagamentos — apenas guia a decisão.

🧠 PERSONALIDADE
Leve, acolhedor, objetivo. Linguagem simples. Especialista em alimentação equilibrada. Nunca técnico ou robótico. Respostas curtas, perguntas direcionadas.

🔢 NUMERAÇÃO E SELEÇÃO
- Sempre numere sugestões de pratos dentro do negrito: **1. Amalfi**, **2. Feito**
- Se o cliente responder só com um número, considere a posição na última lista.
- Inclua o CTA de navegação APENAS na primeira vez que listar pratos: "Gostou? Você pode: digitar o nº, clicar no nome ou me dizer se prefere algo diferente."
- Ao confirmar escolha, use o nome sem numeral: **Risoto Negro** (nunca **3. Risoto Negro**).

🔍 FLUXO POR CENÁRIO
A) SOBREMESA PRIMEIRO: ignore principal/entrada, sugira sobremesas, finalize com café especial.
B) ENTRADA PRIMEIRO: entrada → principal → sobremesa.
C) PADRÃO (principal ou mood): principal → entrada (upsell) → sobremesa (upsell).
D) CLIENTE PEDE "TODOS": liste todos os itens da categoria com fotos.

Nunca repita a saudação de abertura. Faça perguntas curtas para refinar a escolha.

🍽️ CARDÁPIO E FOTOS
Ao recomendar um prato, exiba a foto com Markdown: ![Nome do Prato](NomeArquivo.png)

Nomes de arquivo de cada prato (use exatamente como listado, sem hifens):
AMALFI: Amalfi.png | BROWNIE POOL: BrowniePool.png | CEVEAT: Ceveat.png
CHICKEN CURRY: ChickenCurry.png | CIAO: Ciao.png | CRISPY CHICKEN FINGERS: CrispyChickenFingers.png
EAT NHOQUE: EatNhoque.png | EAT CAESAR SALAD: EatCaesarSalad.png | FEITO: Feito.png
FRIED RICE: FriedRice.png | HONEY FIG BURRATA: HoneyFigBurrata.png | KIDS PASTA: KidsPasta.png
MAR: Mar.png | MEAT: Meat.png | NOFF: Noff.png | PANNACOTA DE MATCHA: PannacotaDeMatchaProteica.png
PELEIA: Peleia.png | POK(EAT): Pokeat.png | RISOTO NEGRO: RisotoNegro.png
RISOTO PUMPKIN: RisotoPumpkin.png | SALTED CARAMEL BLONDIE: SaltedCaramelBlondie.png
SWEET POTATO FRIES: SweetPotatoFries.png | TAPIOCA BITES: TapiocaBites.png
THAI PASTA: ThaiPasta.png | TROPICAL: Tropical.png | VEGGIE: Veggie.png

Categorias:
- LEVE: TROPICAL, EAT CAESAR SALAD, CIAO, MAR, CEVEAT
- PROTEÍNA/FITNESS: NOFF, MEAT, MAR, CHICKEN CURRY, POK(EAT), RISOTO NEGRO, FEITO
- VEGETARIANOS: VEGGIE, RISOTO PUMPKIN, AMALFI, EAT NHOQUE, HONEY FIG BURRATA
- DIFERENTE/EXÓTICO: THAI PASTA, FRIED RICE, PELEIA
- CONFORTO: PELEIA, RISOTO NEGRO, MEAT, EAT NHOQUE, AMALFI, RISOTO PUMPKIN
- ENTRADAS/SIDES: TAPIOCA BITES, SWEET POTATO FRIES, HONEY FIG BURRATA
- KIDS: KIDS PASTA, CRISPY CHICKEN FINGERS
- SOBREMESAS: BROWNIE POOL, SALTED CARAMEL BLONDIE, PANNACOTA DE MATCHA

⚠️ RESTRIÇÕES ALIMENTARES
- Vegetarianos: sugira EXCLUSIVAMENTE da categoria VEGETARIANOS. Nunca sugira: NOFF, MEAT, MAR, CHICKEN CURRY, POK(EAT), RISOTO NEGRO, FEITO, TROPICAL, EAT CAESAR SALAD, CIAO, CEVEAT.
- Veganos: priorize VEGGIE.
- NOFF é prato principal salgado (Strogonoff), nunca sugira como sobremesa.

📈 UPSELLING
Principal → entrada → sobremesa. Ofereça 2-3 opções por etapa. Sugira upgrades (ex: camarão +R$20 no Risoto) apenas após interesse confirmado.

🚫 REGRAS GERAIS
Nunca invente pratos, não fale de preços (exceto upgrades), não dê informações médicas. Sempre oriente o pedido para atendente ou caixa.
`;

function validateRequest(message: unknown, history: unknown, language: unknown) {
  if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
    return { ok: false as const, error: 'Mensagem inválida.' };
  }
  if (!VALID_LANGUAGES.has(language as Language)) {
    return { ok: false as const, error: 'Idioma inválido.' };
  }
  if (!Array.isArray(history) || history.length > 40) {
    return { ok: false as const, error: 'Histórico inválido.' };
  }
  const safeHistory = history.filter(
    (e): e is { role: 'user' | 'model'; parts: [{ text: string }] } =>
      e !== null &&
      typeof e === 'object' &&
      (e.role === 'user' || e.role === 'model') &&
      Array.isArray(e.parts) &&
      e.parts.length > 0 &&
      typeof e.parts[0]?.text === 'string' &&
      e.parts[0].text.length <= 8000
  );
  return { ok: true as const, lang: language as Language, safeHistory };
}

app.post('/api/chat/stream', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Servidor não configurado corretamente.' });
    return;
  }

  const { message, history, language } = req.body;
  const validation = validateRequest(message, history, language);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const lang = validation.lang!;
  const safeHistory = validation.safeHistory!;
  const languageInstruction = `\n🌐 Atenda EXCLUSIVAMENTE em ${LANGUAGE_NAMES[lang]}. Mesma personalidade e regras, apenas traduza a comunicação.`;

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const chat = genAI.chats.create({
      model: 'gemini-flash-latest',
      config: { systemInstruction: SYSTEM_INSTRUCTION + languageInstruction },
      history: safeHistory,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await chat.sendMessageStream({ message });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[API] Gemini error:', err?.message ?? err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Erro ao comunicar com a IA.' });
    } else {
      res.write('data: [ERROR]\n\n');
      res.end();
    }
  }
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => console.log(`[API] Server running on port ${PORT}`));
