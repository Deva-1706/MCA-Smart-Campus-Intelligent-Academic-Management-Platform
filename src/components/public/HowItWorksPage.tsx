import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  LogIn,
  BookOpen,
  FolderArchive,
  Terminal,
  FileCheck2,
  Award,
  TrendingUp,
  FileText,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { setCurrentPage, currentUser } = usePortal();
  const [activeStage, setActiveStage] = useState(0);

  const workflowStages = [
    {
      step: '01',
      title: 'Student Authentication',
      subtitle: 'Secure institutional access',
      icon: LogIn,
      description: 'Log in with your official university Student ID or username. The portal validates credentials against the Django authentication backend, creating an authenticated session with role-based access control.',
      actionText: 'Go to Student Login',
      actionPage: 'login',
      highlights: [
        'Django user session persistence',
        'CSRF token validation',
        'Direct link to student profile & enrolled cohort'
      ]
    },
    {
      step: '02',
      title: 'Subject Exploration',
      subtitle: 'Syllabus & Course Objectives',
      icon: BookOpen,
      description: 'Navigate the four MCA Semester 1 courses: Discrete Mathematics, Data Structures & Algorithms, Data Engineering & Management, and Python Programming. Inspect the 5-unit syllabus matrices, course credits, and recommended reference books.',
      actionText: 'View 4 Core Subjects',
      actionPage: 'subjects',
      highlights: [
        'Complete 5-unit curriculum breakdown',
        'Recommended textbooks & publications',
        'Course credit allocation & prerequisites'
      ]
    },
    {
      step: '03',
      title: 'Learning Material Access',
      subtitle: 'Curated Faculty Lecture Notes',
      icon: FolderArchive,
      description: 'Study verified lecture notes, laboratory manuals, and previous year question banks. Preview notes directly in the clean browser reader or save key concepts to your personal bookmarks for quick revision.',
      actionText: 'Open Learning Materials',
      actionPage: 'materials',
      highlights: [
        'Searchable repository by course and unit',
        'In-browser rich lecture reader',
        'Instant bookmarking capability'
      ]
    },
    {
      step: '04',
      title: 'Algorithmic Coding Practice',
      subtitle: 'Python Coding Lab Sandbox',
      icon: Terminal,
      description: 'Engage with practical computer science challenges right in the browser. Run algorithms for Binary Search Tree validation, Dijkstra shortest paths, relational functional dependencies, and decorators with real-time console feedback.',
      actionText: 'Launch Coding Lab',
      actionPage: 'coding-lab',
      highlights: [
        'Pre-loaded MCA Semester 1 problem templates',
        'Automated test case validator',
        'Execution latency & stdout console output'
      ]
    },
    {
      step: '05',
      title: 'Examination Participation',
      subtitle: 'Timed Unit & Model Assessments',
      icon: FileCheck2,
      description: 'Take timed objective examinations designed by faculty to measure theoretical and problem-solving readiness. Track time with the countdown clock and flag questions for review before submitting.',
      actionText: 'Take Practice Examination',
      actionPage: 'examinations',
      highlights: [
        'Synchronized countdown timer',
        'Interactive question palette navigator',
        'Review flagged questions before submitting'
      ]
    },
    {
      step: '06',
      title: 'Automatic Grading & Feedback',
      subtitle: 'Instant Evaluation Engine',
      icon: Award,
      description: 'Upon submitting your examination, the evaluation engine scores your answers instantly against the verified answer key. Review detailed explanations for every correct and incorrect answer to reinforce learning.',
      actionText: 'Review Exam Engine',
      actionPage: 'examinations',
      highlights: [
        'Zero-latency automated scoring',
        'Detailed rationale for every question',
        'Permanent record in student performance ledger'
      ]
    },
    {
      step: '07',
      title: 'Performance Analytics',
      subtitle: 'Mastery Visualizers & Diagnostics',
      icon: TrendingUp,
      description: 'Analyze topic mastery, syllabus progress, and historical quiz scores through interactive visual charts. Identify subject strengths and target areas requiring further preparation.',
      actionText: 'Inspect Analytics',
      actionPage: 'analytics',
      highlights: [
        'Subject proficiency radar visualizations',
        'Syllabus completion and study session tracking',
        'Historical quiz progression curve'
      ]
    },
    {
      step: '08',
      title: 'Academic Report Generation',
      subtitle: 'Formal Grade Sheets & Exports',
      icon: FileText,
      description: 'Generate formal Semester 1 progress reports, calculate projected SGPA, and download printable PDF grade cards or CSV data sheets formatted for academic records.',
      actionText: 'Generate Progress Report',
      actionPage: 'reports',
      highlights: [
        'University-formatted printable grade card',
        'Instant CSV / Excel spreadsheet export',
        'Official credit calculation'
      ]
    }
  ];

  const currentStage = workflowStages[activeStage];
  const CurrentIcon = currentStage.icon;

  const handleAction = (page: string) => {
    if (page === 'login' && currentUser) {
      setCurrentPage('dashboard');
    } else if (['materials', 'coding-lab', 'examinations', 'analytics', 'reports'].includes(page) && !currentUser) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Student Assessment Lifecycle
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          How MCA SMART CAMPUS Works
        </h1>
        <p className="text-sm sm:text-base text-[#795548] dark:text-stone-300 leading-relaxed">
          A seamless 8-stage pedagogical workflow guiding students from initial course orientation through self-paced learning, interactive coding, continuous assessment, and official grade generation.
        </p>
      </div>

      {/* Visual Timeline Bar */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-2 min-w-[760px] p-2 bg-[#292929] rounded-xl border border-stone-800">
          {workflowStages.map((stg, idx) => {
            const isCurrent = activeStage === idx;
            return (
              <button
                key={stg.step}
                onClick={() => setActiveStage(idx)}
                className={`flex-1 py-2 px-3 rounded-lg text-left transition-all ${
                  isCurrent
                    ? 'bg-[#B83232] text-white shadow-xs border border-white/20'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`font-mono text-[10px] font-bold ${isCurrent ? 'text-[#F2C94C]' : 'text-stone-400'}`}>
                  STAGE {stg.step}
                </div>
                <div className="text-xs font-semibold truncate">
                  {stg.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Card */}
      <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#292929] text-[#F2C94C] flex items-center justify-center font-bold text-lg shadow-xs">
              <CurrentIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                  Step {currentStage.step} of 08
                </span>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-[#795548] dark:text-stone-400 font-medium">
                  {currentStage.subtitle}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#292929] dark:text-white">
                {currentStage.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => handleAction(currentStage.actionPage)}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-xs"
          >
            <span>{currentStage.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm text-[#795548] dark:text-stone-300 leading-relaxed max-w-3xl">
          {currentStage.description}
        </p>

        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-stone-400">
            Key Institutional Capabilities at this Stage
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentStage.highlights.map((item, hidx) => (
              <div
                key={hidx}
                className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-[#292929] dark:text-stone-300 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Previous / Next Stage Navigator */}
        <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
          <button
            onClick={() => setActiveStage(prev => Math.max(0, prev - 1))}
            disabled={activeStage === 0}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[#292929] dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            ← Previous Stage
          </button>
          <span className="text-[#795548] dark:text-stone-400 font-mono text-[11px]">
            {activeStage + 1} / {workflowStages.length}
          </span>
          <button
            onClick={() => setActiveStage(prev => Math.min(workflowStages.length - 1, prev + 1))}
            disabled={activeStage === workflowStages.length - 1}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-[#292929] dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next Stage →
          </button>
        </div>
      </div>
    </div>
  );
};
