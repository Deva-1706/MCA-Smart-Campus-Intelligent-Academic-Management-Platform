import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Bookmark, Trash2, ArrowRight, FolderArchive, Terminal, HelpCircle, BookOpen } from 'lucide-react';

export const BookmarksView: React.FC = () => {
  const { bookmarks, toggleBookmark, setCurrentPage, setSelectedSubject, allSubjects } = usePortal();
  const [filterType, setFilterType] = useState<string>('All');

  const filteredBookmarks = bookmarks.filter(b => {
    if (filterType === 'All') return true;
    return b.type === filterType;
  });

  const handleLaunch = (item: typeof bookmarks[0]) => {
    if (item.type === 'Material') {
      setCurrentPage('materials');
    } else if (item.type === 'Problem') {
      setCurrentPage('coding-lab');
    } else if (item.type === 'Question') {
      setCurrentPage('examinations');
    } else if (item.type === 'Subject') {
      const found = allSubjects.find(s => s.id === item.refId);
      if (found) setSelectedSubject(found);
      setCurrentPage('my-subjects');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Material': return FolderArchive;
      case 'Problem': return Terminal;
      case 'Question': return HelpCircle;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Personal Revision Vault
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Bookmarked Resources
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
          Quickly access saved lecture monographs, challenging algorithmic challenges, and examination problems.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#292929] rounded-xl border border-stone-800">
        {['All', 'Material', 'Problem', 'Subject'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === t
                ? 'bg-[#B83232] text-white shadow-xs font-semibold'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {t === 'All' ? 'All Bookmarks' : `${t}s`}
          </button>
        ))}
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 space-y-3">
          <Bookmark className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-base font-bold text-[#292929] dark:text-white">
            No Bookmarked Items Yet
          </h2>
          <p className="text-xs text-[#795548] dark:text-stone-400 max-w-sm mx-auto">
            Click the bookmark icon on any lecture note, Python coding challenge, or syllabus unit to store it here for pre-exam revision.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookmarks.map(b => {
            const Icon = getIcon(b.type);
            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-stone-800 text-[#B83232] dark:text-[#F2C94C] border border-stone-200 dark:border-stone-700">
                      {b.type}
                    </span>
                    <span className="text-[11px] text-[#795548] dark:text-stone-400 font-mono">
                      Added {b.addedAt}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[#F7F5F2] dark:bg-stone-800 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5 border border-stone-200 dark:border-stone-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#292929] dark:text-white leading-snug">
                        {b.title}
                      </h2>
                      <p className="text-xs text-[#795548] dark:text-stone-400 mt-0.5">
                        {b.subtitle}
                      </p>
                    </div>
                  </div>

                  {b.tags && b.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-3">
                      {b.tags.map((tag, tidx) => (
                        <span
                          key={tidx}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-stone-800 text-[#795548] dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-4">
                  <button
                    onClick={() => toggleBookmark(b)}
                    className="p-1.5 text-xs text-[#B83232] hover:text-[#9E2A2A] flex items-center gap-1 transition-colors font-medium"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <button
                    onClick={() => handleLaunch(b)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Open Resource</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
