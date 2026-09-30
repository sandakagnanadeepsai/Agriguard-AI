import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Volume2, 
  Leaf, 
  CheckCircle2, 
  RotateCcw, 
  User,
  MessageSquare
} from 'lucide-react';
import { DiagnosticResult, SupportedLanguage } from '../types';
import { speakText, stopSpeaking } from '../services/tts';

interface FarmerAdvisoryBotProps {
  diagnosisContext: DiagnosticResult | null;
  selectedLang: SupportedLanguage;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
}

export const FarmerAdvisoryBot: React.FC<FarmerAdvisoryBotProps> = ({
  diagnosisContext,
  selectedLang,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: diagnosisContext
        ? `Hello! I am your AgriGuard AI Agronomist. I see your ${diagnosisContext.cropName} is diagnosed with ${diagnosisContext.diseaseName} (${diagnosisContext.severityLevel} severity). How can I assist you with preparing remedies, application timing, or crop safety?`
        : `Hello farmer! I am your AgriGuard AI Agronomist. Ask me any questions about crop diseases, organic remedies (neem oil, wood ash, compost tea), or chemical dosages.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const QUICK_QUESTIONS = diagnosisContext ? [
    `How do I prepare the organic remedy for ${diagnosisContext.cropName}?`,
    `What time of day should I spray this remedy?`,
    `Is this disease contagious to neighboring crops?`,
    `What safety equipment do I need when spraying?`,
  ] : [
    'How do I make organic neem oil spray?',
    'What is the best way to prevent Early Blight in tomatoes?',
    'How does wood ash protect maize from fungal rust?',
    'How can I spot Late Blight before it destroys potatoes?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/advisory-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          diagnosisContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply || 'Ensure proper crop spacing and apply protective spray at sunrise.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: 'For optimal results, spray organic remedies (like 5% neem extract or copper soap) early in the morning when leaves are dry. Avoid overhead watering and prune off diseased leaves immediately.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = (text: string) => {
    speakText({
      text,
      langCode: selectedLang.code,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              Agronomy LLM Assistant
            </span>
            <span className="text-xs text-stone-400 font-medium">Gemini 3.7 Flash Grounded Guidance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
            AI Farmer Advisory & Remedy Copilot
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
            Ask practical agronomy questions, recipe preparation steps, or weather-dependent spraying timings.
          </p>
        </div>

        {diagnosisContext && (
          <div className="bg-black/50 border border-white/10 p-3.5 rounded-2xl text-xs space-y-1 self-start sm:self-center backdrop-blur-md shadow-inner">
            <p className="text-[10px] uppercase font-black tracking-wider text-lime-400">Current Context</p>
            <p className="font-bold text-white text-sm">{diagnosisContext.cropName}: {diagnosisContext.diseaseName}</p>
            <p className="text-[11px] text-stone-400 font-medium">Severity: <span className="text-amber-300 font-bold">{diagnosisContext.severityLevel}</span></p>
          </div>
        )}
      </div>

      {/* Main Chat Box */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col h-[540px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-black/20">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-500 text-[#0a120a] flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-lg shadow-lime-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isBot
                      ? 'bg-white/10 border border-white/10 text-stone-100 rounded-tl-sm backdrop-blur-md'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-sm shadow-emerald-950/40'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {isBot && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => handleSpeak(msg.text)}
                        className="text-[11px] text-lime-400 hover:text-lime-300 font-bold flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen ({selectedLang.nativeName.split(' ')[0]})</span>
                      </button>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
                {!isBot && (
                  <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 text-stone-200 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-500 text-[#0a120a] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm p-3.5 text-xs text-stone-300 flex items-center gap-2.5 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="font-medium text-lime-300">Agronomist is formulating advisory response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 shrink-0 px-1">Suggested:</span>
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-lime-400/20 hover:text-lime-300 hover:border-lime-400/40 border border-white/10 text-stone-300 text-xs font-medium whitespace-nowrap transition-all cursor-pointer shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-black/50 border-t border-white/10 flex items-center gap-3">
          <input
            type="text"
            placeholder={`Ask AgriGuard Agronomist in ${selectedLang.name}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-lime-400 transition-colors"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className={`p-3 rounded-2xl font-bold transition-all ${
              !inputMessage.trim() || isTyping
                ? 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
                : 'bg-lime-400 hover:bg-lime-300 text-[#0a120a] shadow-lg shadow-lime-500/20 cursor-pointer active:scale-95'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
