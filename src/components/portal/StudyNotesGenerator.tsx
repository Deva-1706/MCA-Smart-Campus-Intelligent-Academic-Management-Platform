import React, { useState, useEffect, useMemo } from 'react';
import { usePortal } from '../../context/PortalContext';
import { GeneratedStudyNote, StudyNoteMode } from '../../types';
import { exportStudyNoteToPdf } from '../../utils/exportStudyNotePdf';
import {
  Sparkles,
  BookOpen,
  FileText,
  Download,
  Printer,
  Bookmark,
  CheckCircle2,
  Circle,
  Flag,
  Search,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
  Layers,
  Code2,
  Calculator,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Clock,
  SlidersHorizontal,
  X,
  WifiOff,
  HardDrive
} from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface StudyNotesGeneratorProps {
  activeSubjectCode: string;
  onSubjectChange: (code: string) => void;
}

const GENERATION_MODES: {
  mode: StudyNoteMode;
  toolbarLabel: string;
  shortDesc: string;
  primary?: boolean;
}[] = [
  { mode: 'Detailed Notes', toolbarLabel: 'Detailed Notes', shortDesc: '17-point lecture depth', primary: true },
  { mode: '2-Mark Questions', toolbarLabel: '2-Mark', shortDesc: 'Crisp definitions & key points' },
  { mode: '5-Mark Questions', toolbarLabel: '5-Mark', shortDesc: 'Structured with examples' },
  { mode: '10-Mark Questions', toolbarLabel: '10-Mark', shortDesc: 'Full essays & derivations' },
  { mode: 'Solved Examples', toolbarLabel: 'Solved Examples', shortDesc: 'Step-by-step solutions' },
  { mode: 'Revision Notes', toolbarLabel: 'Revision', shortDesc: 'Formulas & rapid recall' },
];

// Clean markdown-to-JSX academic renderer with editorial typography & clear heading hierarchy
const AcademicMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const blocks = useMemo(() => {
    const lines = text.split('\n');
    const result: Array<
      | { type: 'h3' | 'h4'; content: string }
      | { type: 'ul'; items: string[] }
      | { type: 'ol'; items: string[] }
      | { type: 'table'; headers: string[]; rows: string[][] }
      | { type: 'math'; content: string }
      | { type: 'p'; content: string }
    > = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
        result.push({ type: 'math', content: line.slice(2, -2).trim() });
        i++;
        continue;
      }

      if (
        line.startsWith('|') &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('|') &&
        lines[i + 1].includes('---')
      ) {
        const headers = line
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(
            lines[i]
              .trim()
              .split('|')
              .slice(1, -1)
              .map(c => c.trim())
          );
          i++;
        }
        result.push({ type: 'table', headers, rows });
        continue;
      }

      if (line.startsWith('### ')) {
        result.push({ type: 'h3', content: line.slice(4) });
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        result.push({ type: 'h4', content: line.slice(5) });
        i++;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        result.push({ type: 'ul', items });
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        result.push({ type: 'ol', items });
        continue;
      }

      const paraLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(#{3,4}\s|[-*]\s|\d+\.\s|\||\$\$)/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      result.push({ type: 'p', content: paraLines.join(' ') });
    }
    return result;
  }, [text]);

  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-[#292929] dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C] font-mono text-[13px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        return (
          <span
            key={idx}
            className="font-mono text-[13.5px] px-1.5 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835]"
          >
            {part.slice(1, -1)}
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-4 text-[15px] leading-[1.78] text-[#292929] dark:text-[#E5E0DB]">
      {blocks.map((block, idx) => {
        if (block.type === 'h3') {
          return (
            <h4
              key={idx}
              className="text-base font-extrabold text-[#B83232] dark:text-[#F2C94C] pt-3 pb-1 border-b border-[#E5DFD9]/70 dark:border-[#3D3835]"
            >
              {renderInline(block.content)}
            </h4>
          );
        }
        if (block.type === 'h4') {
          return (
            <h5
              key={idx}
              className="text-xs font-extrabold uppercase tracking-wider text-[#795548] dark:text-[#D7CCC8] pt-2"
            >
              {renderInline(block.content)}
            </h5>
          );
        }
        if (block.type === 'math') {
          return (
            <div
              key={idx}
              className="my-3 p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono text-sm text-center text-[#292929] dark:text-[#F2C94C] overflow-x-auto"
            >
              {block.content}
            </div>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2 text-[15px] leading-[1.72] marker:text-[#B83232] dark:marker:text-[#F2C94C]">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-2 text-[15px] leading-[1.72] marker:font-bold marker:text-[#B83232] dark:marker:text-[#F2C94C]">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === 'table') {
          return (
            <div key={idx} className="overflow-x-auto rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] my-4 shadow-2xs">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead className="bg-[#292929] text-[#F2C94C]">
                  <tr>
                    {block.headers.map((h, hi) => (
                      <th key={hi} className="px-4 py-2.5 font-bold border-b border-[#3D3835]">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD9] dark:divide-[#3D3835] bg-white dark:bg-[#1E1E1E]">
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-[#F7F5F2] dark:hover:bg-[#292929]">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-[#292929] dark:text-[#E5E0DB] align-top">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={idx} className="text-[15px] leading-[1.78]">
            {renderInline(block.content)}
          </p>
        );
      })}
    </div>
  );
};

export const StudyNotesGenerator: React.FC<StudyNotesGeneratorProps> = ({
  activeSubjectCode,
  onSubjectChange,
}) => {
  const {
    allSubjects,
    subjectPdfs,
    currentUser,
    generatedStudyNotes,
    generateDetailedStudyNote,
    saveStudyNoteToAccount,
    toggleStudyNoteCompleted,
    toggleStudyNoteBookmarked,
    toggleStudyNoteRevision,
    deleteStudyNote,
    markStudyNoteViewed,
    recentlyViewedNoteIds,
    offlineCacheStats,
  } = usePortal();

  const isOnline = useOnlineStatus();

  const activeSubject = allSubjects.find(s => s.code === activeSubjectCode) || allSubjects[0];
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customSubtopic, setCustomSubtopic] = useState<string>('');
  const [showSubtopicInput, setShowSubtopicInput] = useState<boolean>(false);

  // Sidebar hierarchy state
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({ 1: true, 2: true });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingMode, setGeneratingMode] = useState<StudyNoteMode | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Filter & search state
  const [notesSearch, setNotesSearch] = useState<string>('');
  const [notesFilter, setNotesFilter] = useState<'all' | 'bookmarked' | 'revision' | 'completed'>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Build clean Unit -> Topics hierarchy combining official syllabus units & uploaded subject PDFs
  const unitHierarchy = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.units.map(u => {
      const pdfTopics = subjectPdfs
        .filter(p => p.subjectCode === activeSubjectCode && p.unit === u.unitNumber)
        .flatMap(p => p.topicsCovered);
      const topics = Array.from(new Set([...u.topics, ...pdfTopics]));
      return {
        unitNumber: u.unitNumber,
        title: u.title,
        topics,
      };
    });
  }, [activeSubject, subjectPdfs, activeSubjectCode]);

  // Ensure a valid topic is selected when subject changes
  useEffect(() => {
    const firstUnit = unitHierarchy[0];
    if (firstUnit && firstUnit.topics.length > 0) {
      setSelectedUnit(firstUnit.unitNumber);
      setSelectedTopic(firstUnit.topics[0]);
      setExpandedUnits({ 1: true, 2: true });
    }
  }, [activeSubjectCode]);

  // Notes filtered by active subject, search, and bookmark/revision/completed pill
  const subjectNotes = useMemo(() => {
    const q = notesSearch.trim().toLowerCase();
    return generatedStudyNotes.filter(note => {
      if (note.subjectCode !== activeSubjectCode) return false;
      if (notesFilter === 'bookmarked' && !note.bookmarked) return false;
      if (notesFilter === 'revision' && !note.markedForRevision) return false;
      if (notesFilter === 'completed' && !note.completed) return false;
      if (q) {
        const hay = `${note.title} ${note.topic} ${note.subtopic || ''} ${note.mode} ${note.summary}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [generatedStudyNotes, activeSubjectCode, notesSearch, notesFilter]);

  const activeNote: GeneratedStudyNote | null = useMemo(() => {
    if (selectedNoteId) {
      const exact = generatedStudyNotes.find(n => n.id === selectedNoteId);
      if (exact && exact.subjectCode === activeSubjectCode) return exact;
    }
    // Prefer a note matching selected unit + topic if available
    const topicMatch = subjectNotes.find(
      n =>
        n.unit === selectedUnit &&
        n.topic.toLowerCase() === selectedTopic.toLowerCase()
    );
    return topicMatch || subjectNotes[0] || null;
  }, [selectedNoteId, generatedStudyNotes, subjectNotes, activeSubjectCode, selectedUnit, selectedTopic]);

  const estimatedReadMinutes = useMemo(() => {
    if (!activeNote) return 0;
    const words = activeNote.sections
      .map(s => `${s.heading} ${s.contentMarkdown} ${s.codeSnippet?.code || ''}`)
      .join(' ')
      .trim()
      .split(/\s+/).length;
    return Math.max(2, Math.ceil(words / 180));
  }, [activeNote]);

  const toggleUnitExpanded = (unitNum: number) => {
    setExpandedUnits(prev => ({ ...prev, [unitNum]: !prev[unitNum] }));
  };

  const handleSelectTopic = (unitNum: number, topic: string) => {
    setSelectedUnit(unitNum);
    setSelectedTopic(topic);
    setExpandedUnits(prev => ({ ...prev, [unitNum]: true }));
    setGenerationError(null);
    // Select latest saved note under this topic if one exists
    const matching = subjectNotes.find(
      n => n.unit === unitNum && n.topic.toLowerCase() === topic.toLowerCase()
    );
    if (matching) {
      setSelectedNoteId(matching.id);
    } else {
      setSelectedNoteId(null);
    }
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    if (activeNote?.id) {
      markStudyNoteViewed(activeNote.id);
    }
  }, [activeNote?.id, markStudyNoteViewed]);

  const handleGenerate = async (mode: StudyNoteMode) => {
    const targetTopic = selectedTopic.trim() || unitHierarchy[0]?.topics[0] || activeSubject.name;
    if (isGenerating) return;
    if (!isOnline) {
      setGenerationError(
        'You are currently offline. Live AI generation requires an internet connection, while your previously viewed and cached study notes remain available offline.'
      );
      return;
    }

    setIsGenerating(true);
    setGeneratingMode(mode);
    setGenerationError(null);
    setStatusFeedback(null);

    const result = await generateDetailedStudyNote({
      subjectCode: activeSubjectCode,
      unit: selectedUnit,
      topic: targetTopic,
      subtopic: customSubtopic.trim() || undefined,
      mode,
    });

    setIsGenerating(false);
    setGeneratingMode(null);

    if (result.error) {
      setGenerationError(result.error);
      return;
    }

    if (result.note) {
      setSelectedNoteId(result.note.id);
      setStatusFeedback(`Generated "${result.note.title}" (${mode}) and saved to your account.`);
      setTimeout(() => setStatusFeedback(null), 5000);
    }
  };

  const handleCopyCode = (secId: string, code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCodeId(secId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const completedCount = generatedStudyNotes.filter(n => n.subjectCode === activeSubjectCode && n.completed).length;
  const bookmarkedCount = generatedStudyNotes.filter(n => n.subjectCode === activeSubjectCode && n.bookmarked).length;
  const revisionCount = generatedStudyNotes.filter(n => n.subjectCode === activeSubjectCode && n.markedForRevision).length;

  return (
    <div className="relative space-y-5 pb-24">
      {/* Mobile Sidebar Toggle Bar */}
      <div className="flex lg:hidden items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] print:hidden">
        <div className="min-w-0">
          <div className="text-[10px] font-mono font-bold uppercase text-[#B83232] dark:text-[#F2C94C]">
            {activeSubject.code} · Unit {selectedUnit}
          </div>
          <div className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
            {selectedTopic || 'Select Syllabus Topic'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(v => !v)}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-[#292929] text-[#F2C94C] flex items-center gap-1.5 shrink-0"
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>{mobileSidebarOpen ? 'Hide Syllabus' : 'Unit & Topic Tree'}</span>
        </button>
      </div>

      {/* Main Split Workspace: Comprehensive Left Sidebar + Main Reading Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR: Comprehensive Unit / Topic Hierarchy & Document Outline */}
        <aside
          className={`${
            mobileSidebarOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 space-y-4 print:hidden`}
        >
          <div className="bg-white dark:bg-[#292929] rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs overflow-hidden">
            {/* Sidebar Header & Subject Switcher */}
            <div className="p-4 bg-[#292929] text-white space-y-3 border-b-2 border-b-[#B83232]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2C94C] font-bold flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5" />
                  Syllabus &amp; Notes Explorer
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span
                    title="Notes persisted in local offline vault"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#795548]/50 text-[#F2C94C]"
                  >
                    <HardDrive className="w-2.5 h-2.5" />
                    {offlineCacheStats.cachedNotesCount} Offline
                  </span>
                  <span className="text-[#D7CCC8]">{completedCount} Done</span>
                </div>
              </div>

              <select
                aria-label="Select MCA Subject"
                value={activeSubjectCode}
                onChange={e => {
                  onSubjectChange(e.target.value);
                  setSelectedNoteId(null);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-[#1E1E1E] border border-[#795548]/60 text-white focus:outline-hidden focus:ring-2 focus:ring-[#F2C94C]"
              >
                {allSubjects.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>

              {/* Search Topics & Notes */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#BDB7B2] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={notesSearch}
                  onChange={e => setNotesSearch(e.target.value)}
                  placeholder="Filter units, topics, or notes..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#1E1E1E] border border-[#795548]/50 text-white placeholder-[#BDB7B2] focus:outline-hidden focus:ring-1 focus:ring-[#F2C94C]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                {(
                  [
                    { id: 'all', label: `All (${generatedStudyNotes.filter(n => n.subjectCode === activeSubjectCode).length})` },
                    { id: 'bookmarked', label: `★ ${bookmarkedCount}` },
                    { id: 'revision', label: `⚑ ${revisionCount}` },
                    { id: 'completed', label: `✓ ${completedCount}` },
                  ] as const
                ).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setNotesFilter(f.id)}
                    className={`py-1 px-1.5 rounded-md transition-colors text-center ${
                      notesFilter === f.id
                        ? 'bg-[#B83232] text-white'
                        : 'bg-[#1E1E1E] text-[#D7CCC8] hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hierarchical Unit -> Topic -> Saved Notes Tree */}
            <div className="p-3 max-h-[540px] overflow-y-auto space-y-2 divide-y divide-[#E5DFD9]/60 dark:divide-[#3D3835]/60">
              {unitHierarchy.map(unit => {
                const q = notesSearch.trim().toLowerCase();
                const visibleTopics = q
                  ? unit.topics.filter(t => {
                      const topicMatches = t.toLowerCase().includes(q) || unit.title.toLowerCase().includes(q);
                      const hasMatchingNote = subjectNotes.some(
                        n => n.unit === unit.unitNumber && n.topic.toLowerCase() === t.toLowerCase()
                      );
                      return topicMatches || hasMatchingNote;
                    })
                  : unit.topics;

                const unitNotes = subjectNotes.filter(n => n.unit === unit.unitNumber);
                if (q && visibleTopics.length === 0 && unitNotes.length === 0) return null;

                const isExpanded = !!expandedUnits[unit.unitNumber] || q.length > 0;
                const isUnitActive = selectedUnit === unit.unitNumber;

                return (
                  <div key={unit.unitNumber} className="pt-2 first:pt-0">
                    {/* Unit Header Accordion */}
                    <button
                      type="button"
                      onClick={() => toggleUnitExpanded(unit.unitNumber)}
                      className={`w-full flex items-start justify-between gap-2 p-2 rounded-xl text-left transition-colors ${
                        isUnitActive
                          ? 'bg-[#F7F5F2] dark:bg-[#1E1E1E]'
                          : 'hover:bg-[#F7F5F2]/70 dark:hover:bg-[#1E1E1E]/60'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#795548] dark:text-[#BDB7B2] shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono font-bold uppercase text-[#B83232] dark:text-[#F2C94C]">
                            Unit {unit.unitNumber}
                          </div>
                          <div className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] leading-snug">
                            {unit.title}
                          </div>
                        </div>
                      </div>
                      {unitNotes.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F2C94C]/25 text-[#795548] dark:text-[#F2C94C] font-bold shrink-0">
                          {unitNotes.length}
                        </span>
                      )}
                    </button>

                    {/* Nested Topics inside Unit */}
                    {isExpanded && (
                      <div className="mt-1 ml-3 pl-3 border-l-2 border-[#E5DFD9] dark:border-[#3D3835] space-y-1">
                        {visibleTopics.map(topic => {
                          const isTopicSelected =
                            selectedUnit === unit.unitNumber &&
                            selectedTopic.toLowerCase() === topic.toLowerCase();
                          const topicNotes = subjectNotes.filter(
                            n =>
                              n.unit === unit.unitNumber &&
                              n.topic.toLowerCase() === topic.toLowerCase()
                          );

                          return (
                            <div key={topic} className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleSelectTopic(unit.unitNumber, topic)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                                  isTopicSelected
                                    ? 'bg-[#B83232] text-white font-bold shadow-2xs'
                                    : 'text-[#292929] dark:text-[#E5E0DB] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] font-medium'
                                }`}
                              >
                                <span className="leading-snug">{topic}</span>
                                {topicNotes.length > 0 && (
                                  <span
                                    className={`text-[10px] font-mono shrink-0 ${
                                      isTopicSelected ? 'text-[#F2C94C]' : 'text-[#795548] dark:text-[#F2C94C]'
                                    }`}
                                  >
                                    {topicNotes.length}
                                  </span>
                                )}
                              </button>

                              {/* Existing Generated Notes under this Topic */}
                              {topicNotes.length > 0 && (
                                <div className="ml-2 space-y-1">
                                  {topicNotes.map(n => {
                                    const isNoteActive = activeNote?.id === n.id;
                                    return (
                                      <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedUnit(n.unit);
                                          setSelectedTopic(n.topic);
                                          setSelectedNoteId(n.id);
                                          setMobileSidebarOpen(false);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] border transition-colors flex items-center justify-between gap-1.5 ${
                                          isNoteActive
                                            ? 'bg-[#292929] text-[#F2C94C] border-[#B83232] font-bold'
                                            : 'bg-[#F7F5F2]/80 dark:bg-[#1E1E1E]/80 text-[#6E6863] dark:text-[#BDB7B2] border-transparent hover:border-[#795548]/40'
                                        }`}
                                      >
                                        <span className="truncate">{n.mode}</span>
                                        <span className="text-[10px] shrink-0 flex items-center gap-1">
                                          {recentlyViewedNoteIds.includes(n.id) && (
                                            <HardDrive className="w-2.5 h-2.5 text-[#795548] dark:text-[#F2C94C]" aria-label="Viewed & cached offline" />
                                          )}
                                          {n.completed ? '✓' : ''}
                                          {n.bookmarked ? '★' : ''}
                                          {n.markedForRevision ? '⚑' : ''}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Any custom topic notes inside this unit not matching a preset topic string */}
                        {unitNotes
                          .filter(
                            n =>
                              !unit.topics.some(
                                t => t.toLowerCase() === n.topic.toLowerCase()
                              )
                          )
                          .map(n => {
                            const isNoteActive = activeNote?.id === n.id;
                            return (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUnit(n.unit);
                                  setSelectedTopic(n.topic);
                                  setSelectedNoteId(n.id);
                                  setMobileSidebarOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors flex items-center justify-between gap-1.5 ${
                                  isNoteActive
                                    ? 'bg-[#292929] text-[#F2C94C] border-[#B83232] font-bold'
                                    : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#E5E0DB] border-[#E5DFD9] dark:border-[#3D3835]'
                                }`}
                              >
                                <span className="truncate">
                                  {n.topic} · {n.mode}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Document Section Outline when a Note is Active */}
            {activeNote && (
              <div className="p-3.5 border-t border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2]/70 dark:bg-[#1E1E1E]/60 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
                  On This Manuscript
                </div>
                <nav className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {activeNote.summary && (
                    <a
                      href="#note-summary"
                      className="block text-[11px] text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#B83232] dark:hover:text-[#F2C94C] font-medium truncate"
                    >
                      00. Executive Overview
                    </a>
                  )}
                  {activeNote.sections.map((sec, sIdx) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block text-[11px] text-[#292929] dark:text-[#E5E0DB] hover:text-[#B83232] dark:hover:text-[#F2C94C] font-medium truncate"
                    >
                      {String(sIdx + 1).padStart(2, '0')}. {sec.heading}
                    </a>
                  ))}
                  {activeNote.importantPoints.length > 0 && (
                    <a
                      href="#note-takeaways"
                      className="block text-[11px] text-[#B83232] dark:text-[#F2C94C] font-semibold truncate pt-1"
                    >
                      Exam Takeaways &amp; Formulas
                    </a>
                  )}
                </nav>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN READING AREA: Professional Typography & Clear Heading Structure */}
        <main className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-4">
          {/* Live Status & Error Notifications */}
          {isGenerating && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border-2 border-[#F2C94C] text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-3 shadow-sm print:hidden">
              <span className="w-4 h-4 border-2 border-[#B83232] border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                Synthesizing postgraduate <strong>{generatingMode}</strong> for{' '}
                <strong>
                  {activeSubjectCode} · Unit {selectedUnit} ({selectedTopic})
                </strong>{' '}
                grounded strictly in uploaded course PDFs...
              </span>
            </div>
          )}

          {generationError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-[#B83232] dark:text-rose-200 flex items-start justify-between gap-3 print:hidden">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">AI Notes Generation Error</p>
                  <p className="mt-0.5">{generationError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGenerationError(null)}
                className="p-1 rounded hover:bg-rose-200/40"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {statusFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 print:hidden">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {activeNote ? (
            <article className="bg-white dark:bg-[#292929] rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs overflow-hidden print:border-none print:shadow-none">
              {/* Manuscript Masthead */}
              <header className="px-6 py-7 sm:px-10 sm:py-9 bg-[#292929] text-white border-b-4 border-b-[#B83232] space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex flex-wrap items-center gap-2 text-[#F2C94C] font-bold">
                    <span>{activeNote.subjectCode}</span>
                    <span className="text-[#795548]">/</span>
                    <span>UNIT {activeNote.unit}</span>
                    <span className="text-[#795548]">/</span>
                    <span className="uppercase">{activeNote.mode}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#D7CCC8]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1E1E1E] border border-[#795548]/60 text-[#F2C94C] font-mono">
                      <HardDrive className="w-3 h-3" />
                      Cached Offline
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#F2C94C]" />
                      {estimatedReadMinutes} min read
                    </span>
                    <span>•</span>
                    <span>{activeNote.providerUsed}</span>
                  </div>
                </div>

                <div className="max-w-[72ch] space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-[1.2]">
                    {activeNote.title}
                  </h1>
                  <p className="text-sm text-[#D7CCC8]">
                    {activeNote.subjectName} · Topic:{' '}
                    <strong className="text-white">{activeNote.topic}</strong>
                    {activeNote.subtopic ? ` — ${activeNote.subtopic}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15 text-xs">
                  <span className="text-[#D7CCC8]">
                    Prepared for <strong className="text-white">{currentUser?.name || 'Devanath N'}</strong> (
                    <span className="font-mono text-[#F2C94C]">{currentUser?.rollNumber || 'P26CA125'}</span>) ·
                    Advisor: <strong className="text-[#F2C94C]">HCASICAN</strong>
                  </span>

                  {/* Manuscript Actions (Hidden on print) */}
                  <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                    <button
                      type="button"
                      onClick={() => toggleStudyNoteCompleted(activeNote.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        activeNote.completed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {activeNote.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      <span>{activeNote.completed ? 'Completed' : 'Mark Read'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStudyNoteBookmarked(activeNote.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        activeNote.bookmarked
                          ? 'bg-[#F2C94C] text-[#292929]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{activeNote.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleStudyNoteRevision(activeNote.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        activeNote.markedForRevision
                          ? 'bg-[#795548] text-[#F2C94C]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{activeNote.markedForRevision ? 'Revision' : 'Flag'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => saveStudyNoteToAccount(activeNote.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 text-white hover:bg-white/20 flex items-center gap-1 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#F2C94C]" />
                      <span>{activeNote.savedToAccount ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportStudyNoteToPdf(activeNote, currentUser)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#B83232] hover:bg-[#9E2A2A] text-white flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#F2C94C]" />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>

                    {!activeNote.id.startsWith('note-seed-') && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteStudyNote(activeNote.id);
                          setSelectedNoteId(null);
                        }}
                        className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-950/60 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* PDF Grounding Attribution Banner */}
              <div className="px-6 sm:px-10 py-3.5 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-b border-[#E5DFD9] dark:border-[#3D3835] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      activeNote.isPdfSufficient ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">
                      {activeNote.sourcePdfTitles.length > 0
                        ? `Grounded Source: ${activeNote.sourcePdfTitles.join(', ')}`
                        : 'Supplementary Academic Synthesis (No uploaded PDF matched this topic)'}
                    </span>
                    {activeNote.supplementaryNotice && (
                      <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">
                        {activeNote.supplementaryNotice}
                      </p>
                    )}
                  </div>
                </div>
                {activeNote.sourcePageCitations.length > 0 && (
                  <span className="font-mono text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] shrink-0">
                    Pages Cited: [{activeNote.sourcePageCitations.join(', ')}]
                  </span>
                )}
              </div>

              {/* Editorial Manuscript Body (Optimal 72–76ch Measure) */}
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <div className="max-w-[76ch] mx-auto space-y-10">
                  {/* Executive Overview */}
                  {activeNote.summary && (
                    <section
                      id="note-summary"
                      className="p-5 sm:p-6 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border-l-4 border-l-[#B83232] border-y border-r border-[#E5DFD9] dark:border-[#3D3835] space-y-2 scroll-mt-24"
                    >
                      <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#B83232] dark:text-[#F2C94C]">
                        Executive Overview
                      </div>
                      <p className="text-[15px] leading-[1.75] text-[#292929] dark:text-[#F7F5F2] font-medium">
                        {activeNote.summary}
                      </p>
                    </section>
                  )}

                  {/* Numbered Academic Sections */}
                  {activeNote.sections.map((sec, idx) => (
                    <section
                      key={sec.id}
                      id={sec.id}
                      className="space-y-4 pb-8 border-b border-[#E5DFD9] dark:border-[#3D3835] last:border-b-0 scroll-mt-24"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#292929] dark:text-[#F7F5F2] flex items-baseline gap-2.5">
                          <span className="font-mono text-sm font-bold text-[#B83232] dark:text-[#F2C94C]">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span>{sec.heading}</span>
                        </h2>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            sec.sourceType === 'PDF-Grounded'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-[#795548] dark:text-[#F2C94C]'
                          }`}
                        >
                          {sec.sourceType === 'PDF-Grounded' ? 'PDF-Grounded' : 'AI Supplementary'}
                        </span>
                      </div>

                      {sec.formulaBox && (
                        <div className="p-4 rounded-xl bg-[#FEF9E7] dark:bg-[#1E1E1E] border border-[#F2C94C] flex items-start gap-3">
                          <Calculator className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-1" />
                          <div className="font-mono text-[13.5px] font-bold text-[#292929] dark:text-[#F2C94C] overflow-x-auto leading-relaxed">
                            {sec.formulaBox}
                          </div>
                        </div>
                      )}

                      <AcademicMarkdown text={sec.contentMarkdown} />

                      {sec.diagramText && (
                        <div className="rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] p-4 sm:p-5 overflow-x-auto">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#795548] dark:text-[#BDB7B2] mb-2">
                            Diagram / Structural Trace
                          </div>
                          <pre className="font-mono text-xs sm:text-[13px] text-[#292929] dark:text-[#F7F5F2] whitespace-pre leading-relaxed">
                            {sec.diagramText}
                          </pre>
                        </div>
                      )}

                      {sec.codeSnippet?.code && (
                        <div className="rounded-xl overflow-hidden border border-[#3D3835] bg-[#1E1E1E]">
                          <div className="px-4 py-2.5 bg-[#292929] border-b border-[#3D3835] flex items-center justify-between text-[11px] font-mono text-[#F2C94C]">
                            <span className="flex items-center gap-1.5 font-bold uppercase">
                              <Code2 className="w-3.5 h-3.5" />
                              {sec.codeSnippet.language || 'python'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(sec.id, sec.codeSnippet!.code)}
                              className="text-[#D7CCC8] hover:text-white flex items-center gap-1 print:hidden"
                            >
                              {copiedCodeId === sec.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedCodeId === sec.id ? 'Copied' : 'Copy Code'}</span>
                            </button>
                          </div>
                          <pre className="p-4 text-[13px] font-mono text-[#F7F5F2] overflow-x-auto leading-relaxed">
                            <code>{sec.codeSnippet.code}</code>
                          </pre>
                          {sec.codeSnippet.output && (
                            <div className="px-4 py-3 bg-black/50 border-t border-[#3D3835] text-xs font-mono text-[#D7CCC8]">
                              <span className="text-[#F2C94C] font-bold block mb-1">
                                Expected Console / Query Output:
                              </span>
                              <pre className="whitespace-pre-wrap">{sec.codeSnippet.output}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {sec.keyPoints && sec.keyPoints.length > 0 && (
                        <ul className="list-disc pl-6 space-y-1.5 text-[14px] text-[#6E6863] dark:text-[#BDB7B2]">
                          {sec.keyPoints.map((kp, ki) => (
                            <li key={ki}>{kp}</li>
                          ))}
                        </ul>
                      )}

                      {sec.citations && sec.citations.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#795548] dark:text-[#BDB7B2] pt-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
                          <span>
                            Source Citation:{' '}
                            {sec.citations.map(c => `${c.pdfTitle} (Page ${c.pageNumber})`).join(' · ')}
                          </span>
                        </div>
                      )}
                    </section>
                  ))}

                  {/* Important Points for Examination */}
                  {activeNote.importantPoints.length > 0 && (
                    <section
                      id="note-takeaways"
                      className="p-6 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#795548]/40 space-y-3 scroll-mt-24"
                    >
                      <h2 className="text-base font-extrabold text-[#B83232] dark:text-[#F2C94C] flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Important Points to Remember for Examinations</span>
                      </h2>
                      <ul className="list-disc pl-6 space-y-2 text-[14px] leading-relaxed text-[#292929] dark:text-[#E5E0DB] marker:text-[#B83232]">
                        {activeNote.importantPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="bg-white dark:bg-[#292929] rounded-2xl p-10 sm:p-14 border border-[#E5DFD9] dark:border-[#3D3835] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C] flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
                  {activeSubject.code} · Unit {selectedUnit}
                </span>
                <h2 className="text-lg font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                  {selectedTopic || 'Select a Topic from the Syllabus Tree'}
                </h2>
                <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                  No generated study note is saved under this topic yet. Choose a format from the{' '}
                  <strong>floating generation toolbar</strong> below (Detailed Notes, 2-Mark, 5-Mark, 10-Mark, or Solved Examples) to synthesize a grounded university manuscript.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FLOATING GENERATION TOOLBAR (Sticky Bottom Dock — Hidden when printing) */}
      <div className="sticky bottom-4 z-30 print:hidden">
        <div className="bg-[#292929]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-4 border border-[#795548]/70 shadow-2xl space-y-2.5">
          {/* Optional Subtopic Pop-Up Bar */}
          {showSubtopicInput && (
            <div className="flex items-center gap-2 pb-2 border-b border-white/15">
              <input
                type="text"
                value={customSubtopic}
                onChange={e => setCustomSubtopic(e.target.value)}
                placeholder={`Optional subtopic focus for "${selectedTopic}" (e.g. LR Rotation, Strict 2PL, Master Theorem)...`}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#795548]/60 text-xs text-white placeholder-[#BDB7B2] focus:outline-hidden focus:ring-1 focus:ring-[#F2C94C]"
              />
              <button
                type="button"
                onClick={() => {
                  setCustomSubtopic('');
                  setShowSubtopicInput(false);
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#D7CCC8] hover:text-white bg-white/10"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Active Topic Context + Subtopic Toggle */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#F2C94C] font-bold">
                  AI Notes Toolbar · {activeSubjectCode} · Unit {selectedUnit}
                </div>
                <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-sm">
                  {selectedTopic || activeSubject.name}
                  {customSubtopic.trim() ? ` — ${customSubtopic.trim()}` : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubtopicInput(v => !v)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 border transition-colors ${
                  showSubtopicInput || customSubtopic.trim()
                    ? 'bg-[#F2C94C] text-[#292929] border-[#F2C94C]'
                    : 'bg-white/10 text-[#D7CCC8] border-white/15 hover:text-white'
                }`}
                title="Focus on a specific subtopic"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Subtopic</span>
              </button>
            </div>

            {/* Generation Mode Buttons: Detailed, 2-Mark, 5-Mark, 10-Mark, Solved Examples, Revision */}
            <div className="flex flex-wrap items-center gap-1.5">
              {!isOnline && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#B83232]/25 border border-[#B83232]/60 text-[11px] font-bold text-[#F2C94C] mr-1">
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline — Cached Notes Active
                </span>
              )}
              {GENERATION_MODES.map(item => {
                const isThisLoading = isGenerating && generatingMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    disabled={isGenerating || !isOnline}
                    onClick={() => handleGenerate(item.mode)}
                    title={!isOnline ? 'Reconnect to generate new notes' : item.shortDesc}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                      item.primary
                        ? 'bg-[#B83232] hover:bg-[#9E2A2A] text-white shadow-sm'
                        : 'bg-[#1E1E1E] hover:bg-black text-[#F7F5F2] border border-[#795548]/60 hover:border-[#F2C94C]'
                    }`}
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isThisLoading ? 'animate-spin text-[#F2C94C]' : 'text-[#F2C94C]'
                      }`}
                    />
                    <span>{isThisLoading ? 'Generating...' : item.toolbarLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
