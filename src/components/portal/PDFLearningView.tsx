import React, { useState, useEffect, useRef } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  FolderArchive,
  BookOpen,
  Sparkles,
  Bot,
  Download,
  CheckCircle2,
  Circle,
  Eye,
  X
} from 'lucide-react';
import { SubjectPDF } from '../../types';
import { StudyNotesGenerator } from './StudyNotesGenerator';
import { PDFChatAssistantView } from './PDFChatAssistantView';

export const PDFLearningView: React.FC = () => {
  const {
    currentUser,
    allSubjects,
    selectedSubject,
    subjectPdfs,
    isPdfCompleted,
    togglePdfCompletion,
    markPdfCompleted,
    markPdfViewed,
    getSubjectProgress
  } = usePortal();

  const studentName = currentUser?.name || 'MCA Student';
  const studentFirstName = studentName.split(' ')[0];
  const studentRoll = currentUser?.rollNumber || currentUser?.studentId || 'MCA2401';
  const advisorName = currentUser?.advisorName || 'HCASICAN';

  const [activeSubjectCode, setActiveSubjectCode] = useState<string>(
    selectedSubject?.code || '435C1A'
  );
  const [activeTab, setActiveTab] = useState<'pdf_library' | 'study_packs' | 'chat_assistant'>('pdf_library');
  const [readingPdf, setReadingPdf] = useState<SubjectPDF | null>(null);

  // Dynamic Scroll-Tracking Reading Progress Indicator
  const studyContainerRef = useRef<HTMLDivElement>(null);
  const [scrollReadingProgress, setScrollReadingProgress] = useState<number>(0);

  useEffect(() => {
    if (selectedSubject?.code) {
      setActiveSubjectCode(selectedSubject.code);
    }
  }, [selectedSubject]);

  useEffect(() => {
    const updateScrollProgress = () => {
      const container = studyContainerRef.current;
      if (container && typeof container.getBoundingClientRect === 'function') {
        const rect = container.getBoundingClientRect();
        const totalScrollable = Math.max(1, container.scrollHeight - window.innerHeight * 0.65);
        const scrolledPastTop = Math.max(0, -rect.top + window.innerHeight * 0.15);
        const pct = Math.min(100, Math.max(0, Math.round((scrolledPastTop / totalScrollable) * 100)));
        setScrollReadingProgress(pct);
      } else {
        const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
        setScrollReadingProgress(pct);
      }
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, [activeTab, activeSubjectCode]);

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const activeSubject = allSubjects.find(s => s.code === activeSubjectCode) || allSubjects[0];
  const publishedPdfs = subjectPdfs.filter(p => p.status !== 'Draft');
  const activeSubjectPdfs = publishedPdfs.filter(p => p.subjectCode === activeSubjectCode);

  const handleOpenReader = (pdf: SubjectPDF) => {
    markPdfViewed(pdf.id);
    setReadingPdf(pdf);
  };

  const triggerPdfExport = (type: string, pdfId?: string) => {
    if (pdfId) {
      markPdfViewed(pdfId);
      markPdfCompleted(pdfId);
    }
    setDownloadNotice(`Prepared ${type} for ${studentName} (Roll: ${studentRoll}). Course materials progress updated.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div ref={studyContainerRef} className="space-y-6">
      {/* Sticky Live Reading Scroll Progress Bar */}
      <div
        role="progressbar"
        aria-label="Study Material Reading Scroll Progress"
        aria-valuenow={scrollReadingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="sticky top-16 z-20 -mx-1 px-4 py-2.5 rounded-xl bg-white/95 dark:bg-[#292929]/95 backdrop-blur-md border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
          <span className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
            Active Reading Progress · {activeSubject.code} {activeSubject.name}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-44 sm:w-64">
          <div className="flex-1 h-2 bg-[#EFEBE9] dark:bg-[#1E1E1E] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B83232] dark:bg-[#F2C94C] transition-all duration-150 rounded-full"
              style={{ width: `${scrollReadingProgress}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold tabular-nums text-[#B83232] dark:text-[#F2C94C] w-10 text-right">
            {scrollReadingProgress}%
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <FolderArchive className="w-4 h-4" /> Academic PDF & AI Study Repository
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            Learning Materials & AI Study Packs
          </h1>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">
            Scholar: <span className="font-bold text-[#292929] dark:text-white">{studentName}</span> · Roll No: <span className="font-mono text-[#B83232] dark:text-[#F2C94C]">{studentRoll}</span> · Advisor: <span className="font-bold text-[#795548] dark:text-[#F2C94C]">{advisorName}</span>
          </p>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3 bg-[#B83232]/10 border border-[#B83232]/30 rounded-xl text-xs font-semibold text-[#B83232] dark:text-[#F2C94C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#B83232]" />
            <span>{downloadNotice}</span>
          </div>
          <span className="text-[11px] font-mono text-[#6E6863] dark:text-[#BDB7B2]">PDF Ready</span>
        </div>
      )}

      {/* Subject Knowledge Base Switcher */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {allSubjects.map(sub => {
          const isSelected = activeSubjectCode === sub.code;
          const pdfList = publishedPdfs.filter(p => p.subjectCode === sub.code);
          const pdfCount = pdfList.length;
          const subProgress = getSubjectProgress(sub.code);
          const materialsRatio =
            subProgress.totalMaterials > 0
              ? Math.round((subProgress.completedMaterials / subProgress.totalMaterials) * 100)
              : 0;

          return (
            <button
              key={sub.code}
              onClick={() => setActiveSubjectCode(sub.code)}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-white dark:bg-[#292929] border-[#B83232] shadow-md ring-2 ring-[#B83232]/20'
                  : 'bg-white dark:bg-[#292929] border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isSelected
                    ? 'bg-[#B83232] text-white'
                    : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#F2C94C]'
                }`}>
                  {sub.code}
                </span>
                <div className="flex items-center gap-1.5">
                  {materialsRatio === 100 && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="text-[11px] font-mono font-bold text-[#6E6863] dark:text-[#BDB7B2]">
                    {pdfCount} PDF{pdfCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2] line-clamp-1">
                {sub.name}
              </h3>
              <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-0.5 line-clamp-1">
                {sub.instructor}
              </p>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#6E6863] dark:text-[#BDB7B2] font-medium">
                    Materials Progress
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[#B83232] dark:text-[#F2C94C]">
                    {subProgress.completedMaterials}/{subProgress.totalMaterials} ({materialsRatio}%)
                  </span>
                </div>
                <div className="w-full bg-[#E5DFD9] dark:bg-[#1E1E1E] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      materialsRatio === 100
                        ? 'bg-emerald-500'
                        : 'bg-[#B83232]'
                    }`}
                    style={{ width: `${materialsRatio}%` }}
                  />
                </div>
              </div>

              {isSelected && (
                <div className="w-full h-1 bg-[#B83232] absolute bottom-0 left-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Subject Materials Progress Bar Strip */}
      {(() => {
        const activeProgress = getSubjectProgress(activeSubject.code);
        const matPercent =
          activeProgress.totalMaterials > 0
            ? Math.round((activeProgress.completedMaterials / activeProgress.totalMaterials) * 100)
            : 0;
        return (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-extrabold tabular-nums text-xs shrink-0 ${
                matPercent === 100
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-[#B83232]/10 text-[#B83232] dark:bg-[#B83232]/20 dark:text-[#F2C94C]'
              }`}>
                {matPercent}%
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                    {activeSubject.code} · {activeSubject.name} Reading & Revision Progress
                  </h4>
                </div>
                <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
                  {activeProgress.completedMaterials} of {activeProgress.totalMaterials} PDFs & Study Packs completed · Overall Course Progress: <strong className="text-[#B83232] dark:text-[#F2C94C]">{activeProgress.percentage}%</strong>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-56 shrink-0">
              <div className="w-full bg-[#E5DFD9] dark:bg-[#1E1E1E] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    matPercent === 100
                      ? 'bg-emerald-500'
                      : 'bg-[#B83232]'
                  }`}
                  style={{ width: `${matPercent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Student-Only Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5DFD9] dark:border-[#3D3835] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pdf_library')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pdf_library'
              ? 'bg-[#B83232] text-white'
              : 'text-[#6E6863] dark:text-[#BDB7B2] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#F2C94C]" />
          <span>Official Faculty Content &amp; Reader ({activeSubjectPdfs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('study_packs')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'study_packs'
              ? 'bg-[#B83232] text-white'
              : 'text-[#6E6863] dark:text-[#BDB7B2] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
          <span>AI Study Materials &amp; Model Answers</span>
        </button>
        <button
          onClick={() => setActiveTab('chat_assistant')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'chat_assistant'
              ? 'bg-[#B83232] text-white'
              : 'text-[#6E6863] dark:text-[#BDB7B2] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-[#F2C94C]" />
          <span>Ask Your Subject (Grounded AI Tutor)</span>
        </button>
      </div>

      {activeTab === 'study_packs' && (
        <StudyNotesGenerator
          activeSubjectCode={activeSubjectCode}
          onSubjectChange={setActiveSubjectCode}
        />
      )}

      {activeTab === 'chat_assistant' && (
        <PDFChatAssistantView
          embedded
          embeddedSubjectCode={activeSubjectCode}
          onSubjectFilterChange={setActiveSubjectCode}
        />
      )}

      {activeTab === 'pdf_library' && (
        activeSubjectPdfs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-center space-y-2">
            <BookOpen className="w-8 h-8 text-[#795548] dark:text-[#F2C94C] mx-auto opacity-70" />
            <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
              No published faculty content available for this unit yet.
            </p>
            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
              Faculty materials appear here automatically once authored and published for {activeSubject.code}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubjectPdfs.map(pdf => {
              const completed = isPdfCompleted(pdf.id);

              return (
                <div
                  key={pdf.id}
                  className={`bg-white dark:bg-[#292929] rounded-2xl p-6 border shadow-xs space-y-4 transition-all ${
                    completed
                      ? 'border-emerald-300 dark:border-emerald-900/70'
                      : 'border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#B83232]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        completed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-[#B83232]/10 text-[#B83232] dark:bg-[#B83232]/20 dark:text-rose-300'
                      }`}>
                        {completed ? <CheckCircle2 className="w-5 h-5" /> : 'PDF'}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#795548] dark:text-[#F2C94C]">
                          Unit {pdf.unit} · Sem {pdf.semester ?? 1}
                        </span>
                        <h4 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
                          {pdf.title}
                        </h4>
                        <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] font-mono">
                          {pdf.fileName}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                      completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C]'
                    }`}>
                      {completed ? 'Completed' : 'Ready to Read'}
                    </span>
                  </div>

                  {pdf.description && (
                    <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed line-clamp-2">
                      {pdf.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
                    <div>
                      <span className="text-[#6E6863] dark:text-[#BDB7B2] text-[11px]">Pages: </span>
                      <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">{pdf.pageCount}</span>
                    </div>
                    <div>
                      <span className="text-[#6E6863] dark:text-[#BDB7B2] text-[11px]">File Size: </span>
                      <span className="font-mono text-[#292929] dark:text-[#F7F5F2]">{pdf.fileSize}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {pdf.topicsCovered.map((top, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
                      >
                        {top}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenReader(pdf)}
                      className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#B83232] hover:bg-[#9E2A2A] text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Content</span>
                    </button>

                    <button
                      onClick={() => togglePdfCompletion(pdf.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                        completed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C] border-[#B83232]/30 hover:bg-[#B83232]/20'
                      }`}
                    >
                      {completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => triggerPdfExport(pdf.fileName, pdf.id)}
                      className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] hover:bg-[#EFEBE9] transition-colors flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-[#B83232]" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Inline Faculty Content Read Viewer Modal */}
      {readingPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Reading ${readingPdf.title}`}
        >
          <div className="bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DFD9] dark:border-[#3D3835]">
              <div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#B83232] text-white">
                  {readingPdf.subjectCode} · Unit {readingPdf.unit}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#292929] dark:text-[#F7F5F2] mt-2">
                  {readingPdf.title}
                </h3>
                <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-0.5">
                  {readingPdf.topic || readingPdf.chapter} · {readingPdf.pageCount} Pages · Uploaded by {readingPdf.uploadedBy}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReadingPdf(null)}
                aria-label="Close content reader"
                className="p-2 rounded-xl text-[#6E6863] hover:text-[#B83232] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {readingPdf.description && (
              <div className="p-4 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#795548] dark:text-[#F2C94C]">
                  Module Overview
                </span>
                <p className="text-[#292929] dark:text-[#F7F5F2] leading-relaxed">{readingPdf.description}</p>
              </div>
            )}

            {readingPdf.learningObjectives && readingPdf.learningObjectives.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#B83232] dark:text-[#F2C94C]">
                  Learning Objectives
                </span>
                <ul className="space-y-1.5 pl-4 list-disc text-[#292929] dark:text-[#F7F5F2]">
                  {readingPdf.learningObjectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#795548] dark:text-[#F2C94C]">
                Indexed Pages &amp; Excerpts
              </span>
              {readingPdf.pageReferences.map((ref, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-[#292929] dark:text-[#F7F5F2]">
                    <span>{ref.heading}</span>
                    <span className="font-mono text-[#B83232] dark:text-[#F2C94C]">Page {ref.pageNumber}</span>
                  </div>
                  <p className="text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">{ref.snippet}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]">
              <button
                type="button"
                onClick={() => {
                  markPdfCompleted(readingPdf.id);
                  setReadingPdf(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed &amp; Close</span>
              </button>
              <button
                type="button"
                onClick={() => setReadingPdf(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
