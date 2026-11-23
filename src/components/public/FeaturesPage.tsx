import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  LayoutDashboard,
  FileCheck2,
  Terminal,
  FolderArchive,
  Bookmark,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Target,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const { setCurrentPage, currentUser } = usePortal();
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);

  const features = [
    {
      id: 'dashboard',
      title: 'Academic Dashboard',
      category: 'Student Central',
      icon: LayoutDashboard,
      summary: 'Centralized cockpit tracking pending assessments, learning progress, academic notices, and verified scores.',
      details: [
        'Tracks course completion and GPA/SGPA automatically as verified assessments are graded',
        'Integrated Pomodoro study studio tracking active focus time across learning modules',
        'Visual timeline of upcoming unit assessments and scheduled examinations',
        'Quick access to published faculty PDFs, bookmarks, and Python coding problems'
      ],
      targetPage: 'dashboard'
    },
    {
      id: 'examinations',
      title: 'Online Examinations & Instant Grading',
      category: 'Evaluation Engine',
      icon: FileCheck2,
      summary: 'High-security timed unit assessments with automated evaluation and instant feedback.',
      details: [
        'Real-time countdown timer synchronized with examination duration',
        'Question navigator palette showing Answered, Flagged, and Not Visited questions',
        'Instant mathematical scoring upon submission with passing grade verification',
        'Granular explanations and references provided for every question'
      ],
      targetPage: 'examinations'
    },
    {
      id: 'coding-lab',
      title: 'Python Coding Lab',
      category: 'Practical Workbench',
      icon: Terminal,
      summary: 'In-browser Python code execution environment tailored for MCA Semester 1 algorithmic practice.',
      details: [
        'Curated problem statements: BST validation, Dijkstra shortest path, functional dependencies, closures',
        'Syntax-highlighted code editor with pre-loaded starter templates and standard library support',
        'Instant execution with live stdout console stream and execution timing',
        'Automated test case runner checking expected vs actual output'
      ],
      targetPage: 'coding-lab'
    },
    {
      id: 'materials',
      title: 'Digital Learning Materials',
      category: 'Content Repository',
      icon: FolderArchive,
      summary: 'Verified lecture notes, laboratory manuals, question banks, and reference cheat sheets.',
      details: [
        'Structured categorization by Course Code, Unit Number, and Material Type',
        'Built-in markdown and text reader for distraction-free study on any device',
        'Model question papers from previous 5 years of university examinations',
        'One-click bookmarking to save key references for quick revision'
      ],
      targetPage: 'materials'
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks Repository',
      category: 'Personalized Study',
      icon: Bookmark,
      summary: 'Personalized knowledge vault for quick revision of challenging questions and code snippets.',
      details: [
        'Save any lecture note, difficult quiz question, or algorithm directly to your vault',
        'Filter by category: Materials, Questions, Coding Problems, or Subjects',
        'Timestamped entries with quick launcher to the exact resource',
        'Persistent across sessions through student account storage'
      ],
      targetPage: 'bookmarks'
    },
    {
      id: 'analytics',
      title: 'Performance Analytics',
      category: 'Continuous Diagnostics',
      icon: TrendingUp,
      summary: 'Visual data dashboards tracking topic-level mastery, test score trends, and study metrics.',
      details: [
        'Subject-wise proficiency radar illustrating strengths and areas needing attention',
        'Historical quiz scores progression curve over the semester duration',
        'Credit completion and syllabus unit progress breakdown by course',
        'Comparative cohort distribution to benchmark personal mastery'
      ],
      targetPage: 'analytics'
    },
    {
      id: 'reports',
      title: 'Academic Reports (PDF & Excel/CSV)',
      category: 'Accreditation & Records',
      icon: FileText,
      summary: 'Formal Semester 1 progress cards, grade sheets, and exportable data files.',
      details: [
        'Consolidated Semester 1 grade sheet with course codes, credit hours, and earned grades',
        'Print-optimized formatted layout matching academic institution standards',
        'CSV / Excel export for external tabulation and personal records',
        'Verified faculty coordinator signatures and institutional audit marks'
      ],
      targetPage: 'reports'
    },
    {
      id: 'goals',
      title: 'Academic Goals & Milestones',
      category: 'Student Motivation',
      icon: Target,
      summary: 'Target SGPA modeling, study milestones, and syllabus completion checklists.',
      details: [
        'Set custom SGPA targets and calculate required marks in upcoming exams',
        'Unit-by-unit syllabus checklist marking completed topics',
        'Weekly study hour goals with streak tracking',
        'Automated reminders for pending laboratory exercises'
      ],
      targetPage: 'profile'
    }
  ];

  const activeFeature = features[selectedFeatureIndex];
  const ActiveIcon = activeFeature.icon;

  const handleLaunch = (page: string) => {
    if (currentUser) {
      setCurrentPage(page as any);
    } else {
      setCurrentPage('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Core Capabilities
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Comprehensive Academic Assessment & Learning Tools
        </h1>
        <p className="text-sm sm:text-base text-[#795548] dark:text-stone-300 leading-relaxed">
          Engineered to support postgraduate students throughout the MCA Semester 1 curriculum with real-time interactive tools, instant automated feedback, and structured academic tracking.
        </p>
      </div>

      {/* Interactive Feature Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Feature Navigation List */}
        <div className="lg:col-span-5 space-y-2">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            const isSelected = selectedFeatureIndex === idx;
            return (
              <button
                key={feat.id}
                onClick={() => setSelectedFeatureIndex(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-[#202020] border-[#B83232] shadow-sm ring-1 ring-[#B83232]/30'
                    : 'bg-white/70 dark:bg-[#202020]/50 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isSelected
                        ? 'bg-[#B83232] text-white font-bold'
                        : 'bg-stone-100 dark:bg-stone-800 text-[#292929] dark:text-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#795548] dark:text-stone-400 uppercase tracking-wider font-semibold">
                      {feat.category}
                    </p>
                    <p className="text-sm font-bold text-[#292929] dark:text-white truncate">
                      {feat.title}
                    </p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#B83232] dark:text-[#F2C94C] translate-x-1' : 'text-stone-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Side: Feature Spotlight Card */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#292929] text-[#F2C94C] shadow-xs">
                <ActiveIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-semibold text-[#B83232] dark:text-[#F2C94C]">
                  {activeFeature.category}
                </span>
                <h2 className="text-xl font-extrabold text-[#292929] dark:text-white">
                  {activeFeature.title}
                </h2>
              </div>
            </div>

            <button
              onClick={() => handleLaunch(activeFeature.targetPage)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Launch Live Feature
            </button>
          </div>

          <p className="text-sm text-[#795548] dark:text-stone-300 leading-relaxed">
            {activeFeature.summary}
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-stone-400">
              Technical Specifications & Key Features
            </h4>
            <div className="space-y-2.5">
              {activeFeature.details.map((detail, didx) => (
                <div key={didx} className="flex items-start gap-2.5 text-xs text-[#292929] dark:text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
                  <span className="leading-snug">{detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
            <span className="text-[#795548] dark:text-stone-400">
              Authentication state: {currentUser ? `Active as ${currentUser.name}` : 'Public preview mode'}
            </span>
            <button
              onClick={() => handleLaunch(activeFeature.targetPage)}
              className="text-[#B83232] dark:text-[#F2C94C] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore In Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
