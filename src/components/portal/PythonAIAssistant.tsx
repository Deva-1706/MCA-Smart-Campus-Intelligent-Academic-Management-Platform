import React, { useState, useRef, useEffect } from 'react';
import { authFetch } from '../../utils/authFetch';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  Code2,
  Bug,
  Zap,
  TestTube,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ArrowDown
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PythonAIAssistantProps {
  currentCode: string;
  onApplyCode: (newCode: string) => void;
  problemTitle: string;
  problemDescription: string;
  consoleOutput: string;
}

export const PythonAIAssistant: React.FC<PythonAIAssistantProps> = ({
  currentCode,
  onApplyCode,
  problemTitle,
  problemDescription,
  consoleOutput,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [appliedCodeId, setAppliedCodeId] = useState<string | null>(null);

  const initialWelcomeMessage: ChatMessage = {
    id: 'msg-welcome',
    role: 'assistant',
    content: `Hello! I'm your **MCA Python Code Mentor**, powered by **Gemini 3.8 Flash**.

I'm linked directly to your active **solution.py** editor for **"${problemTitle}"**. 

How can I help you?
- Tap **"Debug Current Code"** to locate runtime bugs or logic flaws.
- Ask for **Big-O complexity optimization** or step-by-step logic explanations.
- When I provide a code solution, you can click **"Apply to Editor"** to update your code immediately!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Listen for open-ai-mentor triggers from editor toolbar
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('open-ai-mentor', handleOpen);
    return () => window.removeEventListener('open-ai-mentor', handleOpen);
  }, []);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send conversation to backend proxy route
      const response = await authFetch('/api/python-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          code: currentCode,
          problemTitle,
          problemDescription,
          consoleOutput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error');
      }

      const assistantMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Debugging Notice:** ${err.message || 'Unable to connect to the Gemini service. Please verify your connection or Secrets panel.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([initialWelcomeMessage]);
  };

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleApplyToEditor = (codeText: string, id: string) => {
    onApplyCode(codeText);
    setAppliedCodeId(id);
    setTimeout(() => setAppliedCodeId(null), 2000);
  };

  // Helper to parse markdown-like code blocks inside assistant messages
  const renderMessageContent = (content: string, msgId: string) => {
    const codeBlockRegex = /```(?:python)?\s*([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-line leading-relaxed">
            {textBefore}
          </div>
        );
      }

      const extractedCode = match[1].trim();
      const codeId = `${msgId}-code-${blockIndex++}`;

      parts.push(
        <div
          key={codeId}
          className="my-3 rounded-xl border border-stone-800 bg-[#1A1A1A] overflow-hidden text-xs font-mono shadow-xs"
        >
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-stone-800 text-[11px] text-stone-300">
            <span className="flex items-center gap-1.5 text-[#F2C94C] font-semibold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Python Suggestion</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyCode(extractedCode, codeId)}
                className="px-2 py-0.5 rounded bg-stone-700/80 hover:bg-stone-600 text-stone-200 flex items-center gap-1 transition-colors"
                title="Copy code to clipboard"
              >
                {copiedCodeId === codeId ? (
                  <>
                    <Check className="w-3 h-3 text-[#F2C94C]" />
                    <span className="text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleApplyToEditor(extractedCode, codeId)}
                className="px-2.5 py-0.5 rounded bg-[#B83232] hover:bg-[#9E2A2A] text-white font-medium flex items-center gap-1 transition-colors shadow-xs"
                title="Insert directly into your solution.py editor"
              >
                {appliedCodeId === codeId ? (
                  <>
                    <Check className="w-3 h-3 text-white" />
                    <span className="text-[10px]">Applied!</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3" />
                    <span className="text-[10px]">Apply to Editor</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="p-3 text-stone-100 overflow-x-auto text-[11px] leading-relaxed selection:bg-[#B83232] selection:text-white">
            {extractedCode}
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-line leading-relaxed">
          {remainingText}
        </div>
      );
    }

    return parts;
  };

  const lineCount = currentCode ? currentCode.split('\n').length : 0;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#292929] hover:bg-[#1E1E1E] text-white shadow-xl border border-stone-700/80 hover:border-[#B83232] transition-all hover:scale-105 active:scale-95"
          aria-label="Open Python AI Assistant"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-[#B83232] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-[#F2C94C]" />
            </div>
          </div>

          <div className="text-left">
            <span className="block text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>AI Debug Mentor</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-[#F2C94C] border border-stone-700">
                Gemini
              </span>
            </span>
            <span className="block text-[10px] text-stone-400 font-medium">
              Click to inspect active code
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Assistant Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-40 w-[380px] sm:w-[440px] transition-all duration-200 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden ${
            isMinimized ? 'h-[62px]' : 'h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-[#292929] text-white border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#B83232] flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 text-[#F2C94C]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white truncate">
                    Python AI Mentor
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-stone-800 text-[#F2C94C] border border-stone-700">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 truncate">
                  Context: <span className="text-stone-300 font-mono">solution.py</span> ({lineCount} lines)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                title="Restart conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                title={isMinimized ? 'Expand window' : 'Minimize window'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-[#B83232] rounded hover:bg-stone-800 transition-colors"
                title="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content (Visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Quick Action Badges Bar */}
              <div className="px-3 py-2 bg-[#F7F5F2] dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                <button
                  onClick={() =>
                    handleSendMessage(
                      'Please analyze my current Python code for bugs, logic errors, or syntax issues. If you find any problems, explain them and provide the corrected code.'
                    )
                  }
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 text-[#292929] dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-[#B83232] hover:text-[#B83232] transition-colors whitespace-nowrap flex items-center gap-1 font-medium shadow-2xs disabled:opacity-50"
                >
                  <Bug className="w-3 h-3 text-[#B83232]" />
                  <span>Debug Code</span>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      'Analyze the algorithmic time and space complexity of my current code. How can it be optimized for MCA Semester 1 standards?'
                    )
                  }
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 text-[#292929] dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-[#B83232] hover:text-[#B83232] transition-colors whitespace-nowrap flex items-center gap-1 font-medium shadow-2xs disabled:opacity-50"
                >
                  <Zap className="w-3 h-3 text-[#F2C94C]" />
                  <span>Optimize Big-O</span>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage(
                      'Walk me through how this algorithm works line-by-line with a simple concrete trace.'
                    )
                  }
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 text-[#292929] dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-[#B83232] hover:text-[#B83232] transition-colors whitespace-nowrap flex items-center gap-1 font-medium shadow-2xs disabled:opacity-50"
                >
                  <TestTube className="w-3 h-3 text-[#795548]" />
                  <span>Explain Logic</span>
                </button>
              </div>

              {/* Chat Messages Scrollable Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map(msg => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-[#292929] text-[#F2C94C] flex items-center justify-center shrink-0 mt-0.5 border border-stone-700">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                          isUser
                            ? 'bg-[#B83232] text-white rounded-tr-none'
                            : 'bg-[#F7F5F2] dark:bg-stone-800 text-[#292929] dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-tl-none'
                        }`}
                      >
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 mb-1 flex items-center justify-between gap-3">
                          <span className="font-semibold uppercase tracking-wider font-mono">
                            {isUser ? 'You' : 'Gemini AI'}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {isUser ? (
                          <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                        ) : (
                          <div>{renderMessageContent(msg.content, msg.id)}</div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded-lg bg-[#795548] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-6 h-6 rounded-lg bg-[#292929] text-[#F2C94C] flex items-center justify-center shrink-0 mt-0.5 border border-stone-700">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-[#F7F5F2] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B83232] animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-[#F2C94C] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-[#795548] animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] ml-1 font-mono">Analyzing Python AST & runtime...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Box Footer */}
              <div className="p-3 bg-white dark:bg-[#202020] border-t border-stone-200 dark:border-stone-800 shrink-0 space-y-2">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask AI to find a bug, explain logic, or optimize..."
                    disabled={isLoading}
                    className="w-full px-3 py-2 pr-10 text-xs rounded-xl bg-[#F7F5F2] dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-[#292929] dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-[#B83232] transition-colors resize-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-[#B83232] text-white hover:bg-[#9E2A2A] disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
                    title="Send prompt to Gemini"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#795548] dark:text-stone-500">
                  <span>Enter to send · Shift+Enter for new line</span>
                  <span className="font-mono text-[#F2C94C]">Gemini 3.8 Flash</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
