import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  Layers,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { StudyResourceKey } from '../../types';

const RESOURCE_LABELS: Record<StudyResourceKey, string> = {
  'study-notes': 'Study Notes & PDFs',
  'coding-lab': 'Python Coding Lab',
  'practice-arena': 'Practice Arena',
  flashcards: 'AI Flashcards',
  assignments: 'Assignments & Exams',
  subjects: 'Core Subject Modules',
};

const formatSummaryDuration = (totalSeconds: number) => {
  if (totalSeconds <= 0) return '0s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  return `${secs}s`;
};

export const StudySessionSummaryModal: React.FC = () => {
  const {
    pendingSessionSummary,
    allSubjects,
    dismissSessionSummaryModal,
    logSessionSummaryToReports,
    setCurrentPage,
  } = usePortal();

  const [sessionNotes, setSessionNotes] = useState('');

  if (!pendingSessionSummary) return null;

  const subjectDetails = pendingSessionSummary.subjectsCovered.map(code => {
    if (code === 'ALL') {
      return {
        code: 'MCA Sem 1',
        name: 'All Semester 1 Subjects',
      };
    }
    const found = allSubjects.find(s => s.code === code);
    return {
      code,
      name: found?.name || code,
    };
  });

  const handleLogOnly = () => {
    logSessionSummaryToReports(sessionNotes);
    setSessionNotes('');
  };

  const handleLogAndOpenReports = () => {
    logSessionSummaryToReports(sessionNotes);
    setSessionNotes('');
    setCurrentPage('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDismiss = () => {
    setSessionNotes('');
    dismissSessionSummaryModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-session-summary-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#292929] border-2 border-[#795548]/50 shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="px-6 py-4 bg-[#292929] text-white border-b border-[#795548]/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B83232] text-[#F2C94C] flex items-center justify-center border border-[#F2C94C]/40 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2C94C] block">
                Pomodoro Focus Complete
              </span>
              <h2
                id="study-session-summary-title"
                className="text-lg font-extrabold text-white tracking-tight"
              >
                Study Session Summary
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Study Session Summary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Total Time Spent KPI */}
          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#292929] text-[#F2C94C] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]">
                  Total Time Spent
                </p>
                <p className="text-2xl font-mono font-extrabold text-[#B83232] dark:text-[#F2C94C]">
                  {formatSummaryDuration(pendingSessionSummary.totalSeconds)}
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="font-mono font-bold text-[#292929] dark:text-[#F7F5F2]">
                {pendingSessionSummary.completedDate}
              </p>
              <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                Ended at {pendingSessionSummary.completedAt}
              </p>
            </div>
          </div>

          {/* Subjects Covered */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
              <span>Subjects Covered ({subjectDetails.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjectDetails.map(subj => (
                <div
                  key={subj.code}
                  className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center gap-2"
                >
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#B83232] text-white shrink-0">
                    {subj.code}
                  </span>
                  <span className="text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] truncate">
                    {subj.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Resources Used */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
              <span>Resources Studied</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {pendingSessionSummary.resourcesCovered.map(resKey => (
                <span
                  key={resKey}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFEBE9] dark:bg-[#1E1E1E] border border-[#795548]/30 text-xs font-bold text-[#292929] dark:text-[#F2C94C]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{RESOURCE_LABELS[resKey] || resKey}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Optional Session Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="study-summary-notes"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]"
            >
              Session Highlights / Topic Notes (Optional)
            </label>
            <textarea
              id="study-summary-notes"
              rows={2}
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="e.g., Revised Graph Theory theorems and solved 3 Python lab tasks..."
              className="w-full rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] px-3 py-2 text-xs text-[#292929] dark:text-[#F7F5F2] focus:outline-none focus:ring-1 focus:ring-[#B83232]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-t border-[#E5DFD9] dark:border-[#3D3835] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-[#795548] dark:text-[#BDB7B2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleLogOnly}
              className="px-4 py-2 rounded-lg bg-[#292929] hover:bg-black text-[#F2C94C] text-xs font-bold border border-[#795548]/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Log to Academic Reports</span>
            </button>

            <button
              type="button"
              onClick={handleLogAndOpenReports}
              className="px-4 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Log &amp; View Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
