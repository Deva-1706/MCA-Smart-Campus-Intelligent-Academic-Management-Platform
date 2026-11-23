import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  Search,
  X,
  ArrowRight,
  BookOpen,
  FileSpreadsheet,
  FolderArchive,
  FileCheck2,
  Terminal,
  Sparkles
} from 'lucide-react';

export type SearchFilterCategory =
  | 'All'
  | 'Subjects'
  | 'Assignments'
  | 'Materials'
  | 'Exams'
  | 'Coding Lab';

interface SearchResultItem {
  id: string;
  filterGroup: Exclude<SearchFilterCategory, 'All'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge: string;
  onSelect: () => void;
}

const FILTER_TABS: { id: SearchFilterCategory; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Subjects', label: 'Subjects' },
  { id: 'Assignments', label: 'Assignments' },
  { id: 'Materials', label: 'Materials & PDFs' },
  { id: 'Exams', label: 'Exams' },
  { id: 'Coding Lab', label: 'Coding Lab' },
];

export const GlobalSearchBar: React.FC = () => {
  const {
    allSubjects,
    assignments,
    subjectPdfs,
    allMaterials,
    generatedStudyNotes,
    allExaminations,
    allCodingProblems,
    setSelectedSubject,
    setActiveAssignment,
    setActiveMaterialPreview,
    setActiveExam,
    setCurrentPage,
  } = usePortal();

  const [query, setQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterCategory>('All');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Build unified index of portal academic resources
  const indexedResources = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    allSubjects.forEach(subj => {
      list.push({
        id: `gs-subj-${subj.code}`,
        filterGroup: 'Subjects',
        categoryLabel: 'Subject',
        title: `${subj.code} · ${subj.name}`,
        subtitle: `${subj.credits} Credits · ${subj.instructor} · ${subj.units.map(u => u.title).join(', ')}`,
        badge: subj.code,
        onSelect: () => {
          setSelectedSubject(subj);
          setCurrentPage('my-subjects');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    assignments.forEach(asg => {
      list.push({
        id: `gs-asg-${asg.id}`,
        filterGroup: 'Assignments',
        categoryLabel: 'Assignment',
        title: asg.title,
        subtitle: `${asg.subjectCode} · ${asg.chapter} · ${asg.status} · Due ${asg.dueDate}`,
        badge: `${asg.totalMarks} Marks`,
        onSelect: () => {
          setActiveAssignment(asg);
          setCurrentPage('assignments');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    generatedStudyNotes.forEach(note => {
      const matchedSubj = allSubjects.find(s => s.code === note.subjectCode) || null;
      list.push({
        id: `gs-note-${note.id}`,
        filterGroup: 'Materials',
        categoryLabel: 'Study Note',
        title: note.title,
        subtitle: `${note.subjectCode} · Unit ${note.unit} · ${note.topic} · ${note.mode}`,
        badge: note.mode,
        onSelect: () => {
          if (matchedSubj) setSelectedSubject(matchedSubj);
          setCurrentPage('materials');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    subjectPdfs.forEach(pdf => {
      const matchedSubj = allSubjects.find(s => s.code === pdf.subjectCode) || null;
      list.push({
        id: `gs-pdf-${pdf.id}`,
        filterGroup: 'Materials',
        categoryLabel: 'Course PDF',
        title: pdf.title,
        subtitle: `${pdf.subjectCode} · Unit ${pdf.unit} · ${pdf.fileName} · ${pdf.topicsCovered.join(', ')}`,
        badge: `${pdf.pageCount}p PDF`,
        onSelect: () => {
          if (matchedSubj) setSelectedSubject(matchedSubj);
          setCurrentPage('materials');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    allMaterials.forEach(mat => {
      const matchedSubj = allSubjects.find(s => s.code === mat.subjectCode) || null;
      list.push({
        id: `gs-mat-${mat.id}`,
        filterGroup: 'Materials',
        categoryLabel: 'Material',
        title: mat.title,
        subtitle: `${mat.subjectCode} · Unit ${mat.unit} · ${mat.summary}`,
        badge: mat.category,
        onSelect: () => {
          if (matchedSubj) setSelectedSubject(matchedSubj);
          setActiveMaterialPreview(mat);
          setCurrentPage('materials');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    allExaminations.forEach(exam => {
      list.push({
        id: `gs-exam-${exam.id}`,
        filterGroup: 'Exams',
        categoryLabel: 'Examination',
        title: exam.title,
        subtitle: `${exam.subjectCode} · ${exam.subjectName} · ${exam.durationMinutes}m · Due ${exam.dueDate}`,
        badge: exam.status,
        onSelect: () => {
          setActiveExam(exam);
          setCurrentPage('examinations');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    allCodingProblems.forEach(prob => {
      list.push({
        id: `gs-code-${prob.id}`,
        filterGroup: 'Coding Lab',
        categoryLabel: 'Coding Lab',
        title: prob.title,
        subtitle: `${prob.category} · ${prob.description}`,
        badge: prob.difficulty,
        onSelect: () => {
          setCurrentPage('coding-lab');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
    });

    return list;
  }, [
    allSubjects,
    assignments,
    generatedStudyNotes,
    subjectPdfs,
    allMaterials,
    allExaminations,
    allCodingProblems,
    setSelectedSubject,
    setActiveAssignment,
    setActiveMaterialPreview,
    setActiveExam,
    setCurrentPage,
  ]);

  // Filterable state combining category chip + text query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indexedResources
      .filter(item => {
        if (activeFilter !== 'All' && item.filterGroup !== activeFilter) return false;
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [indexedResources, activeFilter, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, activeFilter]);

  const handleSelectItem = (item: SearchResultItem) => {
    item.onSelect();
    setIsOpen(false);
  };

  const renderCategoryIcon = (group: SearchResultItem['filterGroup']) => {
    switch (group) {
      case 'Subjects':
        return <BookOpen className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />;
      case 'Assignments':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />;
      case 'Materials':
        return <FolderArchive className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />;
      case 'Exams':
        return <FileCheck2 className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />;
      case 'Coding Lab':
        return <Terminal className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className="relative mt-5 pt-5 border-t border-[#795548]/40 space-y-2.5">
      {/* Search Input Row */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#F2C94C] absolute left-3.5 pointer-events-none" />
        <input
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'ArrowDown' && filteredResults.length > 0) {
              e.preventDefault();
              setIsOpen(true);
              setHighlightedIndex(prev => (prev + 1) % filteredResults.length);
            } else if (e.key === 'ArrowUp' && filteredResults.length > 0) {
              e.preventDefault();
              setIsOpen(true);
              setHighlightedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
            } else if (e.key === 'Enter' && filteredResults.length > 0) {
              e.preventDefault();
              handleSelectItem(filteredResults[highlightedIndex] || filteredResults[0]);
            }
          }}
          placeholder="Search subjects (435C1A–435C1C), assignments, PDFs, study notes, exams, or coding lab..."
          aria-label="Global academic search"
          className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#1E1E1E] border border-[#795548]/60 text-xs sm:text-sm text-white placeholder-[#BDB7B2] focus:outline-hidden focus:ring-2 focus:ring-[#F2C94C] transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
            }}
            className="absolute right-3 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-[#D7CCC8] hover:text-white bg-[#292929] border border-[#795548]/50"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        ) : (
          <span className="hidden sm:inline-block absolute right-3.5 text-[10px] font-mono text-[#BDB7B2] px-2 py-0.5 rounded bg-[#292929] border border-[#795548]/40">
            Quick Jump
          </span>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter search scope">
        {FILTER_TABS.map(tab => {
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveFilter(tab.id);
                setIsOpen(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border ${
                active
                  ? 'bg-[#B83232] text-white border-[#B83232]'
                  : 'bg-[#1E1E1E] text-[#D7CCC8] border-[#795548]/50 hover:text-white hover:border-[#F2C94C]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Dropdown Panel */}
      {isOpen && (query.trim().length > 0 || activeFilter !== 'All') && (
        <div className="absolute left-0 right-0 mt-1 z-40 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-2xl overflow-hidden text-[#292929] dark:text-[#F7F5F2]">
          <div className="px-4 py-2 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-b border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#795548] dark:text-[#F2C94C]">
              {filteredResults.length > 0
                ? `${filteredResults.length} matching ${activeFilter === 'All' ? 'portal resource' : activeFilter.toLowerCase()}${filteredResults.length === 1 ? '' : 's'}`
                : 'No matching resources found'}
            </span>
            <span className="text-[#6E6863] dark:text-[#BDB7B2] font-mono hidden sm:inline">
              ↑/↓ Navigate · Enter to Open · Esc to Close
            </span>
          </div>

          {filteredResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto divide-y divide-[#E5DFD9] dark:divide-[#3D3835]">
              {filteredResults.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                      isHighlighted
                        ? 'bg-[#F7F5F2] dark:bg-[#1E1E1E]'
                        : 'hover:bg-[#F7F5F2]/70 dark:hover:bg-[#1E1E1E]/70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{renderCategoryIcon(item.filterGroup)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#B83232]/10 text-[#B83232] dark:bg-[#B83232]/25 dark:text-[#F2C94C] shrink-0">
                            {item.categoryLabel}
                          </span>
                          <span className="text-xs sm:text-sm font-bold truncate">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#795548] dark:text-[#F2C94C]">
                        {item.badge}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center space-y-1.5">
              <Sparkles className="w-5 h-5 text-[#B83232] dark:text-[#F2C94C] mx-auto" />
              <p className="text-xs font-bold">
                No {activeFilter === 'All' ? 'portal items' : activeFilter.toLowerCase()} matched "{query}"
              </p>
              <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
                Switch filter to All or try searching a course code (435C1A, 435C1B, 435E1A, 435C1C), topic, or assignment title.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
