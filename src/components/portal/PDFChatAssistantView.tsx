import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bot,
  BookOpen,
  FileText,
  Upload,
  Send,
  RotateCcw,
  Check,
  Copy,
  AlertCircle,
  WifiOff,
  CheckSquare,
  Square,
  ShieldCheck,
  ShieldAlert,
  Brain,
  Zap,
  Trash2,
  LogIn,
  Loader2,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { AIChatbotMessage, SubjectPDF } from '../../types';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { authFetch } from '../../utils/authFetch';

interface PDFChatAssistantViewProps {
  embeddedSubjectCode?: string;
  onSubjectFilterChange?: (subjectCode: string) => void;
  embedded?: boolean;
}

interface ChatItem extends AIChatbotMessage {
  grounded?: boolean;
  modelUsed?: string;
}

interface UploadedBinaryPDF {
  fileName: string;
  mimeType: 'application/pdf';
  base64Data: string;
  sizeBytes: number;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB binary limit

const formatAssistantMarkdown = (text: string) => {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments.map((segment, segIdx) => {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const inner = segment.slice(3, -3);
      const newlineIdx = inner.indexOf('\n');
      const lang = newlineIdx > -1 ? inner.slice(0, newlineIdx).trim() : '';
      const code = newlineIdx > -1 ? inner.slice(newlineIdx + 1) : inner;
      return (
        <div key={segIdx} className="my-2.5 rounded-xl overflow-hidden border border-[#3D3835] bg-[#1E1E1E]">
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
      <div key={segIdx} className="space-y-1.5 whitespace-pre-wrap break-words leading-relaxed">
        {segment.split('\n').map((line, lineIdx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={lineIdx} className="text-xs font-extrabold text-[#B83232] dark:text-[#F2C94C] pt-1">
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
          const inlineParts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return (
            <p key={lineIdx} className="min-h-[0.75rem]">
              {inlineParts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code
                      key={pIdx}
                      className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return <React.Fragment key={pIdx}>{part}</React.Fragment>;
              })}
            </p>
          );
        })}
      </div>
    );
  });
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = res.indexOf(',');
      resolve(commaIndex > -1 ? res.slice(commaIndex + 1) : res);
    };
    reader.onerror = () => reject(new Error('Failed to read the selected PDF file.'));
    reader.readAsDataURL(file);
  });

const estimatePdfPageCount = async (file: File): Promise<number> => {
  try {
    const slice = await file.slice(0, 262144).text();
    const matches = slice.match(/\/Type\s*\/Page\b/g);
    if (matches && matches.length > 0) return matches.length;
  } catch {
    // Ignore binary decode fallback
  }
  return Math.max(1, Math.round(file.size / 35000));
};

export const PDFChatAssistantView: React.FC<PDFChatAssistantViewProps> = ({
  embeddedSubjectCode,
  onSubjectFilterChange,
  embedded = false,
}) => {
  const {
    currentUser,
    allSubjects,
    selectedSubject,
    subjectPdfs,
    addSubjectPdf,
    deleteSubjectPdf,
    canFacultyAccessSubject,
    refreshAuthenticatedUser,
    logoutUser,
  } = usePortal();
  const isOnline = useOnlineStatus();

  const authorizedSubjects = useMemo(() => {
    if (currentUser?.role === 'faculty') {
      const allowed = allSubjects.filter(s => canFacultyAccessSubject(s.code));
      return allowed.length > 0 ? allowed : allSubjects;
    }
    return allSubjects;
  }, [allSubjects, currentUser?.role, canFacultyAccessSubject]);

  const authorizedSubjectCodes = useMemo(
    () => new Set(authorizedSubjects.map(s => s.code)),
    [authorizedSubjects]
  );

  const [subjectFilter, setSubjectFilter] = useState<string>(
    embeddedSubjectCode || selectedSubject?.code || 'ALL'
  );
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [uploadedBinaries, setUploadedBinaries] = useState<Record<string, UploadedBinaryPDF>>({});
  const [thinkingMode, setThinkingMode] = useState<'standard' | 'deep'>('standard');

  const [messagesByScope, setMessagesByScope] = useState<Record<string, ChatItem[]>>({});
  const [inputQuery, setInputQuery] = useState<string>('');
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [reauthIdentifier, setReauthIdentifier] = useState<string>(
    currentUser?.username || currentUser?.studentId || ''
  );
  const [reauthPassword, setReauthPassword] = useState<string>('');
  const [reauthError, setReauthError] = useState<string>('');
  const [isReauthing, setIsReauthing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadNotice, setUploadNotice] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (currentUser && !reauthIdentifier) {
      setReauthIdentifier(currentUser.username || currentUser.studentId || '');
    }
  }, [currentUser, reauthIdentifier]);

  useEffect(() => {
    if (embeddedSubjectCode) {
      setSubjectFilter(embeddedSubjectCode);
    }
  }, [embeddedSubjectCode]);

  const authorizedPdfs = useMemo(() => {
    if (currentUser?.role === 'faculty') {
      return subjectPdfs.filter(p => authorizedSubjectCodes.has(p.subjectCode) || Boolean(uploadedBinaries[p.id]));
    }
    if (currentUser?.role === 'admin') {
      return subjectPdfs;
    }
    return subjectPdfs.filter(p => p.status !== 'Draft' || Boolean(uploadedBinaries[p.id]));
  }, [subjectPdfs, currentUser?.role, authorizedSubjectCodes, uploadedBinaries]);

  const visiblePdfs = useMemo(() => {
    if (subjectFilter === 'ALL') return authorizedPdfs;
    return authorizedPdfs.filter(p => p.subjectCode === subjectFilter);
  }, [authorizedPdfs, subjectFilter]);

  // Keep selectedPdfIds aligned when subjectFilter changes or new PDFs are uploaded
  useEffect(() => {
    const visibleIds = visiblePdfs.map(p => p.id);
    setSelectedPdfIds(prev => {
      const stillVisible = prev.filter(id => visibleIds.includes(id));
      return stillVisible.length > 0 ? stillVisible : visibleIds;
    });
  }, [visiblePdfs]);

  const activePdfs = useMemo(
    () => visiblePdfs.filter(p => selectedPdfIds.includes(p.id)),
    [visiblePdfs, selectedPdfIds]
  );

  const activeScopeKey = subjectFilter;
  const currentMessages = messagesByScope[activeScopeKey] || [];

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [currentMessages.length, isSending]);

  const activeSubjectObj = allSubjects.find(s => s.code === subjectFilter);

  const suggestedQuestions = useMemo(() => {
    const prompts: string[] = [];
    for (const pdf of activePdfs) {
      for (const ref of pdf.pageReferences || []) {
        if (prompts.length < 4) {
          prompts.push(`Explain "${ref.heading}" from ${pdf.fileName} with key takeaways and page citations.`);
        }
      }
      if (prompts.length >= 4) break;
    }
    if (prompts.length === 0 && activePdfs.length > 0) {
      prompts.push(
        `Summarize the core concepts and definitions covered in ${activePdfs[0].fileName}.`,
        `Generate 3 exam-ready questions with answers from ${activePdfs[0].title}.`
      );
    }
    return prompts;
  }, [activePdfs]);

  const handleSubjectChange = (code: string) => {
    setSubjectFilter(code);
    setChatError('');
    setLastFailedQuery(null);
    onSubjectFilterChange?.(code);
  };

  const togglePdfSelection = (pdfId: string) => {
    setSelectedPdfIds(prev =>
      prev.includes(pdfId) ? prev.filter(id => id !== pdfId) : [...prev, pdfId]
    );
  };

  const handleSelectAllPdfs = () => {
    setSelectedPdfIds(visiblePdfs.map(p => p.id));
  };

  const handleClearPdfSelection = () => {
    setSelectedPdfIds([]);
  };

  const handleStudentPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadNotice('');
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = !file.type || file.type === 'application/pdf';
    if (!isPdfExt || !isPdfMime) {
      setUploadError('Invalid file format: please upload a valid .pdf study document.');
      e.target.value = '';
      return;
    }

    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      setUploadError('PDF file size must be between 1 byte and 10 MB.');
      e.target.value = '';
      return;
    }

    try {
      const [base64Data, estimatedPages] = await Promise.all([
        readFileAsBase64(file),
        estimatePdfPageCount(file),
      ]);

      const targetSubjectCode =
        subjectFilter === 'ALL'
          ? (authorizedSubjects[0]?.code || allSubjects[0]?.code || '435C1A')
          : subjectFilter;
      const targetSubject = authorizedSubjects.find(s => s.code === targetSubjectCode) || allSubjects.find(s => s.code === targetSubjectCode);
      const newPdfId = `pdf-student-${Date.now()}`;
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim() || 'Student Uploaded Study PDF';

      const newPdf: SubjectPDF = {
        id: newPdfId,
        subjectCode: targetSubjectCode,
        subjectName: targetSubject?.name || 'Student Study Material',
        title: cleanTitle,
        fileName: file.name,
        fileSize: `${Math.max(0.1, file.size / (1024 * 1024)).toFixed(1)} MB`,
        pageCount: estimatedPages,
        unit: 1,
        chapter: 'Student Uploaded PDF Material',
        uploadedBy: currentUser?.name || 'MCA Student',
        uploadDate: new Date().toISOString().split('T')[0],
        ocrApplied: true,
        ocrConfidence: 100,
        processingStatus: 'Completed',
        extractedText: `Student-uploaded PDF document "${file.name}" (${estimatedPages} est. pages) attached directly to Gemini PDF analysis.`,
        topicsCovered: ['Student Uploaded Reference', cleanTitle],
        pageReferences: [
          {
            pageNumber: 1,
            heading: cleanTitle,
            snippet: `Uploaded PDF file "${file.name}" ready for direct Gemini document querying.`,
          },
        ],
      };

      setUploadedBinaries(prev => ({
        ...prev,
        [newPdfId]: {
          fileName: file.name,
          mimeType: 'application/pdf',
          base64Data,
          sizeBytes: file.size,
        },
      }));
      addSubjectPdf(newPdf);
      setSelectedPdfIds(prev => (prev.includes(newPdfId) ? prev : [...prev, newPdfId]));
      setUploadNotice(`Added "${file.name}" (${newPdf.fileSize}) to your active PDF knowledge base.`);
      setTimeout(() => setUploadNotice(''), 5000);
    } catch (err: any) {
      setUploadError(err?.message || 'Unable to process the selected PDF file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveStudentPdf = (pdfId: string) => {
    deleteSubjectPdf(pdfId);
    setUploadedBinaries(prev => {
      const next = { ...prev };
      delete next[pdfId];
      return next;
    });
    setSelectedPdfIds(prev => prev.filter(id => id !== pdfId));
  };

  const handleSendQuery = async (overrideQuery?: string) => {
    const queryText = (overrideQuery ?? inputQuery).trim();
    if (!queryText || isSending) return;

    if (!isOnline) {
      setChatError('You are currently offline. Reconnect to query your PDFs with Gemini.');
      return;
    }

    if (activePdfs.length === 0) {
      setChatError('Select or upload at least one PDF document in the knowledge panel before sending a question.');
      return;
    }

    setChatError('');
    setSessionExpired(false);
    setReauthError('');
    setLastFailedQuery(null);

    const priorMessages = messagesByScope[activeScopeKey] || [];
    const userMsgId = `pdf-msg-u-${Date.now()}`;
    const userMsg: ChatItem = {
      id: userMsgId,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (!overrideQuery) setInputQuery('');
    setMessagesByScope(prev => ({
      ...prev,
      [activeScopeKey]: [...(prev[activeScopeKey] || []), userMsg],
    }));
    setIsSending(true);

    try {
      const pdfContextPayload = activePdfs.map(pdf => ({
        id: pdf.id,
        title: pdf.title,
        fileName: pdf.fileName,
        subjectCode: pdf.subjectCode,
        subjectName: pdf.subjectName,
        unit: pdf.unit,
        chapter: pdf.chapter,
        topicsCovered: pdf.topicsCovered,
        extractedText: pdf.extractedText,
        pageReferences: pdf.pageReferences,
      }));

      const attachedBinaries = activePdfs
        .map(pdf => uploadedBinaries[pdf.id])
        .filter((b): b is UploadedBinaryPDF => Boolean(b))
        .slice(0, 3)
        .map(b => ({
          fileName: b.fileName,
          mimeType: b.mimeType,
          base64Data: b.base64Data,
        }));

      const historyPayload = priorMessages.slice(-16).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content,
      }));

      const response = await authFetch('/api/pdf-learning/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subjectFilter,
          subjectName: activeSubjectObj?.name || 'All Enrolled MCA Subjects',
          studentName: currentUser?.name || 'MCA Student',
          rollNumber: currentUser?.rollNumber || currentUser?.studentId || 'MCA2401',
          query: queryText,
          history: historyPayload,
          pdfContext: pdfContextPayload,
          uploadedPdfFiles: attachedBinaries,
          thinkingMode,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        // Restore unsent user question and remove optimistic unauthenticated turn so nothing is lost
        setMessagesByScope(prev => ({
          ...prev,
          [activeScopeKey]: (prev[activeScopeKey] || []).filter(m => m.id !== userMsgId),
        }));
        if (!overrideQuery) {
          setInputQuery(queryText);
        }
        setLastFailedQuery(queryText);
        setSessionExpired(true);
        setReauthIdentifier(currentUser?.username || currentUser?.studentId || '');
        setChatError('Your session has expired. Please sign in again to continue — your question and PDFs are preserved.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || `Gemini PDF service returned status ${response.status}.`);
      }

      const aiMsg: ChatItem = {
        id: `pdf-msg-a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned from Gemini.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceCitations: Array.isArray(data.citations) ? data.citations : [],
        grounded: data.grounded !== false,
        modelUsed: data.modelUsed || 'gemini-4-hydrogen',
      };

      setMessagesByScope(prev => ({
        ...prev,
        [activeScopeKey]: [...(prev[activeScopeKey] || []), aiMsg],
      }));
    } catch (err: any) {
      setLastFailedQuery(queryText);
      setChatError(err?.message || 'Unable to reach the Gemini PDF Assistant right now.');
    } finally {
      setIsSending(false);
    }
  };

  const handleInlineReauth = async () => {
    const cleanId = reauthIdentifier.trim();
    if (!cleanId || !reauthPassword || isReauthing) {
      setReauthError('Enter your Institutional ID / username and password to restore your session.');
      return;
    }
    setIsReauthing(true);
    setReauthError('');
    try {
      const res = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanId,
          password: reauthPassword,
          expectedRole: currentUser?.role || 'student',
          rememberMe: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authenticated || !data.user) {
        setReauthError(data.error || 'Sign-in failed. Verify your credentials and try again.');
        setIsReauthing(false);
        return;
      }

      refreshAuthenticatedUser(data.user);
      const pendingQuestion = lastFailedQuery || inputQuery.trim();
      setSessionExpired(false);
      setChatError('');
      setReauthPassword('');
      setReauthError('');
      setIsReauthing(false);

      if (pendingQuestion) {
        setInputQuery('');
        await handleSendQuery(pendingQuestion);
      }
    } catch {
      setReauthError('Unable to contact authentication service. Please try again.');
      setIsReauthing(false);
    }
  };

  const handleClearConversation = () => {
    setMessagesByScope(prev => ({ ...prev, [activeScopeKey]: [] }));
    setChatError('');
    setLastFailedQuery(null);
    composerRef.current?.focus();
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  return (
    <div className="space-y-5">
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
              Grounded Gemini Study Tutor
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
              AI PDF Learning Assistant
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6863] dark:text-[#BDB7B2] mt-1 max-w-2xl">
              Upload your own PDF handouts or select course materials below to ask questions and receive page-cited answers powered by Gemini.
            </p>
          </div>
          <div className="text-xs text-[#6E6863] dark:text-[#BDB7B2] font-mono tabular-nums shrink-0">
            {activePdfs.length} of {visiblePdfs.length} PDF{visiblePdfs.length === 1 ? '' : 's'} active
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Zone: Uploaded PDF Knowledge Selector & Upload Control */}
        <section
          aria-label="Uploaded PDF Knowledge Base"
          className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] p-4 sm:p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="pdf-chat-subject-filter"
                className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]"
              >
                Course Subject Filter
              </label>
              <select
                id="pdf-chat-subject-filter"
                value={subjectFilter}
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-none focus:ring-2 focus:ring-[#B83232]"
              >
                <option value="ALL">
                  {currentUser?.role === 'faculty' ? 'All Allocated Subjects' : 'All Enrolled Subjects'} ({authorizedPdfs.length} PDFs)
                </option>
                {authorizedSubjects.map(subj => (
                  <option key={subj.code} value={subj.code}>
                    {subj.code} · {subj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Student PDF Upload */}
            <div className="p-3.5 rounded-xl border border-dashed border-[#795548]/50 dark:border-[#795548]/70 bg-[#F7F5F2] dark:bg-[#1E1E1E] space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                    Upload Your Study PDF
                  </h2>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">
                    Attach .pdf lecture slides, lab sheets, or notes (max 10 MB) to query directly.
                  </p>
                </div>
              </div>

              <label className="w-full py-2 px-4 rounded-xl bg-[#292929] hover:bg-black text-[#F2C94C] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>Upload PDF Material</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleStudentPdfUpload}
                  className="hidden"
                  aria-label="Upload PDF study material"
                />
              </label>

              {uploadError && (
                <div role="alert" className="text-[11px] font-semibold text-[#B83232] dark:text-rose-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadNotice && (
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{uploadNotice}</span>
                </div>
              )}
            </div>

            {/* Uploaded PDF List with Per-Document Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">
                  Active Materials ({activePdfs.length}/{visiblePdfs.length})
                </span>
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={handleSelectAllPdfs}
                    className="text-[#B83232] dark:text-[#F2C94C] hover:underline whitespace-nowrap"
                  >
                    Select All
                  </button>
                  <span aria-hidden="true" className="text-[#BDB7B2]">·</span>
                  <button
                    type="button"
                    onClick={handleClearPdfSelection}
                    className="text-[#6E6863] dark:text-[#BDB7B2] hover:underline whitespace-nowrap"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {visiblePdfs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-center text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                    No PDFs available for this filter. Upload a PDF above or switch subjects.
                  </div>
                ) : (
                  visiblePdfs.map(pdf => {
                    const checked = selectedPdfIds.includes(pdf.id);
                    const isStudentUpload = Boolean(uploadedBinaries[pdf.id]);
                    return (
                      <div
                        key={pdf.id}
                        className={`p-3 rounded-xl border transition-colors ${
                          checked
                            ? 'bg-[#B83232]/5 dark:bg-[#B83232]/15 border-[#B83232]/50'
                            : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border-[#E5DFD9] dark:border-[#3D3835]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => togglePdfSelection(pdf.id)}
                            aria-pressed={checked}
                            aria-label={`Include ${pdf.fileName} in AI context`}
                            className="mt-0.5 text-[#B83232] dark:text-[#F2C94C] shrink-0"
                          >
                            {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#6E6863]" />}
                          </button>

                          <div
                            onClick={() => togglePdfSelection(pdf.id)}
                            className="flex-1 min-w-0 cursor-pointer space-y-1"
                          >
                            <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] leading-snug line-clamp-2">
                              {pdf.title}
                            </p>
                            <p className="text-[11px] font-mono text-[#6E6863] dark:text-[#BDB7B2] truncate">
                              {pdf.fileName}
                            </p>
                            <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] tabular-nums">
                              {pdf.subjectCode} · {pdf.pageCount} pages · {pdf.fileSize}
                              {isStudentUpload ? ' · Attached PDF' : ''}
                            </p>
                          </div>

                          {isStudentUpload && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStudentPdf(pdf.id)}
                              title="Remove uploaded PDF"
                              aria-label={`Remove ${pdf.fileName}`}
                              className="p-1 rounded-lg text-[#6E6863] hover:text-[#B83232] transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] text-[11px] text-[#6E6863] dark:text-[#BDB7B2] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
            <span>Answers are verified against selected documents via Gemini.</span>
          </div>
        </section>

        {/* Right Zone: Multi-Turn Gemini Chat Thread */}
        <section
          aria-label="Gemini PDF Question Answering Chat"
          className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-col min-h-[580px] max-h-[760px] overflow-hidden"
        >
          {/* Chat Header */}
          <div className="px-4 sm:px-5 py-3.5 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-b border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#B83232] text-[#F2C94C] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2] truncate">
                  {activeSubjectObj ? `${activeSubjectObj.code} · ${activeSubjectObj.name}` : 'All MCA PDF Materials'}
                </h2>
                <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] truncate tabular-nums">
                  Querying {activePdfs.length} selected PDF{activePdfs.length === 1 ? '' : 's'} · Model: gemini-4-hydrogen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                role="group"
                aria-label="Reasoning mode"
                className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <button
                  type="button"
                  onClick={() => setThinkingMode('standard')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                    thinkingMode === 'standard'
                      ? 'bg-[#B83232] text-white'
                      : 'text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>Standard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThinkingMode('deep')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                    thinkingMode === 'deep'
                      ? 'bg-[#B83232] text-white'
                      : 'text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white'
                  }`}
                >
                  <Brain className="w-3 h-3 shrink-0" />
                  <span>Deep Study</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearConversation}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-[#292929] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#B83232] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="py-4 space-y-5 max-w-2xl">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                    Ask anything across your uploaded PDF materials
                  </h3>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                    Gemini reads the selected course PDFs and any PDFs you uploaded above, tracks follow-up questions across turns, and returns citations showing exact source documents and page numbers.
                  </p>
                </div>

                {suggestedQuestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#795548] dark:text-[#F2C94C]">
                      Suggested Questions from Selected PDFs
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {suggestedQuestions.map(prompt => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSendQuery(prompt)}
                          disabled={isSending || !isOnline || activePdfs.length === 0}
                          className="p-3 rounded-xl text-left text-xs font-medium bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:bg-[#EFEBE9] dark:hover:bg-[#33302E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] transition-colors disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              currentMessages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
                      <span className="font-semibold">
                        {isUser ? (currentUser?.name || 'Student') : 'Gemini PDF Assistant'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{msg.timestamp}</span>
                      {!isUser && msg.modelUsed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{msg.modelUsed}</span>
                        </>
                      )}
                    </div>

                    <div
                      className={`max-w-[92%] sm:max-w-[82%] p-4 rounded-2xl text-xs ${
                        isUser
                          ? 'bg-[#B83232] text-white rounded-br-xs'
                          : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] rounded-bl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-3">
                          {formatAssistantMarkdown(msg.content)}

                          {/* Grounding Status & Page Citations */}
                          <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                                  msg.grounded === false
                                    ? 'text-amber-700 dark:text-[#F2C94C]'
                                    : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {msg.grounded === false ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                    <span>Insufficient Coverage in Selected PDFs</span>
                                  </>
                                ) : (
                                  <>
                                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                    <span>Grounded in Uploaded PDFs</span>
                                  </>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#B83232] dark:hover:text-[#F2C94C] transition-colors"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Answer</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {msg.sourceCitations && msg.sourceCitations.length > 0 && (
                              <div className="space-y-1.5">
                                {msg.sourceCitations.map((cite, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] flex items-start gap-1.5"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-mono font-bold text-[#292929] dark:text-[#F7F5F2]">
                                        {cite.pdfTitle} · Page {cite.pageNumber}
                                      </span>
                                      {cite.snippet && (
                                        <p className="text-[11px] opacity-90 mt-0.5">{cite.snippet}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-center gap-2.5 text-xs text-[#795548] dark:text-[#F2C94C] p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] w-fit">
                <span className="w-3.5 h-3.5 border-2 border-[#B83232] border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold">
                  Querying {activePdfs.length} PDF{activePdfs.length === 1 ? '' : 's'} with Gemini...
                </span>
              </div>
            )}

            <div ref={scrollBottomRef} />
          </div>

          {/* Offline, Session Expiration, or API Error Banner */}
          {(!isOnline || chatError) && (
            <div
              role="alert"
              className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/70 space-y-2.5 text-xs text-rose-800 dark:text-rose-200 shrink-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!isOnline ? (
                    <WifiOff className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    {!isOnline
                      ? 'You are offline. Reconnect to send PDF queries to Gemini.'
                      : chatError}
                  </span>
                </div>
                {isOnline && !sessionExpired && lastFailedQuery && (
                  <button
                    type="button"
                    onClick={() => handleSendQuery(lastFailedQuery)}
                    className="px-3 py-1 rounded-lg bg-[#B83232] text-white text-[11px] font-bold hover:bg-[#9E2A2A] whitespace-nowrap shrink-0"
                  >
                    Retry Question
                  </button>
                )}
              </div>

              {isOnline && sessionExpired && (
                <div
                  data-testid="pdf-chat-reauth-panel"
                  className="p-3 rounded-xl bg-white dark:bg-[#292929] border border-rose-200 dark:border-rose-800/70 text-[#292929] dark:text-[#F7F5F2] space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={reauthIdentifier}
                      onChange={e => setReauthIdentifier(e.target.value)}
                      placeholder="User ID or username"
                      aria-label="Re-enter User ID or username"
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                    />
                    <input
                      type="password"
                      value={reauthPassword}
                      onChange={e => setReauthPassword(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInlineReauth();
                        }
                      }}
                      placeholder="Enter password"
                      aria-label="Re-enter password"
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                    />
                    <button
                      type="button"
                      disabled={isReauthing}
                      onClick={handleInlineReauth}
                      className="px-3 py-1.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-[11px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      {isReauthing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{isReauthing ? 'Signing In...' : 'Sign In & Continue'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => logoutUser()}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] text-[11px] font-semibold hover:border-[#B83232] whitespace-nowrap shrink-0"
                    >
                      Go to Login Page
                    </button>
                  </div>
                  {reauthError && (
                    <p className="text-[11px] font-semibold text-[#B83232] dark:text-rose-300">
                      {reauthError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Question Input Composer */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="p-3.5 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-t border-[#E5DFD9] dark:border-[#3D3835] shrink-0"
          >
            <div className="flex items-end gap-2.5">
              <textarea
                ref={composerRef}
                rows={2}
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={
                  activePdfs.length === 0
                    ? 'Select or upload a PDF document on the left to ask questions...'
                    : 'Ask a question grounded in your selected PDFs (Enter to send, Shift+Enter for newline)...'
                }
                disabled={isSending || !isOnline}
                aria-label="Ask a question based on uploaded PDF learning materials"
                className="flex-1 resize-none max-h-32 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] px-3.5 py-2.5 text-xs text-[#292929] dark:text-[#F7F5F2] placeholder:text-[#8C847E] focus:outline-none focus:ring-2 focus:ring-[#B83232] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isSending || !isOnline || activePdfs.length === 0}
                className="h-10 px-4 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Ask Gemini</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
