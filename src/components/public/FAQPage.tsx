import React, { useState, useMemo } from 'react';
import { FAQS } from '../../data/academicData';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true
  });

  const categories = ['All', 'Accounts', 'Curriculum', 'Examinations', 'Coding Lab', 'Materials', 'Reports'];

  const toggleAccordion = (id: string) => {
    setOpenFaqIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(faq => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Support Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-[#795548] dark:text-stone-300 max-w-xl mx-auto">
          Find instant answers to common questions regarding student login, examinations, Python coding sandbox, and academic grade reports.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by keyword (e.g. grading, Python, login, subjects)..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 text-xs sm:text-sm text-[#292929] dark:text-white placeholder:text-stone-400 focus:border-[#B83232] focus:ring-1 focus:ring-[#B83232] transition-colors shadow-xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#292929] rounded-xl border border-stone-800">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-[#B83232] text-white shadow-xs font-semibold'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800">
            <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#292929] dark:text-white">No matching answers found</p>
            <p className="text-xs text-[#795548] dark:text-stone-400 mt-1">
              Try adjusting your search terms or select "All" categories.
            </p>
          </div>
        ) : (
          filteredFaqs.map(faq => {
            const isOpen = !!openFaqIds[faq.id];
            return (
              <div
                key={faq.id}
                className="rounded-xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-stone-800 text-[#B83232] dark:text-[#F2C94C] shrink-0 border border-stone-200 dark:border-stone-700">
                      {faq.category}
                    </span>
                    <span className="text-sm font-bold text-[#292929] dark:text-white leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#795548] dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800/80">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
