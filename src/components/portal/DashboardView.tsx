import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { PageId } from '../../types';
import {
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  BookOpen,
  FileCheck2,
  Bell,
  User,
  FileSpreadsheet,
  Target,
  Layers,
  CalendarDays,
  Terminal,
  FolderArchive,
  Bot,
  FileText,
  Clock,
  Activity
} from 'lucide-react';
import { NextExamCountdownWidget } from './NextExamCountdownWidget';
import { DashboardPomodoroWidget } from './DashboardPomodoroWidget';
import { WeeklyStudyGoalsWidget } from './WeeklyStudyGoalsWidget';
import { ImportantNoticesSection } from './ImportantNoticesSection';
import { GlobalSearchBar } from './GlobalSearchBar';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    allSubjects,
    setCurrentPage,
    setSelectedSubject,
    completedExamResults,
    setActiveExam,
    allExaminations,
    assignments,
    unreadNotificationsCount,
    getSubjectProgress,
    achievements,
    practiceAttempts,
    flashcardDecks,
    calendarEvents,
    recentlyViewedPdfIds,
    subjectPdfs
  } = usePortal();



  if (!currentUser) return null;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Real dynamic statistics
  const completedExamIds = new Set(completedExamResults.map(r => r.examId));
  const upcomingExams = allExaminations.filter(
    e => e.status !== 'Completed' && !completedExamIds.has(e.id)
  );
  const completedExamsCount = completedExamResults.length;

  const availableAssignmentsCount = assignments.length;
  const submittedAssignments = assignments.filter(
    a => a.status === 'Submitted' || a.status === 'Evaluated'
  );
  const pendingAssignments = assignments.filter(
    a => a.status === 'Not Started' || a.status === 'In Progress'
  );

  const avgLearningProgress =
    allSubjects.length > 0
      ? Math.round(
          allSubjects.reduce((acc, s) => acc + getSubjectProgress(s.code).percentage, 0) /
            allSubjects.length
        )
      : 0;

  const latestPerformanceResult =
    completedExamResults.length > 0
      ? completedExamResults[completedExamResults.length - 1]
      : null;

  const earnedAchievementsCount = achievements.filter(a => a.earned).length;

  const latestPracticeScore =
    practiceAttempts.length > 0
      ? `${practiceAttempts[0].scorePercent}% (${practiceAttempts[0].subjectCode})`
      : '0 attempts';

  const totalFlashcardsCount = flashcardDecks.reduce((s, d) => s + d.cards.length, 0);

  const handleStartExam = (exam: typeof allExaminations[0]) => {
    setActiveExam(exam);
    setCurrentPage('examinations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubjectClick = (subj: typeof allSubjects[0]) => {
    setSelectedSubject(subj);
    setCurrentPage('my-subjects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Six New Feature Cards (Exact requested labels & descriptions)
  const sixNewFeatures: {
    id: PageId;
    title: string;
    description: string;
    stat: string;
    icon: React.ElementType;
    accentColor: string;
  }[] = [
    {
      id: 'achievements',
      title: 'Achievements & Certificates',
      description: 'View your academic achievements, completed activities and certificates.',
      stat: `${earnedAchievementsCount} Earned Milestone${earnedAchievementsCount === 1 ? '' : 's'}`,
      icon: Award,
      accentColor: 'border-t-[#F2C94C]',
    },
    {
      id: 'practice-arena',
      title: 'Practice Arena',
      description: 'Practice subject-wise questions, quizzes and timed tests.',
      stat: `${practiceAttempts.length} Practice Sessions · ${latestPracticeScore}`,
      icon: Target,
      accentColor: 'border-t-[#B83232]',
    },
    {
      id: 'flashcards',
      title: 'AI Flashcards & Revision',
      description: 'Generate flashcards from uploaded subject PDFs and revise important concepts.',
      stat: `${flashcardDecks.length} Saved Decks · ${totalFlashcardsCount} Cards`,
      icon: Layers,
      accentColor: 'border-t-[#F2C94C]',
    },
    {
      id: 'calendar',
      title: 'Academic Calendar & Timetable',
      description: 'View academic events, assignment deadlines and examination schedules.',
      stat: `${calendarEvents.length} Custom Event${calendarEvents.length === 1 ? '' : 's'} · ${pendingAssignments.length + upcomingExams.length} Deadlines`,
      icon: CalendarDays,
      accentColor: 'border-t-[#795548]',
    },
  ];

  // Build Recent Activity Feed dynamically from real student state
  const recentActivityItems: { id: string; label: string; meta: string; tag: string; page: PageId }[] = [];

  submittedAssignments.slice(0, 2).forEach(a => {
    recentActivityItems.push({
      id: `act-asg-${a.id}`,
      label: `Submitted Assignment: ${a.title}`,
      meta: `${a.subjectCode} · ${a.studentSubmission?.submittedAt || a.dueDate}`,
      tag: 'Assignment',
      page: 'assignments',
    });
  });

  completedExamResults.slice(-2).reverse().forEach(r => {
    recentActivityItems.push({
      id: `act-ex-${r.examId}`,
      label: `Completed Exam: ${r.examTitle}`,
      meta: `${r.subjectCode} · Score: ${r.score}/${r.totalMarks} (${r.percentage}%)`,
      tag: 'Exam',
      page: 'examinations',
    });
  });

  recentlyViewedPdfIds.slice(0, 2).forEach(pdfId => {
    const pdf = subjectPdfs.find(p => p.id === pdfId && p.status !== 'Draft');
    if (pdf) {
      recentActivityItems.push({
        id: `act-pdf-${pdf.id}`,
        label: `Studied PDF: ${pdf.title}`,
        meta: `${pdf.subjectCode} · Unit ${pdf.unit}`,
        tag: 'PDF',
        page: 'materials',
      });
    }
  });

  flashcardDecks.slice(0, 2).forEach(deck => {
    recentActivityItems.push({
      id: `act-fc-${deck.id}`,
      label: `Generated Flashcard Deck: ${deck.topic}`,
      meta: `${deck.subjectCode} · ${deck.cards.length} Cards`,
      tag: 'Revision',
      page: 'flashcards',
    });
  });

  // Upcoming Activities (real pending assignments + upcoming exams + custom calendar events)
  const upcomingActivityItems: { id: string; title: string; dueDate: string; type: string; subjectCode: string; page: PageId }[] = [
    ...pendingAssignments.map(a => ({
      id: `up-asg-${a.id}`,
      title: a.title,
      dueDate: a.dueDate,
      type: 'Assignment Due',
      subjectCode: a.subjectCode,
      page: 'assignments' as PageId,
    })),
    ...upcomingExams.map(e => ({
      id: `up-ex-${e.id}`,
      title: e.title,
      dueDate: e.dueDate,
      type: 'Examination',
      subjectCode: e.subjectCode,
      page: 'examinations' as PageId,
    })),
    ...calendarEvents.map(ev => ({
      id: `up-ev-${ev.id}`,
      title: ev.title,
      dueDate: ev.date,
      type: ev.category,
      subjectCode: ev.subjectCode || 'MCA',
      page: 'calendar' as PageId,
    })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-8">
      {/* 1. DASHBOARD HEADER */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#292929] text-white border-2 border-[#795548]/50 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#B83232] text-white font-bold">
                {currentUser.studentId}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#F2C94C] text-[#292929] font-extrabold">
                Roll No: {currentUser.rollNumber}
              </span>
              <span className="text-xs text-[#D7CCC8]">
                Semester {currentUser.semester} · {todayFormatted}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#D7CCC8] max-w-2xl leading-relaxed">
              {currentUser.program} · Batch {currentUser.batch} · Faculty Advisor:{' '}
              <span className="font-bold text-[#F2C94C]">{currentUser.advisorName || 'HCASICAN'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigateTo('notifications')}
              className="relative px-3.5 py-2 text-xs font-bold text-white bg-[#1E1E1E] hover:bg-black border border-[#795548]/60 rounded-lg transition-colors flex items-center gap-2"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-[#F2C94C]" />
              <span>Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#B83232] text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateTo('profile')}
              className="px-3.5 py-2 text-xs font-bold text-[#292929] bg-[#F2C94C] hover:bg-[#DDB038] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </button>
          </div>
        </div>

        {/* GLOBAL SEARCH BAR */}
        <GlobalSearchBar />
      </div>

      {/* 2. REAL SUMMARY STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#B83232] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#795548] dark:text-[#BDB7B2]">Total Subjects</span>
            <BookOpen className="w-4 h-4 text-[#B83232]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#292929] dark:text-[#F7F5F2]">
            {allSubjects.length}
          </p>
          <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-1">
            Semester 1 MCA Core
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#795548] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#795548] dark:text-[#BDB7B2]">Assignments</span>
            <FileSpreadsheet className="w-4 h-4 text-[#795548] dark:text-[#F2C94C]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#292929] dark:text-[#F7F5F2]">
            {pendingAssignments.length} Pending
          </p>
          <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-1">
            {availableAssignmentsCount} Total · {submittedAssignments.length} Submitted
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#F2C94C] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#795548] dark:text-[#BDB7B2]">Examinations</span>
            <FileCheck2 className="w-4 h-4 text-[#F2C94C]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#292929] dark:text-[#F7F5F2]">
            {upcomingExams.length} Due
          </p>
          <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-1">
            {completedExamsCount} Completed Exam{completedExamsCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#B83232] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#795548] dark:text-[#BDB7B2]">Learning Progress</span>
            <TrendingUp className="w-4 h-4 text-[#B83232]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#292929] dark:text-[#F7F5F2]">
            {avgLearningProgress}%
          </p>
          <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-1">
            Across 20 Syllabus Units
          </p>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#F2C94C] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#795548] dark:text-[#BDB7B2]">Latest Score</span>
            <Award className="w-4 h-4 text-[#F2C94C]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#292929] dark:text-[#F7F5F2]">
            {latestPerformanceResult ? `${latestPerformanceResult.percentage}%` : 'No attempts'}
          </p>
          <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-1 truncate">
            {latestPerformanceResult
              ? `${latestPerformanceResult.subjectCode} (${latestPerformanceResult.score}/${latestPerformanceResult.totalMarks})`
              : currentUser.currentSGPA > 0
              ? `SGPA ${currentUser.currentSGPA.toFixed(2)}`
              : 'Pending assessments'}
          </p>
        </div>
      </div>

      {/* Academic Workflow Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Academic Workflow
          </h2>
          <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
            Follow your semester learning path step by step
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { step: '1. Content & Read', detail: 'Published faculty notes & PDFs', page: 'materials' as PageId },
            { step: '2. Assessments', detail: 'Assignments & timed exams', page: 'assignments' as PageId },
            { step: '3. Coding Lab', detail: 'Isolated Python 3 execution', page: 'coding-lab' as PageId },
            { step: '4. Results', detail: 'Verified grades & reports', page: 'reports' as PageId },
          ].map(w => (
            <button
              key={w.step}
              type="button"
              onClick={() => navigateTo(w.page)}
              className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#B83232] text-left transition-colors flex items-center justify-between gap-2"
            >
              <div>
                <span className="block text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2]">{w.step}</span>
                <span className="block text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">{w.detail}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
            Quick Actions
          </h2>
          <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">Direct Academic Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => navigateTo('my-subjects')}
            className="p-2.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:border-[#B83232] border border-[#E5DFD9] dark:border-[#3D3835] text-left transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#B83232] mb-1.5" />
            <span className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">Open My Subjects</span>
          </button>

          <button
            onClick={() => navigateTo('assignments')}
            className="p-2.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:border-[#B83232] border border-[#E5DFD9] dark:border-[#3D3835] text-left transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#795548] dark:text-[#F2C94C] mb-1.5" />
            <span className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">Generate Assignment</span>
          </button>

          <button
            onClick={() => navigateTo('ai-assistant')}
            className="p-2.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:border-[#B83232] border border-[#E5DFD9] dark:border-[#3D3835] text-left transition-colors"
          >
            <Bot className="w-4 h-4 text-[#B83232] mb-1.5" />
            <span className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">Ask AI Assistant</span>
          </button>

          <button
            onClick={() => navigateTo('coding-lab')}
            className="p-2.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:border-[#B83232] border border-[#E5DFD9] dark:border-[#3D3835] text-left transition-colors"
          >
            <Terminal className="w-4 h-4 text-[#F2C94C] mb-1.5" />
            <span className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">Python Coding Lab</span>
          </button>

          <button
            onClick={() => navigateTo('materials')}
            className="p-2.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:border-[#B83232] border border-[#E5DFD9] dark:border-[#3D3835] text-left transition-colors"
          >
            <FolderArchive className="w-4 h-4 text-[#795548] dark:text-[#F2C94C] mb-1.5" />
            <span className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">Learning Materials</span>
          </button>

          <button
            onClick={() => navigateTo('reports')}
            className="p-2.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] hover:border-[#B83232] border border-[#E5DFD9] dark:border-[#3D3835] text-left transition-colors"
          >
            <FileText className="w-4 h-4 text-[#B83232] mb-1.5" />
            <span className="block text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">Academic Reports</span>
          </button>
        </div>
      </div>

      {/* Next Exam Countdown Widget */}
      <NextExamCountdownWidget onStartExam={handleStartExam} />

      {/* Pomodoro Study Studio & Resource Learning Time Tracker */}
      <DashboardPomodoroWidget />

      {/* Weekly Subject Study Goal Setting & Progress Bars */}
      <WeeklyStudyGoalsWidget />

      {/* 3. SIX NEW STUDENT PORTAL FEATURE CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
              Student Learning & Academic Modules
            </h2>
            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
              Integrated tools for revision, practice, achievements, and academic planning.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sixNewFeatures.map(feature => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 ${feature.accentColor} shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-all`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#292929] text-[#F2C94C] flex items-center justify-center shrink-0 border border-[#795548]/40">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835]">
                      {feature.stat}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <button
                  onClick={() => navigateTo(feature.id)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open / View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MY SUBJECTS (Semester 1 Subject Progress Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
            My Subjects & Learning Progress
          </h2>
          <button
            onClick={() => navigateTo('my-subjects')}
            className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline flex items-center gap-1"
          >
            <span>View All Modules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSubjects.map(subject => {
            const dynProgress = getSubjectProgress(subject.code);
            return (
              <div
                key={subject.id}
                onClick={() => handleSubjectClick(subject)}
                className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#B83232] hover:border-[#795548] transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C]">
                        {subject.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-[#795548] dark:text-[#F2C94C] border border-amber-200 dark:border-amber-800/60">
                        {subject.status || 'Upcoming'}
                      </span>
                      <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">
                        {subject.credits} Credits · {subject.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2] group-hover:text-[#B83232] dark:group-hover:text-[#F2C94C] transition-colors">
                      {subject.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-[#B83232] dark:text-[#F2C94C]">
                    {dynProgress.percentage}%
                  </span>
                </div>

                <div className="w-full bg-[#E5DFD9] dark:bg-[#1E1E1E] h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-[#B83232] h-full rounded-full transition-all duration-500"
                    style={{ width: `${dynProgress.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#6E6863] dark:text-[#BDB7B2] pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                  <span>
                    {dynProgress.completedUnits} of {dynProgress.totalUnits} Units ·{' '}
                    {dynProgress.completedMaterials}/{dynProgress.totalMaterials} PDFs
                  </span>
                  <span className="text-[#B83232] dark:text-[#F2C94C] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open Course</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. IMPORTANT NOTICES (with Faculty/Admin Management on Dashboard) */}
      <ImportantNoticesSection allowManagement={true} />

      {/* 6. UPCOMING ACTIVITIES & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upcoming Activities */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B83232]" />
              Upcoming Activities
            </h2>
            <button
              onClick={() => navigateTo('calendar')}
              className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
            >
              Open Calendar
            </button>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 shadow-xs">
            {upcomingActivityItems.length === 0 ? (
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                No upcoming activities or deadlines scheduled.
              </p>
            ) : (
              upcomingActivityItems.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  onClick={() => navigateTo(item.page)}
                  className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#B83232]/60 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">{item.subjectCode}</span>
                      <span className="text-[#795548] dark:text-[#BDB7B2]">{item.type}</span>
                    </div>
                    <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] truncate mt-0.5">
                      {item.title}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#795548] dark:text-[#BDB7B2] shrink-0 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#F2C94C]" />
                    {item.dueDate}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F2C94C]" />
              Recent Activity
            </h2>
            <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">Real Portal History</span>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 shadow-xs">
            {recentActivityItems.length === 0 ? (
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                No completed assignments, exam attempts, or viewed PDFs recorded yet. Start studying or attempt an assessment to log your activity.
              </p>
            ) : (
              recentActivityItems.slice(0, 5).map(act => (
                <div
                  key={act.id}
                  onClick={() => navigateTo(act.page)}
                  className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548] cursor-pointer flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                      {act.label}
                    </p>
                    <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-0.5 truncate">
                      {act.meta}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-[#292929] text-[#795548] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835] shrink-0">
                    {act.tag}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
