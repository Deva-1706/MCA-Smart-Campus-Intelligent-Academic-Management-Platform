import React, { useState, useMemo } from 'react';
import { usePortal } from '../../context/PortalContext';
import { LearningMaterial } from '../../types';
import {
  Search,
  FolderArchive,
  FileText,
  Bookmark,
  Download,
  Eye,
  X,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Circle
} from 'lucide-react';

export const LearningMaterialsView: React.FC = () => {
  const {
    allMaterials,
    allSubjects,
    toggleBookmark,
    isBookmarked,
    activeMaterialPreview,
    setActiveMaterialPreview,
    isMaterialCompleted,
    toggleMaterialCompletion,
    markMaterialCompleted
  } = usePortal();

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const categories = ['All', 'Lecture Notes', 'Lab Manual', 'Question Bank', 'Reference Sheet'];

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter(m => {
      const matchSubject = selectedSubjectCode === 'All' || m.subjectCode === selectedSubjectCode;
      const matchCategory = selectedCategory === 'All' || m.category === selectedCategory;
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchCategory && matchSearch;
    });
  }, [allMaterials, selectedSubjectCode, selectedCategory, searchQuery]);

  const handleDownload = (mat: LearningMaterial) => {
    // Generate text/markdown blob for real browser download
    const blob = new Blob([mat.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${mat.subjectCode}_Unit${mat.unit}_${mat.title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    markMaterialCompleted(mat.id);
    setDownloadSuccessToast(`Downloaded & marked completed: ${mat.title}`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  const completedCount = allMaterials.filter(m => isMaterialCompleted(m.id)).length;
  const completionPct = allMaterials.length > 0 ? Math.round((completedCount / allMaterials.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header & Progress */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Academic Repository
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Digital Learning Materials
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Faculty-verified lecture notes, unit monographs, lab manuals, and previous year model question papers.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-[#292929] dark:text-white">Materials Completed</span>
            <span className="font-mono text-[#B83232] dark:text-[#F2C94C]">
              {completedCount}/{allMaterials.length} ({completionPct}%)
            </span>
          </div>
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#B83232] to-[#F2C94C]'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {downloadSuccessToast && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-stone-900 border border-[#F2C94C] text-[#292929] dark:text-[#F2C94C] text-xs font-semibold">
          {downloadSuccessToast}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search learning materials by title, keyword, or unit..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F5F2] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-[#292929] dark:text-white focus:border-[#B83232] transition-colors"
          />
        </div>

        {/* Filter Rows */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Subject Filter */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-[#795548] dark:text-stone-400 mr-2 text-[11px] uppercase font-semibold">Course:</span>
            <button
              onClick={() => setSelectedSubjectCode('All')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedSubjectCode === 'All'
                  ? 'bg-[#B83232] text-white font-bold'
                  : 'bg-stone-100 text-[#292929] dark:bg-stone-800 dark:text-stone-300 hover:text-white hover:bg-[#B83232]'
              }`}
            >
              All Subjects
            </button>
            {allSubjects.map(s => (
              <button
                key={s.code}
                onClick={() => setSelectedSubjectCode(s.code)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors font-mono ${
                  selectedSubjectCode === s.code
                    ? 'bg-[#B83232] text-white font-bold'
                    : 'bg-stone-100 text-[#292929] dark:bg-stone-800 dark:text-stone-300 hover:text-white hover:bg-[#B83232]'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-[#795548] dark:text-stone-400 mr-2 text-[11px] uppercase font-semibold">Type:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#F2C94C]/25 text-[#292929] dark:text-[#F2C94C] font-bold border border-[#F2C94C]/40'
                    : 'text-[#795548] dark:text-stone-400 hover:text-[#292929] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map(mat => {
          const completed = isMaterialCompleted(mat.id);
          return (
            <div
              key={mat.id}
              className={`p-5 rounded-2xl bg-white dark:bg-[#202020] border shadow-xs flex flex-col justify-between transition-all ${
                completed
                  ? 'border-emerald-300 dark:border-emerald-900/70'
                  : 'border-stone-200 dark:border-stone-800 hover:border-[#B83232]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                    {mat.subjectCode} · Unit {mat.unit}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {completed && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-stone-800 text-[#795548] dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {mat.category}
                    </span>
                  </div>
                </div>

                <h2 className="text-sm font-bold text-[#292929] dark:text-white mb-2 leading-snug">
                  {mat.title}
                </h2>

                <p className="text-xs text-[#795548] dark:text-stone-400 leading-relaxed line-clamp-3 mb-3">
                  {mat.summary}
                </p>

                <div className="w-full bg-stone-200 dark:bg-stone-800 h-1 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completed ? 'bg-emerald-500 w-full' : 'bg-[#F2C94C] w-1/12'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-[11px] text-[#795548] dark:text-stone-400 font-mono">
                  {mat.fileFormat} · {mat.fileSize}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleMaterialCompletion(mat.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      completed
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-stone-400 hover:text-[#B83232] dark:hover:text-[#F2C94C]'
                    }`}
                    title={completed ? 'Marked Completed' : 'Mark as Completed'}
                  >
                    {completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() =>
                      toggleBookmark({
                        id: `bm-${mat.id}`,
                        title: mat.title,
                        type: 'Material',
                        refId: mat.id,
                        subtitle: `${mat.subjectCode} · ${mat.category}`,
                        tags: [mat.subjectCode, mat.category]
                      })
                    }
                    className="p-1.5 rounded-lg text-stone-400 hover:text-[#B83232] dark:hover:text-[#F2C94C] transition-colors"
                    title="Bookmark Resource"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isBookmarked(mat.id) ? 'fill-[#B83232] text-[#B83232] dark:fill-[#F2C94C] dark:text-[#F2C94C]' : ''}`}
                    />
                  </button>

                  <button
                    onClick={() => {
                      markMaterialCompleted(mat.id);
                      setActiveMaterialPreview(mat);
                    }}
                    className="p-1.5 rounded-lg text-[#292929] dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="Read in Browser"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownload(mat)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#292929] dark:text-stone-200 transition-colors flex items-center gap-1 border border-stone-200 dark:border-stone-700"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-Browser Reader Modal */}
      {activeMaterialPreview && (
        <div className="fixed inset-0 z-50 bg-[#292929]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                  {activeMaterialPreview.subjectCode} · Unit {activeMaterialPreview.unit}
                </span>
                <h3 className="text-base font-bold text-[#292929] dark:text-white truncate">
                  {activeMaterialPreview.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activeMaterialPreview)}
                  className="p-1.5 text-xs text-[#795548] hover:text-[#292929] dark:text-stone-300 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveMaterialPreview(null)}
                  className="p-1.5 text-stone-400 hover:text-[#292929] dark:hover:text-stone-200 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#292929] dark:text-stone-200 font-mono leading-relaxed bg-[#F7F5F2] dark:bg-stone-900 whitespace-pre-wrap">
              {activeMaterialPreview.content}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-[#795548] dark:text-stone-400">
              <span>{activeMaterialPreview.uploadDate} · {activeMaterialPreview.downloadCount} Total Downloads</span>
              <button
                onClick={() => setActiveMaterialPreview(null)}
                className="px-3 py-1.5 rounded-lg bg-[#B83232] text-white hover:bg-[#9E2A2A] font-medium"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
