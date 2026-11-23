import React, { useState, useEffect, useRef } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Examination, Question } from '../../types';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flag,
  ArrowRight,
  ArrowLeft,
  Award,
  RotateCcw
} from 'lucide-react';

export const ExaminationsView: React.FC = () => {
  const {
    allExaminations,
    activeExam,
    setActiveExam,
    completedExamResults,
    submitExam,
    lastExamResult,
    setLastExamResult,
    setCurrentPage
  } = usePortal();

  // Active exam session state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const userAnswersRef = useRef<Record<string, number>>({});
  const autoSubmittedRef = useRef<boolean>(false);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  // Initialize exam timer when an active exam is selected
  useEffect(() => {
    if (activeExam) {
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      userAnswersRef.current = {};
      setFlaggedQuestions({});
      setTimeLeftSeconds(activeExam.durationMinutes * 60);
      setReviewModalOpen(false);
      autoSubmittedRef.current = false;
    }
  }, [activeExam]);

  // Single interval countdown per exam session
  useEffect(() => {
    if (!activeExam) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam?.id]);

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (activeExam && timeLeftSeconds === 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitExam(activeExam, userAnswersRef.current);
      setActiveExam(null);
    }
  }, [activeExam, timeLeftSeconds, submitExam, setActiveExam]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleSubmitExamClick = () => {
    if (!activeExam) return;
    submitExam(activeExam, userAnswers);
    setActiveExam(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. LIVE EXAM MODE
  if (activeExam) {
    const currentQ: Question = activeExam.questions[currentQuestionIndex];
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = activeExam.questions.length;
    const isFlagged = !!flaggedQuestions[currentQ.id];

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Sticky Bar: Exam Info & Countdown Timer */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20">
          <div>
            <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
              {activeExam.subjectCode} · {activeExam.subjectName}
            </span>
            <h2 className="text-base font-bold text-[#292929] dark:text-white">
              {activeExam.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F2C94C]/15 text-[#292929] dark:text-[#F2C94C] border border-[#F2C94C]/30 font-mono font-bold text-sm">
              <Clock className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={handleSubmitExamClick}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors shadow-xs"
            >
              Submit Examination
            </button>
          </div>
        </div>

        {/* Question Area & Question Palette Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question Workspace */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="font-mono text-xs font-bold text-[#795548] dark:text-stone-400">
                Question {currentQuestionIndex + 1} of {totalCount}
              </span>
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  isFlagged
                    ? 'bg-amber-100 text-[#292929] dark:bg-stone-800 dark:text-[#F2C94C]'
                    : 'text-[#795548] hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-[#F2C94C] text-[#F2C94C]' : ''}`} />
                <span>{isFlagged ? 'Flagged for Review' : 'Flag Question'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-[#795548] dark:text-stone-400 font-mono">
                <span>Unit {currentQ.unit}</span>
                <span>·</span>
                <span>Difficulty: {currentQ.difficulty}</span>
              </div>
              <p className="text-base font-semibold text-[#292929] dark:text-white leading-relaxed">
                {currentQ.text}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#B83232] bg-[#B83232]/10 text-[#292929] dark:text-white font-semibold ring-1 ring-[#B83232]/30'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-[#F7F5F2] dark:bg-stone-800/40 text-[#292929] dark:text-stone-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#B83232] text-white'
                          : 'bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-[#795548] dark:text-stone-400'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-snug pt-0.5">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Next / Prev Navigation */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 text-[#292929] dark:text-stone-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => {
                  if (currentQuestionIndex < totalCount - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                  } else {
                    handleSubmitExamClick();
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>{currentQuestionIndex === totalCount - 1 ? 'Finish & Submit' : 'Next Question'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Question Palette Navigator */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 space-y-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#292929] dark:text-white">
              Question Navigator Palette
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {activeExam.questions.map((q, idx) => {
                const isCurrent = currentQuestionIndex === idx;
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlaggedQ = !!flaggedQuestions[q.id];

                let badgeClass = 'bg-[#F7F5F2] dark:bg-stone-800 text-[#795548] dark:text-stone-400';
                if (isAnswered) badgeClass = 'bg-[#B83232] text-white font-bold';
                if (isFlaggedQ) badgeClass = 'bg-[#F2C94C] text-[#292929] font-bold';
                if (isCurrent) badgeClass += ' ring-2 ring-[#292929] dark:ring-white ring-offset-1';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs flex items-center justify-center transition-all ${badgeClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-[11px] text-[#795548] dark:text-stone-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#B83232] shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#F2C94C] shrink-0" />
                <span>Flagged for Review ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-stone-200 dark:bg-stone-800 shrink-0" />
                <span>Not Visited / Pending ({totalCount - answeredCount})</span>
              </div>
            </div>

            <button
              onClick={handleSubmitExamClick}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors shadow-xs"
            >
              Submit & View Grade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. EXAMS OVERVIEW & RESULTS VIEW
  return (
    <div className="space-y-8">
      {/* Assessment Workspace Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] w-fit">
        <button
          type="button"
          onClick={() => setCurrentPage('assignments')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white"
        >
          Assignments
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage('examinations')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#B83232] text-white"
        >
          Examinations
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage('coding-lab')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white"
        >
          Python Coding Lab
        </button>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Continuous Assessment (CA)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Examinations & Assessments
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
          Take timed assessments, test conceptual problem solving, and receive instant automated score reports with full solutions.
        </p>
      </div>

      {/* Last Result Score Banner (if just completed) */}
      {lastExamResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#202020] border border-[#B83232]/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#B83232] text-white">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#B83232] dark:text-[#F2C94C] font-bold uppercase">
                  Assessment Completed · Instant Evaluation
                </span>
                <h2 className="text-base font-bold text-[#292929] dark:text-white">
                  {lastExamResult.examTitle}
                </h2>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-extrabold font-mono text-[#B83232] dark:text-[#F2C94C]">
                {lastExamResult.score} / {lastExamResult.totalMarks}
              </p>
              <p className="text-[11px] text-[#795548] dark:text-stone-400">Score ({lastExamResult.percentage}%)</p>
            </div>
          </div>

          <p className="text-xs text-[#795548] dark:text-stone-300">
            Status:{' '}
            <span
              className={`font-semibold ${
                lastExamResult.passed
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-[#B83232] dark:text-rose-400'
              }`}
            >
              {lastExamResult.passed ? 'Passed (≥ 50% Threshold)' : 'Below Passing Marks (< 50% Threshold)'}
            </span>{' '}
            · Recorded in student evaluation database on {lastExamResult.submittedAt}.
          </p>
        </div>
      )}

      {/* Available Examinations */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#292929] dark:text-white">
          Active Semester 1 Examinations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allExaminations.map(exam => {
            const isCompleted = completedExamResults.some(r => r.examId === exam.id);
            const pastResult = completedExamResults.find(r => r.examId === exam.id);

            return (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {exam.subjectCode} · {exam.subjectName}
                    </span>
                    <span className="text-xs text-[#795548] dark:text-stone-400">
                      {exam.durationMinutes} Mins · {exam.totalMarks} Marks
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#292929] dark:text-white mb-2">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-[#795548] dark:text-stone-400 mb-4">
                    Assessment includes {exam.questions.length} questions covering theoretical proofs, algorithmic complexity, and system mechanics.
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  {pastResult ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#B83232] dark:text-[#F2C94C]">
                        Score: {pastResult.score}/{pastResult.totalMarks} ({pastResult.percentage}%)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#795548] dark:text-stone-400 font-semibold">
                      Due: {exam.dueDate}
                    </span>
                  )}

                  <button
                    onClick={() => setActiveExam(exam)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      pastResult
                        ? 'bg-stone-100 hover:bg-stone-200 text-[#292929] dark:bg-stone-800 dark:text-white'
                        : 'bg-[#B83232] hover:bg-[#9E2A2A] text-white shadow-xs'
                    }`}
                  >
                    {pastResult ? 'Retake Examination' : 'Start Examination'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Exam Evaluation History */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#292929] dark:text-white">
          Completed Assessment Ledger & Solutions Review
        </h2>

        {completedExamResults.length === 0 ? (
          <p className="text-xs text-[#795548] dark:text-stone-400">No completed examinations recorded yet.</p>
        ) : (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[#795548] uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Examination</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Percentage</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-[#292929] dark:text-stone-300">
                {completedExamResults.map((res, ridx) => (
                  <tr key={ridx} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {res.subjectCode}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#292929] dark:text-white">
                      {res.examTitle}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {res.score} / {res.totalMarks}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold">
                      {res.percentage}%
                    </td>
                    <td className="py-3 px-3">
                      {res.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B83232] dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" /> Review Needed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#795548] dark:text-stone-400 font-mono text-[11px]">
                      {res.submittedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
