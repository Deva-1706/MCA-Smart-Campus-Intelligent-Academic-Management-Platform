import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Zap,
  Brain,
  Copy,
  Check,
  WifiOff,
  AlertCircle,
  MessageSquareText,
  Minimize2,
  Maximize2,
  FileText,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { SEMESTER_SUBJECTS } from '../../data/academicData';
import { authFetch } from '../../utils/authFetch';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

type ChatRole = 'academic_tutor' | 'coding_mentor' | 'exam_strategist' | 'concept_guide';
type TaskMode = 'general' | 'fast' | 'deep';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

const ROLE_OPTIONS: { id: ChatRole; label: string; subtitle: string }[] = [
  { id: 'academic_tutor', label: 'Academic Tutor', subtitle: 'Balanced MCA Semester 1 guidance' },
  { id: 'coding_mentor', label: 'Code Mentor', subtitle: 'Algorithms, Python & Big-O' },
  { id: 'exam_strategist', label: 'Exam Coach', subtitle: '2 / 5 / 10-mark structures' },
  { id: 'concept_guide', label: 'Concept Guide', subtitle: 'Intuition & fast revision' },
];

const TASK_MODES: { id: TaskMode; label: string; modelLabel: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'Standard', modelLabel: 'gemini-4-hydrogen', icon: Sparkles },
  { id: 'fast', label: 'Fast', modelLabel: 'gemini-3.1-flash-lite', icon: Zap },
  { id: 'deep', label: 'Deep Study', modelLabel: 'gemini-4-hydrogen · High', icon: Brain },
];

const QUICK_PROMPTS = [
  'Explain AVL tree rotations with a 5-mark example',
  'Prove Pigeonhole Principle for 435C1A Discrete Math',
  'Compare 3NF vs BCNF with a relational schema table',
  'Write a Python generator & trace its memory benefit',
];

const STORAGE_KEY = 'mca_gemini_chatbot_history_v1';

const formatMessageSegments = (text: string) => {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((segment, index) => {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const inner = segment.slice(3, -3);
      const firstNewline = inner.indexOf('\n');
      const lang = firstNewline > -1 ? inner.slice(0, firstNewline).trim() : '';
      const code = firstNewline > -1 ? inner.slice(firstNewline + 1) : inner;
      return (
        <div key={index} className="my-2 rounded-lg overflow-hidden border border-[#3D3835] bg-[#1E1E1E]">
          {lang && (
            <div className="px-3 py-1 bg-[#292929] text-[10px] font-mono uppercase tracking-wider text-[#F2C94C] border-b border-[#3D3835]">
              {lang}
            </div>
          )}
          <pre className="p-3 text-xs font-mono text-[#F7F5F2] overflow-x-auto leading-relaxed">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    return (
      <div key={index} className="space-y-1.5 whitespace-pre-wrap break-words leading-relaxed">
        {segment.split('\n').map((line, lineIdx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={lineIdx} className="text-xs font-extrabold uppercase tracking-wide text-[#B83232] dark:text-[#F2C94C] pt-1">
                {trimmed.replace(/^###\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={lineIdx} className="text-sm font-extrabold text-[#292929] dark:text-white pt-1">
                {trimmed.replace(/^##\s+/, '')}
              </h3>
            );
          }
          const boldParts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return (
            <p key={lineIdx} className="min-h-[0.75rem]">
              {boldParts.map((bp, bpIdx) => {
                if (bp.startsWith('**') && bp.endsWith('**')) {
                  return <strong key={bpIdx} className="font-bold">{bp.slice(2, -2)}</strong>;
                }
                if (bp.startsWith('`') && bp.endsWith('`')) {
                  return (
                    <code key={bpIdx} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
                      {bp.slice(1, -1)}
                    </code>
                  );
                }
                return <React.Fragment key={bpIdx}>{bp}</React.Fragment>;
              })}
            </p>
          );
        })}
      </div>
    );
  });
};

export const AcademicGeminiChatbot: React.FC = () => {
  const { currentUser, currentPage, setCurrentPage } = usePortal();
  const isOnline = useOnlineStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [role, setRole] = useState<ChatRole>('academic_tutor');
  const [taskMode, setTaskMode] = useState<TaskMode>('general');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore malformed storage
    }
    return [];
  });

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
      setTimeout(() => textareaRef.current?.focus(), 60);
    };
    window.addEventListener('open-academic-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-academic-chatbot', handleOpenChatbot);
  }, []);

  if (!currentUser) return null;

  const handleSend = async (overridePrompt?: string) => {
    const promptText = (overridePrompt ?? input).trim();
    if (!promptText || isLoading) return;

    if (!isOnline) {
      setErrorMsg('You are currently offline. Reconnect to chat with the Gemini Academic Tutor.');
      return;
    }

    setErrorMsg(null);
    const userMessage: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyPayload = messages.map(m => ({
      role: m.role,
      text: m.text,
    }));

    setMessages(prev => [...prev, userMessage]);
    if (!overridePrompt) setInput('');
    setIsLoading(true);

    try {
      const response = await authFetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: historyPayload,
          role,
          taskMode,
          studentContext: {
            name: currentUser.name,
            studentId: currentUser.studentId,
            currentPage,
            subjects: SEMESTER_SUBJECTS.map(s => `${s.code} ${s.name}`),
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      const modelMessage: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to reach Gemini Academic Tutor right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setErrorMsg(null);
    localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeRoleMeta = ROLE_OPTIONS.find(r => r.id === role) || ROLE_OPTIONS[0];
  const activeTaskMeta = TASK_MODES.find(t => t.id === taskMode) || TASK_MODES[0];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className={`mb-3 flex flex-col overflow-hidden rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] shadow-2xl transition-all duration-200 ${
            isExpanded
              ? 'w-[calc(100vw-2rem)] sm:w-[620px] h-[min(82vh,680px)]'
              : 'w-[calc(100vw-2rem)] sm:w-[410px] h-[min(76vh,560px)]'
          }`}
          role="dialog"
          aria-label="Gemini Academic Chatbot"
        >
          {/* Header */}
          <div className="bg-[#292929] text-white px-4 py-3 border-b border-[#3D3835] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#B83232] text-[#F2C94C] flex items-center justify-center shrink-0 border border-[#F2C94C]/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold tracking-tight truncate">
                  MCA Gemini Tutor
                </h2>
                <p className="text-[10px] font-mono text-[#F2C94C] truncate">
                  {activeRoleMeta.label} · {activeTaskMeta.modelLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage('ai-assistant');
                  setIsOpen(false);
                }}
                title="Open AI PDF Chat"
                className="px-2 py-1 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 mr-1"
              >
                <FileText className="w-3 h-3 text-[#F2C94C]" />
                <span>PDF Chat</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="New conversation"
                className="p-1.5 rounded-lg text-[#D7CCC8] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                title={isExpanded ? 'Compact view' : 'Expand chat'}
                className="hidden sm:flex p-1.5 rounded-lg text-[#D7CCC8] hover:text-white hover:bg-white/10 transition-colors"
                aria-label={isExpanded ? 'Compact chat window' : 'Expand chat window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-[#D7CCC8] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persona Role & Model Speed Strip */}
          <div className="px-3.5 py-2.5 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-b border-[#E5DFD9] dark:border-[#3D3835] space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="chatbot-role-select" className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2] shrink-0">
                Tutor Role
              </label>
              <select
                id="chatbot-role-select"
                value={role}
                onChange={e => setRole(e.target.value as ChatRole)}
                className="flex-1 max-w-[230px] text-xs font-semibold rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] text-[#292929] dark:text-[#F7F5F2] px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#B83232]"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} — {opt.subtitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              {TASK_MODES.map(mode => {
                const Icon = mode.icon;
                const active = taskMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTaskMode(mode.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                      active
                        ? 'bg-[#B83232] text-white border-[#B83232]'
                        : 'bg-white dark:bg-[#292929] text-[#795548] dark:text-[#D7CCC8] border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#B83232]/50'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${active ? 'text-[#F2C94C]' : ''}`} />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Conversation Thread */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-white dark:bg-[#292929]">
            {messages.length === 0 ? (
              <div className="py-3 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
                  <p className="text-xs font-bold text-[#292929] dark:text-white mb-1">
                    Hello, {currentUser.name.split(' ')[0]}! Ask anything across MCA Semester 1.
                  </p>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                    Multi-turn memory is active — follow up on proofs, trace algorithms step-by-step, debug SQL/Python queries, or ask for 2/5/10-mark exam structures.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
                    Suggested Study Prompts
                  </p>
                  {QUICK_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={isLoading || !isOnline}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:bg-[#EFEBE9] dark:hover:bg-[#33302E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                        isUser
                          ? 'bg-[#B83232] text-white rounded-br-sm'
                          : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] rounded-bl-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                      ) : (
                        formatMessageSegments(msg.text)
                      )}
                    </div>

                    <div className="mt-1 px-1 flex items-center gap-2 text-[10px] text-[#795548] dark:text-[#BDB7B2]">
                      <span>{msg.timestamp}</span>
                      {!isUser && msg.modelUsed && (
                        <span className="font-mono opacity-80">· {msg.modelUsed}</span>
                      )}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="inline-flex items-center gap-0.5 hover:text-[#B83232] dark:hover:text-[#F2C94C] transition-colors"
                          aria-label="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs text-[#795548] dark:text-[#F2C94C] flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#B83232] border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Thinking with {activeTaskMeta.modelLabel}...</span>
                </div>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Offline / Error Banner */}
          {(!isOnline || errorMsg) && (
            <div className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-[11px] text-rose-800 dark:text-rose-200 shrink-0">
              {!isOnline ? (
                <WifiOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">
                {!isOnline
                  ? 'Offline mode active — reconnect to continue chatting with Gemini.'
                  : errorMsg}
              </span>
            </div>
          )}

          {/* Input Composer */}
          <div className="p-3 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-t border-[#E5DFD9] dark:border-[#3D3835] shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isOnline
                    ? 'Ask a follow-up question (Enter to send)...'
                    : 'Reconnect to send messages...'
                }
                disabled={isLoading || !isOnline}
                className="flex-1 resize-none max-h-28 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] px-3 py-2 text-xs text-[#292929] dark:text-[#F7F5F2] placeholder:text-[#8C847E] focus:outline-none focus:ring-1 focus:ring-[#B83232] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || !isOnline}
                className="h-9 px-3.5 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Academic Chatbot Launcher (Student Portal Only) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#292929] hover:bg-[#1E1E1E] text-white border border-[#F2C94C]/40 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
        aria-label={isOpen ? 'Close MCA Gemini Tutor' : 'Open MCA Gemini Tutor'}
      >
        <div className="w-7 h-7 rounded-full bg-[#B83232] text-[#F2C94C] flex items-center justify-center">
          {isOpen ? <X className="w-4 h-4" /> : <MessageSquareText className="w-4 h-4" />}
        </div>
        <div className="text-left pr-1">
          <p className="text-xs font-extrabold leading-none">
            {isOpen ? 'Close Tutor' : 'Ask Gemini Tutor'}
          </p>
          <p className="text-[10px] text-[#F2C94C] font-mono leading-none mt-1">
            {messages.length > 0 ? `${messages.length} msgs` : 'Multi-turn AI'}
          </p>
        </div>
      </button>
    </div>
  );
};
