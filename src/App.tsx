import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  Bot, 
  UtensilsCrossed, 
  Leaf, 
  Dumbbell, 
  Heart, 
  Sparkles, 
  Clock, 
  IceCream,
  ChevronRight,
  X,
  Copy,
  Check,
  ArrowDown,
  Info,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EatKitchenAI, type Language } from './services/ai';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
] as const;

const TRANSLATIONS = {
  pt: {
    greeting: 'Oi! 😄 Me conta uma coisa: hoje você está buscando o quê?',
    placeholder: 'Digite sua mensagem...',
    reset: 'Reiniciar conversa',
    footer: 'P E S S O A S .  C O M I D A .  V E R D A D E',
    options: {
      light: 'Algo mais leve',
      protein: 'Algo bem proteico',
      veggie: 'Algo vegetariano',
      comfort: 'Conforto',
      different: 'Algo diferente',
      hungry: 'Muita fome',
      fast: 'Algo rápido',
      dessert: 'Quero sobremesa 😅'
    }
  },
  en: {
    greeting: 'Hi! 😄 Tell me something: what are you looking for today?',
    placeholder: 'Type your message...',
    reset: 'Reset conversation',
    footer: 'P E S S O A S .  C O M I D A .  V E R D A D E',
    options: {
      light: 'Something light',
      protein: 'High protein',
      veggie: 'Vegetarian',
      comfort: 'Comfort food',
      different: 'Something different',
      hungry: 'Very hungry',
      fast: 'Something fast',
      dessert: 'I want dessert 😅'
    }
  },
  es: {
    greeting: '¡Hola! 😄 Cuéntame algo: ¿qué estás buscando hoy?',
    placeholder: 'Escribe tu mensaje...',
    reset: 'Reiniciar conversación',
    footer: 'P E S S O A S .  C O M I D A .  V E R D A D E',
    options: {
      light: 'Algo más ligero',
      protein: 'Algo proteico',
      veggie: 'Algo vegetariano',
      comfort: 'Comida reconfortante',
      different: 'Algo diferente',
      hungry: 'Mucha hambre',
      fast: 'Algo rápido',
      dessert: 'Quiero postre 😅'
    }
  },
  ru: {
    greeting: 'Привет! 😄 Расскажите мне: что вы ищете сегодня?',
    placeholder: 'Введите сообщение...',
    reset: 'Сбросить чат',
    footer: 'P E S S O A S .  C O M I D A .  V E R D A D E',
    options: {
      light: 'Что-то легкое',
      protein: 'Много белка',
      veggie: 'Вегетарианское',
      comfort: 'Уютная еда',
      different: 'Что-то необычное',
      hungry: 'Сильный голод',
      fast: 'Что-то быстрое',
      dessert: 'Хочу десерт 😅'
    }
  }
};

const getQuickOptions = (lang: Language) => [
  { label: TRANSLATIONS[lang].options.light, icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  { label: TRANSLATIONS[lang].options.protein, icon: Dumbbell, color: 'text-blue-600 bg-blue-50' },
  { label: TRANSLATIONS[lang].options.veggie, icon: Heart, color: 'text-rose-600 bg-rose-50' },
  { label: TRANSLATIONS[lang].options.comfort, icon: UtensilsCrossed, color: 'text-amber-600 bg-amber-50' },
  { label: TRANSLATIONS[lang].options.different, icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  { label: TRANSLATIONS[lang].options.hungry, icon: UtensilsCrossed, color: 'text-orange-600 bg-orange-50' },
  { label: TRANSLATIONS[lang].options.fast, icon: Clock, color: 'text-slate-600 bg-slate-50' },
  { label: TRANSLATIONS[lang].options.dessert, icon: IceCream, color: 'text-pink-600 bg-pink-50' },
];

interface DishImageProps {
  src: string;
  alt?: string;
  title?: string;
  onClick: (src: string) => void;
}

const DishImage = React.memo(({ src, alt, title, onClick }: DishImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className="flex w-full aspect-video bg-slate-100 items-center justify-center text-slate-400 rounded-xl my-4 border border-black/5">
        <span className="flex flex-col items-center">
          <UtensilsCrossed size={24} className="mb-2 opacity-50" />
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Imagem Indisponível</span>
        </span>
      </span>
    );
  }

  return (
    <span className="block relative group/img my-4 bg-slate-50 rounded-xl overflow-hidden border border-black/5">
      <img 
        alt={alt}
        title={title}
        src={src}
        referrerPolicy="no-referrer" 
        className={cn(
          "w-full aspect-video object-cover rounded-xl shadow-sm hover:shadow-md transition-opacity duration-500 cursor-zoom-in",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
        onClick={() => onClick(src)}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </span>
      )}
    </span>
  );
});

DishImage.displayName = 'DishImage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [language, setLanguage] = useState<Language>('pt');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ai, setAi] = useState<EatKitchenAI | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const markdownComponents = React.useMemo(() => ({
    img: ({ node, ...props }: any) => {
      let src = props.src || '';
      const isDropbox = src.includes('dropbox.com');
      const isVideo = src.includes('drive.google.com') || src.endsWith('.mp4') || src.endsWith('.mov');
      
      if (isDropbox) {
        if (src.includes('dl=0')) {
          src = src.replace('dl=0', 'raw=1');
        } else if (!src.includes('raw=1')) {
          src += (src.includes('?') ? '&' : '?') + 'raw=1';
        }
      }

      if (!isVideo && src.startsWith('http') && !isDropbox) {
        src = `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=800&q=80&output=webp&il`;
      }

      if (isVideo) {
        let videoSrc = src;
        if (videoSrc.includes('drive.google.com') && videoSrc.includes('/file/d/')) {
          const id = videoSrc.split('/file/d/')[1].split('/')[0];
          videoSrc = `https://drive.google.com/file/d/${id}/preview`;
        } else if (videoSrc.includes('drive.google.com') && videoSrc.includes('id=')) {
          const id = new URLSearchParams(videoSrc.split('?')[1]).get('id');
          videoSrc = `https://drive.google.com/file/d/${id}/preview`;
        }

        return (
          <span className="block relative w-full aspect-video rounded-xl overflow-hidden shadow-sm my-4 bg-black">
            <iframe
              src={videoSrc}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={props.alt || 'Video do prato'}
            />
          </span>
        );
      }

      return (
        <DishImage 
          src={src} 
          alt={props.alt} 
          title={props.title} 
          onClick={(s) => setSelectedImage(s)} 
        />
      );
    }
  }), []);

  useEffect(() => {
    document.title = "EAT+KITCHEN AI Concierge";
  }, []);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    };

    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const eatAi = new EatKitchenAI(apiKey, language);
      setAi(eatAi);
      
      // Initial greeting
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: t.greeting
        }
      ]);
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !ai || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.sendMessage(text);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Desculpe, tive um probleminha. Pode repetir?'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Ops! Tive um erro de conexão. Vamos tentar de novo?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      setAi(new EatKitchenAI(apiKey, language));
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: t.greeting
        }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-black/5 z-50 flex items-center justify-between px-6 lg:px-12">
        <div 
          onClick={resetChat}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          title={t.reset}
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
            <UtensilsCrossed size={20} />
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-xl font-semibold tracking-tight leading-none">EAT+KITCHEN</h1>
            <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-widest mt-0.5">AI Concierge</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-black/5 p-1 rounded-lg">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "px-2 py-1 rounded-md text-sm transition-all",
                  language === lang.code 
                    ? "bg-white shadow-sm text-emerald-600 font-bold" 
                    : "text-slate-400 hover:text-slate-600"
                )}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
          
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="sm:hidden bg-black/5 border-none rounded-lg text-xs font-bold p-2 focus:ring-0"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.flag} {lang.code.toUpperCase()}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            title="Sobre o Concierge"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={scrollContainerRef}
        className="pt-24 pb-32 max-w-3xl mx-auto px-4 h-screen overflow-y-auto scroll-smooth flex flex-col"
      >
        <div className="flex-1 space-y-8 py-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm relative group/msg-box",
                  msg.role === 'user' 
                    ? "bg-emerald-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 rounded-tl-none border border-black/5"
                )}>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="absolute -right-10 top-0 p-2 text-slate-400 hover:text-emerald-600 opacity-0 group-hover/msg-box:opacity-100 transition-opacity"
                      title="Copiar recomendação"
                    >
                      {copiedId === msg.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  )}
                  <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-md prose-img:my-4">
                    <Markdown components={markdownComponents}>
                      {msg.content}
                    </Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
                <Bot size={16} />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-black/5 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="fixed bottom-28 right-6 sm:right-12 p-3 bg-white border border-black/5 shadow-xl rounded-full text-emerald-600 hover:bg-emerald-50 transition-all z-40"
            >
              <ArrowDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Quick Options - Only show if it's the start or assistant just asked */}
        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8"
          >
            {getQuickOptions(language).map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleSend(opt.label)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border border-black/5 bg-white hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group",
                  opt.color
                )}
              >
                <opt.icon size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f5f2ed] via-[#f5f2ed] to-transparent z-40">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.placeholder}
              className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 pr-16 shadow-xl shadow-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 uppercase tracking-widest font-medium">
            {t.footer}
          </p>
        </div>
      </div>

      {/* Image Zoom Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X size={24} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage}
              alt="Zoomed"
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white max-w-md w-full rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-emerald-600 p-8 text-white relative">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Bot size={28} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">EAT+KITCHEN AI</h2>
                <p className="text-emerald-100 text-sm mt-1">Seu consultor gastronômico inteligente</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Recomendações Personalizadas</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">O AI Concierge entende seu momento e sugere o prato perfeito baseado no seu objetivo nutricional.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Leaf size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Foco em Saúde</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">Especialista em alimentação equilibrada, respeitando suas restrições e preferências.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <UtensilsCrossed size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Experiência Visual</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">Veja fotos reais dos pratos diretamente na conversa para ajudar na sua decisão.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                  >
                    Entendi, vamos lá!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
