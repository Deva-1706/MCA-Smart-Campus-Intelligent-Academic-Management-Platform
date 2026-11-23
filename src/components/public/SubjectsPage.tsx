import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  Calculator,
  Network,
  Database,
  Code,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Bookmark,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const { allSubjects, selectedSubject, setSelectedSubject, setCurrentPage, currentUser, toggleBookmark, isBookmarked } = usePortal();
  const [activeUnitSubjectId, setActiveUnitSubjectId] = useState<string | null>(selectedSubject?.id || allSubjects[0].id);

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return Calculator;
      case 'Network': return Network;
      case 'Database': return Database;
      case 'Code': return Code;
      default: return BookOpen;
    }
  };

  const handleLaunchLab = () => {
    if (currentUser) {
      setCurrentPage('coding-lab');
    } else {
      setCurrentPage('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTakeExam = () => {
    if (currentUser) {
      setCurrentPage('examinations');
    } else {
      setCurrentPage('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentActiveSubject = allSubjects.find(s => s.id === activeUnitSubjectId) || allSubjects[0];
  const Icon = getSubjectIcon(currentActiveSubject.iconName);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Semester 1 Curriculum
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Master of Computer Applications Subjects
        </h1>
        <p className="text-sm sm:text-base text-[#795548] dark:text-stone-300 leading-relaxed">
          Four foundational courses carefully sequenced to establish mathematical rigor, computational efficiency, enterprise database management, and idiomatic Python systems engineering.
        </p>
      </div>

      {/* Subject Selector Tabs / Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allSubjects.map(subject => {
          const SubjIcon = getSubjectIcon(subject.iconName);
          const isSelected = activeUnitSubjectId === subject.id;
          return (
            <button
              key={subject.id}
              onClick={() => {
                setActiveUnitSubjectId(subject.id);
                setSelectedSubject(subject);
              }}
              className={`text-left p-5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-white dark:bg-[#202020] border-[#B83232] shadow-md ring-1 ring-[#B83232]/30'
                  : 'bg-white/90 dark:bg-[#202020]/70 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#292929] text-white">
                  {subject.code}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    subject.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : subject.status === 'Active'
                      ? 'bg-[#B83232]/10 text-[#B83232] border-[#B83232]/30 dark:text-[#F2C94C]'
                      : 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C] dark:border-amber-800'
                  }`}
                >
                  {subject.status || 'Upcoming'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#B83232] text-white' : 'bg-stone-100 dark:bg-stone-800 text-[#292929] dark:text-stone-300'}`}>
                  <SubjIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#292929] dark:text-white truncate">
                  {subject.name}
                </h2>
              </div>

              <p className="text-xs text-[#795548] dark:text-stone-400 line-clamp-2 mb-3">
                {subject.description}
              </p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
                <span className="text-[#B83232] dark:text-[#F2C94C] font-semibold text-[11px]">
                  {isSelected ? 'Currently Viewing' : 'Inspect Syllabus'}
                </span>
                <ArrowRight className="w-3 h-3 text-[#795548]" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Subject View */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-sm space-y-8">
        {/* Subject Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm px-2.5 py-1 rounded bg-[#292929] text-[#F2C94C]">
                {currentActiveSubject.code}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  currentActiveSubject.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : currentActiveSubject.status === 'Active'
                    ? 'bg-[#B83232]/10 text-[#B83232] border-[#B83232]/30 dark:text-[#F2C94C]'
                    : 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C] dark:border-amber-800'
                }`}
              >
                {currentActiveSubject.status || 'Upcoming'}
              </span>
              <span className="text-xs text-[#795548] dark:text-stone-400 font-medium">
                Sem {currentActiveSubject.semester ?? 1} · {currentActiveSubject.type} Course · {currentActiveSubject.credits} Credits
              </span>
              <button
                onClick={() =>
                  toggleBookmark({
                    id: `bm-subj-${currentActiveSubject.id}`,
                    title: `${currentActiveSubject.name} (${currentActiveSubject.code})`,
                    type: 'Subject',
                    refId: currentActiveSubject.id,
                    subtitle: `Semester 1 · ${currentActiveSubject.credits} Credits`,
                    tags: ['Syllabus', currentActiveSubject.code]
                  })
                }
                className="p-1.5 rounded text-stone-400 hover:text-[#B83232] dark:hover:text-[#F2C94C] transition-colors ml-2"
                title="Bookmark Subject"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isBookmarked(currentActiveSubject.id) ? 'fill-[#B83232] text-[#B83232] dark:fill-[#F2C94C] dark:text-[#F2C94C]' : ''
                  }`}
                />
              </button>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white">
              {currentActiveSubject.name}
            </h2>
            <p className="text-sm text-[#795548] dark:text-stone-300 max-w-3xl leading-relaxed">
              {currentActiveSubject.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleTakeExam}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors shadow-xs"
            >
              Take Practice Exam
            </button>
            <button
              onClick={handleLaunchLab}
              className="px-4 py-2 text-xs font-semibold text-[#292929] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 rounded-lg transition-colors border border-stone-200 dark:border-stone-700"
            >
              Launch Coding Lab
            </button>
          </div>
        </div>

        {/* Detailed 5-Unit Syllabus Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#292929] dark:text-white">
              Official 5-Unit Syllabus Breakdown
            </h3>
            <span className="text-xs text-[#795548] dark:text-stone-400">
              Instructor: <span className="font-medium text-[#292929] dark:text-stone-300">{currentActiveSubject.instructor}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentActiveSubject.units.map((unit) => (
              <div
                key={unit.unitNumber}
                className="p-5 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                    UNIT {unit.unitNumber}
                  </span>
                  <span className="text-[11px] text-[#795548] dark:text-stone-400">4-5 Lectures</span>
                </div>
                <h4 className="text-sm font-bold text-[#292929] dark:text-white">
                  {unit.title}
                </h4>
                <ul className="space-y-1.5 text-xs text-[#795548] dark:text-stone-300 pt-1">
                  {unit.topics.map((topic, tidx) => (
                    <li key={tidx} className="flex items-start gap-1.5">
                      <span className="text-[#B83232] dark:text-[#F2C94C] font-bold leading-none mt-1">·</span>
                      <span className="leading-snug">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Textbooks */}
        <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-stone-400">
            Recommended Reference Textbooks & Monographs
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentActiveSubject.referenceBooks.map((book, bidx) => (
              <div
                key={bidx}
                className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-[#F7F5F2] dark:bg-stone-800 text-xs text-[#292929] dark:text-stone-300 flex items-start gap-2.5"
              >
                <FileText className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
                <span className="leading-snug">{book}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
