/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, Bot, Sparkles, Trash2, ArrowDownCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Initializing the AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  // Focus input on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const model = "gemini-3-flash-preview";
      const contents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: userMessage.content }]
      });

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: "You are a helpful and clever AI assistant. Respond in the same language as the user. Use markdown formatting for clarity (bold, lists, code blocks). Keep responses concise and insightful.",
        }
      });

      const aiText = response.text || "Sorry, I couldn't generate a response.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError("Failed to connect to AI. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    if (messages.length > 0 && window.confirm("Начать новый чат?")) {
      setMessages([]);
      setError(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#050508] text-slate-200 font-sans overflow-hidden relative">
      {/* Background Atmosphere */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none animate-pulse delay-1000"></div>

      {/* Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex-col z-20 transition-all shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Bot size={20} className="text-white fill-white/10" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Aura AI</h1>
          </div>
          
          <button 
            onClick={startNewChat}
            className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all group flex items-center justify-center gap-2 mb-8"
          >
            <Sparkles size={16} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            Новый чат
          </button>

          <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">RECENT ACTIVITY</p>
            {messages.length > 0 ? (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></span>
                Текущий сеанс
              </div>
            ) : (
              <p className="px-2 text-xs text-slate-600 font-medium">Нет недавних чатов</p>
            )}
            <div className="p-3 rounded-lg text-slate-500 text-sm hover:bg-white/5 cursor-not-allowed transition-colors">Анализ данных</div>
            <div className="p-3 rounded-lg text-slate-500 text-sm hover:bg-white/5 cursor-not-allowed transition-colors">Идеи для блога</div>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20">
            <p className="text-[10px] font-bold text-purple-400 uppercase mb-1 tracking-wider">PREMIUM ACCESS</p>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">API не требуется. Модель Gemini 3 Flash активна.</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-6 md:px-8 flex items-center justify-between bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs md:text-sm font-semibold tracking-wide text-slate-400 uppercase">Система готова</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-2 transition-colors hover:bg-white/5 rounded-lg text-slate-400 cursor-pointer md:hidden" onClick={startNewChat}>
              <Trash2 size={18} />
            </div>
            <div className="w-9 h-9 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center shadow-inner overflow-hidden">
              <User size={20} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Message Display Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto w-full">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-20 mt-12"
              >
                <div className="w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-blue-600/10 rounded-3xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl relative group">
                  <div className="absolute inset-0 bg-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  <Sparkles size={48} className="text-purple-400 relative z-10 animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight text-white">How can I help you?</h2>
                <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
                  Ask me anything. I'm a free AI assistant ready to brainstorm, write, or solve problems with you.
                </p>
              </motion.div>
            )}

            <div className="space-y-10 pb-12">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    layout
                    className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shrink-0 items-center justify-center shadow-lg shadow-purple-500/20">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}
                    
                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-4 rounded-2xl transition-all duration-300 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-slate-800/80 border border-white/5 text-slate-100 rounded-tr-none' 
                          : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none hover:bg-white/[0.08] backdrop-blur-sm'
                      }`}>
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5 prose-highlight:bg-blue-500/20">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 mt-2 px-1 font-bold uppercase tracking-tighter opacity-60">
                        {msg.role === 'user' ? 'Вы' : 'Aura AI'} · {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
                  <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 shrink-0 items-center justify-center border border-white/5">
                    <Loader2 className="animate-spin text-purple-400" size={18} />
                  </div>
                  <div className="px-6 py-5 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce shadow-[0_0_5px_rgba(168,85,247,0.5)]" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce shadow-[0_0_5px_rgba(59,130,246,0.5)]" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce shadow-[0_0_5px_rgba(168,85,247,0.5)]" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-300 text-xs text-center font-medium"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Input Bar Section */}
        <footer className="p-6 md:p-8">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative bg-[#0d0d12] border border-white/10 rounded-2xl flex items-end p-2 pr-3 focus-within:border-purple-500/30 transition-all backdrop-blur-xl shadow-2xl">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Спросите о чем угодно..."
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-200 placeholder:text-slate-600 py-3.5 px-4 resize-none min-h-[52px] max-h-[220px] text-sm leading-relaxed"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`mb-1 p-2.5 rounded-xl transition-all shadow-lg ${
                    input.trim() && !isLoading
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 active:scale-95 shadow-purple-500/20'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowDownCircle size={20} className="-rotate-90" />}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-2 md:px-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold">
                Powered by NeuralCore V3 · No Data Tracking
              </p>
              <div className="flex gap-4">
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/10 font-bold tracking-widest uppercase">Free</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/10 font-bold tracking-widest uppercase">Local Engine</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

