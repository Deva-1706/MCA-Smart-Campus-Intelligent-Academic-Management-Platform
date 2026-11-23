import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  RefreshCw,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  HardDrive,
  WifiOff
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { FlashcardItem } from '../../types';

export const FlashcardsView: React.FC = () => {
  const {
    allSubjects,
    subjectPdfs,
    flashcardDecks,
    generateFlashcardDeck,
    updateFlashcardStatus,
    deleteFlashcardDeck,
    offlineCacheStats
  } = usePortal();

  const isOnline = useOnlineStatus();

  const [subjectCode, setSubjectCode] = useState<string>(allSubjects[0]?.code || '435C1A');
  const [unit, setUnit] = useState<number>(1);
  const [topic, setTopic] = useState<string>('All Unit Topics');
  const [cardCount, setCardCount] = useState<number>(6);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [reviewMissedOnly, setReviewMissedOnly] = useState<boolean>(false);

  const activeSubject = allSubjects.find(s => s.code === subjectCode) || allSubjects[0];
  const unitData = activeSubject?.units.find(u => u.unitNumber === unit);
  const matchingSubjectPdfs = subjectPdfs.filter(
    p => p.subjectCode === subjectCode && p.processingStatus === 'Completed'
  );

  const activeDeck =
    flashcardDecks.find(d => d.id === activeDeckId) || flashcardDecks[0] || null;

  const visibleCards = useMemo(() => {
    if (!activeDeck) return [];
    if (reviewMissedOnly) {
      return activeDeck.cards.filter(c => c.status === 'Need Revision');
    }
    return activeDeck.cards;
  }, [activeDeck, reviewMissedOnly]);

  const currentCard: FlashcardItem | null =
    visibleCards.length > 0 ? visibleCards[Math.min(currentIndex, visibleCards.length - 1)] : null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    if (!isOnline) {
      setGenError(
        'You are currently offline. Saved flashcard decks, card flipping, and mastery tracking remain fully available offline; reconnect to generate new AI decks.'
      );
      return;
    }
    setIsGenerating(true);

    const res = await generateFlashcardDeck({
      subjectCode,
      unit,
      topic,
      count: cardCount
    });

    setIsGenerating(false);
    if (res.error) {
      setGenError(res.error);
      return;
    }
    if (res.deck) {
      setActiveDeckId(res.deck.id);
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewMissedOnly(false);
    }
  };

  const handleMarkCard = (status: 'Known' | 'Need Revision') => {
    if (!activeDeck || !currentCard) return;
    updateFlashcardStatus(activeDeck.id, currentCard.id, status);
    setIsFlipped(false);
    if (currentIndex < visibleCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const knownCount = activeDeck ? activeDeck.cards.filter(c => c.status === 'Known').length : 0;
  const revisionCount = activeDeck
    ? activeDeck.cards.filter(c => c.status === 'Need Revision').length
    : 0;
  const deckProgress =
    activeDeck && activeDeck.cards.length > 0
      ? Math.round((knownCount / activeDeck.cards.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Active Recall &amp; PDF Revision
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            AI Flashcards &amp; Revision
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Generate grounded Q&amp;A flashcard decks from uploaded subject PDFs, flip to test recall, and review missed cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="p-3 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
            <div className="text-xs">
              <div className="text-[10px] uppercase text-[#795548] dark:text-stone-400 font-bold">Offline Cache</div>
              <div className="font-mono font-extrabold text-[#292929] dark:text-white">
                {offlineCacheStats.cachedCardsCount} Cards Ready
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#292929] text-white border border-[#795548]/40 flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#F2C94C]" />
            <div className="text-xs">
              <div className="text-[10px] uppercase text-stone-400 font-bold">Saved Decks</div>
              <div className="font-mono font-extrabold text-[#F2C94C]">{flashcardDecks.length} Decks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <form
        onSubmit={handleGenerate}
        className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] space-y-4 shadow-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Subject
            </label>
            <select
              value={subjectCode}
              onChange={e => {
                setSubjectCode(e.target.value);
                setUnit(1);
                setTopic('All Unit Topics');
              }}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white font-semibold"
            >
              {allSubjects.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Unit / Chapter
            </label>
            <select
              value={unit}
              onChange={e => {
                setUnit(Number(e.target.value));
                setTopic('All Unit Topics');
              }}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              {activeSubject?.units.map(u => (
                <option key={u.unitNumber} value={u.unitNumber}>
                  Unit {u.unitNumber}: {u.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Topic Focus
            </label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              <option value="All Unit Topics">All Unit Topics</option>
              {unitData?.topics.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Deck Size
            </label>
            <select
              value={cardCount}
              onChange={e => setCardCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              <option value={4}>4 Flashcards</option>
              <option value={6}>6 Flashcards</option>
              <option value={8}>8 Flashcards</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
          <div className="text-xs text-[#795548] dark:text-stone-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#F2C94C]" />
            {matchingSubjectPdfs.length > 0 ? (
              <span>
                Grounded in {matchingSubjectPdfs.length} uploaded PDF(s):{' '}
                <strong className="text-[#292929] dark:text-stone-200">
                  {matchingSubjectPdfs[0].fileName}
                </strong>
              </span>
            ) : (
              <span className="text-[#B83232] font-semibold">
                No uploaded PDF available for {subjectCode}.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-[#795548] dark:text-[#F2C94C]">
                <WifiOff className="w-3.5 h-3.5" />
                Offline Mode: Study Saved Decks Below
              </span>
            )}
            <button
              type="submit"
              disabled={isGenerating || !isOnline}
              className="px-5 py-2.5 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#F2C94C]" />}
              <span>{isGenerating ? 'Generating Deck...' : 'Generate AI Flashcards'}</span>
            </button>
          </div>
        </div>

        {genError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-[#B83232] dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{genError}</span>
          </div>
        )}
      </form>

      {/* Saved Decks + Active Study Stage */}
      {flashcardDecks.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-center space-y-2">
          <Layers className="w-8 h-8 text-[#795548] dark:text-[#F2C94C] mx-auto" />
          <h2 className="text-base font-extrabold text-[#292929] dark:text-white">
            No Flashcard Decks Saved Yet
          </h2>
          <p className="text-xs text-[#795548] dark:text-stone-400 max-w-md mx-auto">
            Select a subject, unit, and topic above to generate a PDF-grounded flashcard deck for active revision.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Saved Decks Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
              Saved Revision Decks
            </h3>
            {flashcardDecks.map(deck => {
              const deckKnown = deck.cards.filter(c => c.status === 'Known').length;
              const isSelected = activeDeck?.id === deck.id;
              return (
                <div
                  key={deck.id}
                  onClick={() => {
                    setActiveDeckId(deck.id);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                    setReviewMissedOnly(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-white dark:bg-[#292929] border-[#B83232] ring-1 ring-[#B83232]/30 shadow-xs'
                      : 'bg-white/70 dark:bg-[#202020] border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#292929] text-[#F2C94C]">
                      {deck.subjectCode} · Unit {deck.unit}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        deleteFlashcardDeck(deck.id);
                      }}
                      className="text-stone-400 hover:text-[#B83232] p-1"
                      title="Delete Deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-[#292929] dark:text-white leading-snug">
                    {deck.topic}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#795548] dark:text-stone-400 font-mono">
                    <span>{deckKnown}/{deck.cards.length} Known</span>
                    <span>{deck.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Interactive Flashcard Stage */}
          {activeDeck && (
            <div className="lg:col-span-8 space-y-4">
              {/* Deck Progress & Missed Filter */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#292929] dark:text-white">
                      {activeDeck.title}
                    </h3>
                    <p className="text-[11px] font-mono text-[#795548] dark:text-stone-400">
                      Source PDF: {activeDeck.sourcePdfTitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewMissedOnly(prev => !prev);
                      setCurrentIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      reviewMissedOnly
                        ? 'bg-[#B83232] border-[#B83232] text-white'
                        : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-stone-200'
                    }`}
                  >
                    {reviewMissedOnly
                      ? `Showing Missed (${revisionCount})`
                      : `Review Missed (${revisionCount})`}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#795548] dark:text-stone-400">
                      Mastery: {knownCount} Known · {revisionCount} Need Revision
                    </span>
                    <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {deckProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFEBE9] dark:bg-[#1E1E1E] overflow-hidden">
                    <div
                      className="h-full bg-[#B83232] transition-all duration-300"
                      style={{ width: `${deckProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Flip Card */}
              {currentCard ? (
                <div className="space-y-4">
                  <div
                    onClick={() => setIsFlipped(prev => !prev)}
                    className={`min-h-[240px] p-8 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-sm ${
                      isFlipped
                        ? 'bg-[#292929] text-white border-[#F2C94C]/60'
                        : 'bg-white dark:bg-[#292929] text-[#292929] dark:text-white border-[#795548]/40 hover:border-[#B83232]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="px-2.5 py-0.5 rounded bg-[#B83232] text-white font-bold">
                        {isFlipped ? 'ANSWER' : 'QUESTION'} · Card {Math.min(currentIndex + 1, visibleCards.length)} / {visibleCards.length}
                      </span>
                      <span className={isFlipped ? 'text-[#F2C94C]' : 'text-[#795548] dark:text-[#F2C94C]'}>
                        {currentCard.status}
                      </span>
                    </div>

                    <div className="py-6 text-center space-y-3">
                      <p className="text-base sm:text-lg font-bold leading-relaxed">
                        {isFlipped ? currentCard.answer : currentCard.question}
                      </p>
                      <p className={`text-[11px] flex items-center justify-center gap-1.5 ${isFlipped ? 'text-stone-300' : 'text-[#795548] dark:text-stone-400'}`}>
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Click card to flip to {isFlipped ? 'question' : 'answer'}</span>
                      </p>
                    </div>

                    <div className={`text-[10px] font-mono flex items-center justify-between pt-3 border-t ${isFlipped ? 'border-white/10 text-[#F2C94C]' : 'border-[#E5DFD9] dark:border-[#3D3835] text-[#795548] dark:text-stone-400'}`}>
                      <span>{currentCard.sourcePdfTitle}</span>
                      {currentCard.sourcePageRef && <span>Page {currentCard.sourcePageRef}</span>}
                    </div>
                  </div>

                  {/* Card Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentIndex(prev => (prev > 0 ? prev - 1 : visibleCards.length - 1));
                        }}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]"
                        title="Previous Card"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentIndex(prev => (prev < visibleCards.length - 1 ? prev + 1 : 0));
                        }}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]"
                        title="Next Card"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkCard('Need Revision')}
                        className="px-4 py-2 rounded-xl bg-[#795548] hover:bg-[#65453a] text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#F2C94C]" />
                        <span>Need Revision</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkCard('Known')}
                        className="px-4 py-2 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F2C94C]" />
                        <span>Mark Known</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-[#F2C94C] mx-auto" />
                  <p className="text-sm font-bold text-[#292929] dark:text-white">
                    No cards marked as &quot;Need Revision&quot; in this deck.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
