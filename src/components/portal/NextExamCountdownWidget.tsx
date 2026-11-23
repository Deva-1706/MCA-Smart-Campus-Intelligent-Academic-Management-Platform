import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { Examination } from '../../types';

interface NextExamCountdownWidgetProps {
  onStartExam: (exam: Examination) => void;
}

export const NextExamCountdownWidget: React.FC<NextExamCountdownWidgetProps> = ({ onStartExam }) => {
  const { allExaminations, allSubjects, completedExamResults, setCurrentPage, setSelectedSubject } = usePortal();
  const [now, setNow] = useState<Date>(() => new Date());

  // Refresh countdown every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const subjectCodes = useMemo(() => new Set(allSubjects.map(s => s.code)), [allSubjects]);

  const upcomingExams = useMemo(() => {
    const completedIds = new Set(completedExamResults.map(r => r.examId));
    return allExaminations
      .filter(
        exam =>
          subjectCodes.has(exam.subjectCode) &&
          exam.status !== 'Completed' &&
          !completedIds.has(exam.id)
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [allExaminations, subjectCodes, completedExamResults]);

  // Prefer the soonest exam that hasn't passed, or fall back to the earliest pending exam
  const nextExam = useMemo(() => {
    if (upcomingExams.length === 0) return null;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const futureExam = upcomingExams.find(
      e => new Date(`${e.dueDate}T00:00:00`).getTime() >= todayStart
    );
    return futureExam || upcomingExams[0];
  }, [upcomingExams, now]);

  const followingExam = useMemo(() => {
    if (!nextExam || upcomingExams.length <= 1) return null;
    return upcomingExams.find(e => e.id !== nextExam.id) || null;
  }, [upcomingExams, nextExam]);

  const getCountdownMetrics = (dueDateStr: string) => {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const examDateMidnight = new Date(`${dueDateStr}T00:00:00`).getTime();
    const remainingDays = Math.round((examDateMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

    const examTargetTime = new Date(`${dueDateStr}T09:00:00`).getTime();
    const diffMs = Math.max(0, examTargetTime - now.getTime());
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const daysExact = Math.floor(totalHours / 24);
    const hoursExact = totalHours % 24;
    const minsExact = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      remainingDays,
      daysExact,
      hoursExact,
      minsExact,
      isToday: remainingDays === 0,
      isPastDue: remainingDays < 0
    };
  };

  if (!nextExam) {
    return (
      <div className="p-5 rounded-2xl bg-[#292929] text-[#F7F5F2] border border-[#795548]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#795548]/30 border border-[#F2C94C]/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#F2C94C]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2C94C]">
              Next Exam Countdown
            </span>
            <h3 className="text-base font-extrabold text-white">
              All Scheduled Semester 1 Assessments Completed
            </h3>
            <p className="text-xs text-stone-300">
              You have completed all currently scheduled examinations. Review your results or practice in the Python Lab.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentPage('examinations')}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#F2C94C] text-[#292929] hover:bg-[#e0b73b] transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>View Exam History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const metrics = getCountdownMetrics(nextExam.dueDate);
  const followingMetrics = followingExam ? getCountdownMetrics(followingExam.dueDate) : null;
  const matchedSubject = allSubjects.find(s => s.code === nextExam.subjectCode);
  const isUrgent = metrics.remainingDays <= 3;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#B83232] shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Countdown Tile + Exam Details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Countdown Box */}
          <div
            className={`px-5 py-4 rounded-2xl text-center shrink-0 border ${
              isUrgent
                ? 'bg-[#B83232] border-[#B83232] text-white'
                : 'bg-[#292929] border-[#795548]/50 text-white'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2C94C] mb-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Next Exam</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono leading-none text-white">
              {metrics.isPastDue
                ? 'DUE'
                : metrics.isToday
                ? 'TODAY'
                : metrics.remainingDays}
            </div>
            <div className="text-[11px] font-semibold text-stone-200 mt-1">
              {metrics.isPastDue
                ? 'Action Required'
                : metrics.isToday
                ? 'Scheduled Today'
                : metrics.remainingDays === 1
                ? 'Day Remaining'
                : 'Days Remaining'}
            </div>
            {!metrics.isPastDue && (
              <div className="mt-1.5 pt-1.5 border-t border-white/15 text-[10px] font-mono text-[#F2C94C]">
                {metrics.daysExact}d : {String(metrics.hoursExact).padStart(2, '0')}h : {String(metrics.minsExact).padStart(2, '0')}m
              </div>
            )}
          </div>

          {/* Exam Metadata */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C] font-mono text-[11px] font-bold">
                {nextExam.subjectCode}
              </span>
              <span className="text-xs font-semibold text-[#795548] dark:text-[#BDB7B2]">
                {nextExam.subjectName}
              </span>
              {isUrgent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 dark:bg-[#B83232]/25 text-[#B83232] dark:text-[#F2C94C] text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3" />
                  Upcoming Soon
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-[#292929] dark:text-[#F7F5F2] leading-snug">
              {nextExam.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E6863] dark:text-[#BDB7B2]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
                Scheduled: <strong className="text-[#292929] dark:text-white">{nextExam.dueDate}</strong>
              </span>
              <span>Duration: {nextExam.durationMinutes} Mins</span>
              <span>Total Marks: {nextExam.totalMarks}</span>
              <span>Questions: {nextExam.questions.length}</span>
            </div>

            {followingExam && followingMetrics && (
              <p className="text-[11px] text-[#795548] dark:text-stone-400 pt-0.5">
                Next in queue:{' '}
                <span className="font-mono font-semibold text-[#292929] dark:text-stone-200">
                  {followingExam.subjectCode}
                </span>{' '}
                ({followingExam.subjectName}) in{' '}
                <strong className="text-[#B83232] dark:text-[#F2C94C]">
                  {Math.max(0, followingMetrics.remainingDays)} days
                </strong>{' '}
                ({followingExam.dueDate})
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          {matchedSubject && (
            <button
              onClick={() => {
                setSelectedSubject(matchedSubject);
                setCurrentPage('materials');
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548] transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#795548] dark:text-[#F2C94C]" />
              <span>Study Notes</span>
            </button>
          )}
          <button
            onClick={() => onStartExam(nextExam)}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors shadow-xs flex items-center gap-1.5"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Examination</span>
          </button>
        </div>
      </div>
    </div>
  );
};
