import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  FileText,
  Play,
  RotateCcw,
  Loader2,
  Award
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { PracticeQuestion, PracticeQuestionType } from '../../types';

export const PracticeArenaView: React.FC = () => {
  const {
    allSubjects,
    subjectPdfs,
    practiceAttempts,
    generatePracticeQuestions,
    recordPracticeAttempt
  } = usePortal();

  const [subjectCode, setSubjectCode] = useState<string>(allSubjects[0]?.code || '435C1A');
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [questionType, setQuestionType] = useState<PracticeQuestionType | 'Mixed'>('Mixed');
  const [timedMode, setTimedMode] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(4);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [sessionSubmitted, setSessionSubmitted] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userAnswersRef = useRef<Record<string, string>>({});
  const autoExpiredHandledRef = useRef<boolean>(false);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const activeSubject = allSubjects.find(s => s.code === subjectCode) || allSubjects[0];
  const subjectSpecificPdfs = subjectPdfs.filter(p => p.subjectCode === subjectCode);
  const availableTopics = Array.from(
    new Set(subjectSpecificPdfs.flatMap(p => p.topicsCovered))
  );

  // Reset topic when subject changes
  useEffect(() => {
    setSelectedTopic('All Topics');
  }, [subjectCode]);

  // Quiz timer loop
  useEffect(() => {
    if (questions.length > 0 && !sessionSubmitted) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
        if (timedMode) {
          setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions.length, sessionSubmitted, timedMode]);

  // Handle timed expiration cleanly outside interval state updater
  useEffect(() => {
    if (
      timedMode &&
      questions.length > 0 &&
      !sessionSubmitted &&
      timeRemaining === 0 &&
      !autoExpiredHandledRef.current
    ) {
      autoExpiredHandledRef.current = true;
      handleFinishSession(true);
    }
  }, [timedMode, questions.length, sessionSubmitted, timeRemaining]);

  const handleStartPractice = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setQuestions([]);
    setUserAnswers({});
    userAnswersRef.current = {};
    autoExpiredHandledRef.current = false;
    setCheckedIds({});
    setSessionSubmitted(false);
    setSecondsElapsed(0);
    setTimeRemaining(questionCount * 60);

    const result = await generatePracticeQuestions({
      subjectCode,
      topic: selectedTopic,
      difficulty,
      questionType,
      count: questionCount
    });

    setIsLoading(false);
    if (result.error) {
      setErrorMsg(result.error);
      return;
    }
    setQuestions(result.questions);
  };

  const evaluateAnswer = (q: PracticeQuestion, answer: string | undefined): boolean => {
    const clean = (answer || '').trim().toLowerCase();
    if (!clean) return false;
    const expected = q.correctAnswer.trim().toLowerCase();
    if (q.questionType === 'Short Answer') {
      const keywords = expected
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 5)
        .slice(0, 6);
      if (keywords.length === 0) return clean.length >= 10;
      const matched = keywords.filter(kw => clean.includes(kw));
      return matched.length >= Math.min(2, keywords.length);
    }
    return clean === expected || (q.questionType === 'Fill in the Blank' && clean.includes(expected));
  };

  const handleFinishSession = (autoExpired = false) => {
    if (sessionSubmitted || questions.length === 0) return;
    const latestAnswers = userAnswersRef.current;
    const allChecked: Record<string, boolean> = {};
    let correctCount = 0;
    questions.forEach(q => {
      allChecked[q.id] = true;
      if (evaluateAnswer(q, latestAnswers[q.id])) {
        correctCount += 1;
      }
    });
    setCheckedIds(allChecked);
    setSessionSubmitted(true);

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    recordPracticeAttempt({
      subjectCode,
      subjectName: activeSubject?.name || subjectCode,
      topic: selectedTopic,
      mode: timedMode ? 'Timed Quiz' : 'Standard',
      difficulty,
      totalQuestions: questions.length,
      correctCount,
      scorePercent,
      durationSeconds: autoExpired ? questionCount * 60 : secondsElapsed
    });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentCorrectCount = questions.filter(
    q => checkedIds[q.id] && evaluateAnswer(q, userAnswers[q.id])
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            PDF-Grounded Self Assessment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Practice Arena
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Practise MCQs, True/False, Fill in the Blanks, and Short Answers strictly grounded in uploaded subject PDFs.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#292929] text-white border border-[#795548]/40 flex items-center gap-3 shrink-0">
          <Award className="w-5 h-5 text-[#F2C94C]" />
          <div className="text-xs">
            <div className="text-[10px] uppercase text-stone-400 font-bold">Practice Sessions</div>
            <div className="font-mono font-extrabold text-[#F2C94C]">
              {practiceAttempts.length} Completed
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Subject (Isolated KB)
            </label>
            <select
              value={subjectCode}
              onChange={e => setSubjectCode(e.target.value)}
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
              Topic Filter
            </label>
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              <option value="All Topics">All Subject Topics</option>
              {availableTopics.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={e => setQuestionType(e.target.value as PracticeQuestionType | 'Mixed')}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              <option value="Mixed">Mixed Formats</option>
              <option value="MCQ">MCQ</option>
              <option value="True/False">True / False</option>
              <option value="Fill in the Blank">Fill in the Blank</option>
              <option value="Short Answer">Short Answer</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as typeof difficulty)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              <option value="Mixed">Mixed</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#795548] dark:text-stone-300 mb-1">
              Questions ({questionCount})
            </label>
            <select
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
            >
              <option value={4}>4 Questions</option>
              <option value={6}>6 Questions</option>
              <option value={8}>8 Questions</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#292929] dark:text-stone-200">
              <input
                type="checkbox"
                checked={timedMode}
                onChange={e => setTimedMode(e.target.checked)}
                className="rounded border-[#795548] text-[#B83232]"
              />
              <Clock className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
              <span>Timed Quiz Mode ({questionCount} min limit)</span>
            </label>
            <span className="text-[11px] text-[#795548] dark:text-stone-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#F2C94C]" />
              {subjectSpecificPdfs.length} Uploaded PDF(s) for {subjectCode}
            </span>
          </div>

          <button
            onClick={handleStartPractice}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isLoading ? 'Generating from Subject PDFs...' : 'Start Practice Quiz'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-[#B83232] dark:text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Active Quiz Area */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {/* Quiz Live Header */}
          <div className="p-4 rounded-xl bg-[#292929] text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#F2C94C]" />
              <div>
                <div className="text-xs font-bold text-[#F2C94C]">
                  {activeSubject?.code} · {activeSubject?.name}
                </div>
                <div className="text-[11px] text-stone-300">
                  {questions.length} PDF-Grounded Questions · Checked: {Object.keys(checkedIds).length}/{questions.length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-[#F2C94C] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {timedMode ? `Left: ${formatTimer(timeRemaining)}` : `Elapsed: ${formatTimer(secondsElapsed)}`}
                </span>
              </div>

              {!sessionSubmitted ? (
                <button
                  onClick={() => handleFinishSession(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#F2C94C] hover:bg-[#e0b73b] text-[#292929] text-xs font-extrabold transition-colors"
                >
                  Submit &amp; Score
                </button>
              ) : (
                <button
                  onClick={handleStartPractice}
                  className="px-4 py-1.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Set</span>
                </button>
              )}
            </div>
          </div>

          {sessionSubmitted && (
            <div className="p-5 rounded-2xl bg-[#292929] border-2 border-[#F2C94C]/50 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2C94C]">
                  Session Score Recorded
                </span>
                <h3 className="text-xl font-extrabold">
                  Score: {currentCorrectCount} / {questions.length} (
                  {Math.round((currentCorrectCount / questions.length) * 100)}%)
                </h3>
                <p className="text-xs text-stone-300">
                  Completed in {formatTimer(secondsElapsed)}. Saved to your Practice History.
                </p>
              </div>
              <span className="px-3.5 py-2 rounded-xl bg-[#B83232] text-white font-mono text-sm font-extrabold">
                {Math.round((currentCorrectCount / questions.length) * 100) >= 70 ? 'PASS · STRONG' : 'NEEDS REVISION'}
              </span>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isChecked = Boolean(checkedIds[q.id]);
              const isCorrect = isChecked && evaluateAnswer(q, userAnswers[q.id]);

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#292929] text-[#F2C94C] font-mono text-[10px] font-bold">
                        Q{idx + 1} · {q.questionType}
                      </span>
                      <span className="text-[11px] font-semibold text-[#795548] dark:text-stone-400">
                        {q.topic} · {q.difficulty}
                      </span>
                    </div>
                    {q.sourcePdfTitle && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-stone-300 border border-[#E5DFD9] dark:border-[#3D3835]">
                        Source: {q.sourcePdfTitle} {q.sourcePageRef ? `(p.${q.sourcePageRef})` : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-[#292929] dark:text-white leading-relaxed">
                    {q.prompt}
                  </p>

                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = userAnswers[q.id] === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={isChecked}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`p-3 rounded-xl border text-left text-xs transition-all ${
                              isSelected
                                ? 'bg-[#B83232]/10 border-[#B83232] text-[#292929] dark:text-white font-semibold'
                                : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-stone-300 hover:border-[#795548]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={isChecked}
                      value={userAnswers[q.id] || ''}
                      onChange={e => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder={
                        q.questionType === 'Fill in the Blank'
                          ? 'Type the missing term...'
                          : 'Write your concise answer...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white"
                    />
                  )}

                  {!isChecked ? (
                    <button
                      type="button"
                      onClick={() => setCheckedIds(prev => ({ ...prev, [q.id]: true }))}
                      className="px-3.5 py-1.5 rounded-lg bg-[#292929] hover:bg-[#1E1E1E] text-[#F2C94C] text-xs font-bold"
                    >
                      Check Instant Feedback
                    </button>
                  ) : (
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        isCorrect
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400/50 text-[#292929] dark:text-emerald-200'
                          : 'bg-rose-50/80 dark:bg-rose-950/25 border-[#B83232]/40 text-[#292929] dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#B83232]" />
                        )}
                        <span>{isCorrect ? 'Correct!' : `Reference Answer: ${q.correctAnswer}`}</span>
                      </div>
                      <p className="text-[11px] opacity-90">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Practice History */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#292929] dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
            <span>Practice History &amp; Score Tracking</span>
          </h2>
        </div>

        {practiceAttempts.length === 0 ? (
          <p className="text-xs text-[#795548] dark:text-stone-400">
            No practice quizzes completed yet. Configure a subject and start your first PDF-grounded session above.
          </p>
        ) : (
          <div className="space-y-2">
            {practiceAttempts.map(att => (
              <div
                key={att.id}
                className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C] mr-2">
                    {att.subjectCode}
                  </span>
                  <span className="font-bold text-[#292929] dark:text-white">{att.subjectName}</span>
                  <span className="text-[#795548] dark:text-stone-400 ml-2">
                    · {att.topic} · {att.mode} ({att.difficulty})
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="font-bold text-[#292929] dark:text-[#F2C94C]">
                    {att.correctCount}/{att.totalQuestions} ({att.scorePercent}%)
                  </span>
                  <span className="text-stone-500">{att.attemptedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
