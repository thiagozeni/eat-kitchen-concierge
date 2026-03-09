export type Language = 'pt' | 'en' | 'es' | 'ru' | 'de' | 'it' | 'zh' | 'ja';

type HistoryEntry = { role: 'user' | 'model'; parts: [{ text: string }] };

const GREETINGS: Record<Language, string> = {
  pt: "Oi! 😄 Me conta uma coisa: hoje você está buscando o quê?",
  en: "Hi! 😄 Tell me something: what are you looking for today?",
  es: "¡Hola! 😄 Cuéntame algo: ¿qué estás buscando hoy?",
  ru: "Привет! 😄 Расскажите мне: что вы ищете сегодня?",
  de: "Hallo! 😄 Sagen Sie mir: Wonach suchen Sie heute?",
  it: "Ciao! 😄 Dimmi una cosa: cosa cerchi oggi?",
  zh: "你好！😄 告诉我：你今天想找点什么？",
  ja: "こんにちは！😄 今日は何をお探しですか？"
};

export class EatKitchenAI {
  private history: HistoryEntry[];
  private language: Language;

  constructor(language: Language = 'pt') {
    this.language = language;
    this.history = [
      { role: 'model', parts: [{ text: GREETINGS[language] }] }
    ];
  }

  async *sendMessageStream(message: string): AsyncGenerator<string> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: this.history,
        language: this.language,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) throw new Error('Resposta sem corpo.');

    // Adiciona a mensagem do usuário ao histórico antes de processar a resposta
    this.history.push({ role: 'user', parts: [{ text: message }] });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]' || data === '[ERROR]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              yield parsed.text;
            }
          } catch { /* chunk incompleto, ignorar */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (assistantText) {
      this.history.push({ role: 'model', parts: [{ text: assistantText }] });
    } else {
      // Sem resposta — remove a mensagem do usuário que adicionamos
      this.history.pop();
    }
  }
}
