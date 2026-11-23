import React, { useState, useMemo } from 'react';
import { usePortal } from '../../context/PortalContext';
import { SEMESTER_SUBJECTS, FAQS } from '../../data/academicData';
import {
  FileCheck2,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Bot,
  FileSpreadsheet,
  Bell,
  Brain,
  Dna,
  FolderKanban,
  Briefcase,
  CalendarClock,
  Network,
  ShieldCheck,
  GraduationCap,
  HelpCircle,
  Layers,
  Compass,
  Search,
  ChevronDown,
  ChevronUp,
  LogIn,
  BookOpen,
  Award,
} from 'lucide-react';
import { ImportantNoticesSection } from '../portal/ImportantNoticesSection';

export const HomePage: React.FC = () => {
  const {
    setCurrentPage,
    setSelectedSubject,
    currentUser,
    activePublishedNotices,
    semesters,
    allSubjects,
  } = usePortal();

  // Embedded FAQ Search & Category Filter State
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<string>('All');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
  });

  const faqCategories = ['All', 'Accounts', 'Curriculum', 'Examinations', 'Coding Lab', 'Materials', 'Reports'];

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(faq => {
      const matchesCategory = faqCategory === 'All' || faq.category === faqCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqSearch, faqCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubjectExplore = (subject: typeof SEMESTER_SUBJECTS[0]) => {
    setSelectedSubject(subject);
    setCurrentPage('subjects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePortalAccess = () => {
    if (currentUser) {
      if (currentUser.role === 'admin') setCurrentPage('admin-overview');
      else if (currentUser.role === 'faculty') setCurrentPage('faculty-overview');
      else setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeatureLaunch = (pageId: string) => {
    if (currentUser) {
      setCurrentPage(pageId as any);
    } else {
      setCurrentPage('login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const coreCapabilities = [
    {
      title: 'AI-Powered PDF Learning',
      desc: 'Page-cited study notes, model answers, and grounded AI tutor responses anchored in uploaded course PDFs.',
      icon: Bot,
      actionPage: 'materials',
    },
    {
      title: 'AI Assignment Generation',
      desc: 'Topic-based, difficulty-calibrated, and CO-aligned assignments with structured rubric evaluation.',
      icon: FileSpreadsheet,
      actionPage: 'assignments',
    },
    {
      title: 'Online Examinations',
      desc: 'Timed unit assessments with instant objective scoring and detailed answer rationales.',
      icon: FileCheck2,
      actionPage: 'examinations',
    },
    {
      title: 'Isolated Python Coding Lab',
      desc: 'Execute real Python 3 algorithms via server-side isolated runner with automated sample assertions.',
      icon: Terminal,
      actionPage: 'coding-lab',
    },
  ];

  const sixUniqueFeatures = [
    {
      title: 'Academic Intelligence Centre',
      desc: 'Diagnoses strong vs weak subjects, pending assessments, and targeted study actions directly from real academic records.',
      icon: Brain,
      page: 'intelligence',
    },
    {
      title: 'Skill DNA',
      desc: 'Tracks 9 postgraduate competencies exclusively from faculty-verified practical evidence, labs, and evaluated assessments.',
      icon: Dna,
      page: 'skill-dna',
    },
    {
      title: 'Project Studio',
      desc: 'Full lifecycle from team milestones and GitHub/demo links to faculty evaluation and campus showcase approval.',
      icon: FolderKanban,
      page: 'project-studio',
    },
    {
      title: 'Career Readiness Lab',
      desc: 'Python, DSA, Aptitude & Verbal practice sets paired with JD Skill-Gap analysis against your verified Skill DNA.',
      icon: Briefcase,
      page: 'career-lab',
    },
    {
      title: 'Smart Study Planner',
      desc: 'Personal study blocks, weekly credit-hour goals, Pomodoro studio, and faculty revision recommendations.',
      icon: CalendarClock,
      page: 'study-planner',
    },
    {
      title: 'Knowledge Graph',
      desc: 'Interactive concept map linking Semesters, Subjects, Units, Published Materials, and Applied Projects across the MCA curriculum.',
      icon: Network,
      page: 'knowledge-graph',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Admin & Faculty Allocation',
      desc: 'Admin configures semester subjects and allocates subject coordinators to govern official learning modules.',
      icon: LogIn,
    },
    {
      step: '02',
      title: 'Faculty Publishes Content',
      desc: 'Faculty uploads unit materials as drafts or published PDFs with topics, learning objectives, and study reading views.',
      icon: BookOpen,
    },
    {
      step: '03',
      title: 'Student Reads & Assesses',
      desc: 'Students read published faculty PDFs, complete assignments, attempt timed exams, and run code in the Python 3 lab.',
      icon: Terminal,
    },
    {
      step: '04',
      title: 'Verified Results & Skill DNA',
      desc: 'Evaluated assessments and reviewed projects feed Academic Reports, Performance Analytics, and verified Skill DNA.',
      icon: Award,
    },
  ];

  const sem1Subjects = allSubjects.filter(s => (s.semester ?? 1) === 1);

  return (
    <div className="relative overflow-hidden">
      {/* Subtle Behind-Content Animated Academic Background */}
      <div className="mca-public-animated-bg" aria-hidden="true">
        <div className="mca-public-animated-bg__grid" />
        <div
          className="mca-public-animated-bg__orb w-[28rem] h-[28rem] -top-28 -right-24 bg-[#B83232]/10 dark:bg-[#B83232]/15"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="mca-public-animated-bg__orb w-[24rem] h-[24rem] top-[38%] -left-24 bg-[#F2C94C]/12 dark:bg-[#F2C94C]/10"
          style={{ animationDelay: '-7s' }}
        />
      </div>

      {/* A. HOME / HERO SECTION */}
      <section id="home" className="public-section relative z-10 bg-transparent">
        <div className="public-container">
          <div className="max-w-4xl mx-auto text-center space-y-6 py-4 sm:py-8">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-[#292929] text-[#F2C94C] border border-[#795548]/40 text-xs font-bold tracking-wide">
              <span>MCA SMART CAMPUS · BEYOND ACADEMICS. BUILT FOR GROWTH.</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight leading-[1.1]">
              Postgraduate Computing,{' '}
              <span className="text-[#B83232] dark:text-[#F2C94C]">
                Verified in Practice.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed max-w-2xl mx-auto">
              A staff-governed MCA Smart Campus connecting faculty-published PDF materials, structured assignments, isolated Python 3 execution, Project Studio, and evidence-based Skill DNA.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={handlePortalAccess}
                className="public-btn px-6 py-2.5 text-sm text-white bg-[#B83232] hover:bg-[#9E2A2A] shadow-xs whitespace-nowrap shrink-0"
              >
                <span>{currentUser ? 'Open My Workspace' : 'Enter Campus Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('subjects');
                  if (el && typeof el.scrollIntoView === 'function') {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    setCurrentPage('subjects');
                  }
                }}
                className="public-btn px-6 py-2.5 text-sm text-[#292929] bg-white hover:bg-[#F7F5F2] border border-[#795548] dark:bg-[#292929] dark:text-[#F7F5F2] dark:border-[#795548] dark:hover:bg-[#1E1E1E] whitespace-nowrap shrink-0"
              >
                Explore Subjects
              </button>
            </div>

            <div className="pt-4 border-t border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#795548] dark:text-[#BDB7B2] font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
                <span>Faculty Advisor: <strong className="text-[#292929] dark:text-[#F7F5F2]">HCASICAN</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
                <span>{activePublishedNotices.length} Active Notice{activePublishedNotices.length === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#795548] dark:text-[#F2C94C] shrink-0" />
                <span>Semesters 1–4 Structured</span>
              </div>
            </div>
          </div>

          {/* Unified Metric Strip */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs divide-y lg:divide-y-0 lg:divide-x divide-[#E5DFD9] dark:divide-[#3D3835]">
            <div className="p-6 text-center">
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-[#F7F5F2]">4</p>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-semibold mt-1">Confirmed Sem 1 Courses</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[#B83232] dark:text-[#F2C94C]">6</p>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-semibold mt-1">Integrated Growth Modules</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-[#F7F5F2]">3</p>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-semibold mt-1">Role-Isolated Portals</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[#795548] dark:text-[#F2C94C]">Python 3</p>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-semibold mt-1">Isolated Subprocess Lab</p>
            </div>
          </div>
        </div>
      </section>

      {/* B. ABOUT SECTION (MISSION, VISION & 4-SEMESTER ARCHITECTURE) */}
      <section id="about" className="public-section public-section--alt relative z-10">
        <div className="public-container space-y-6">
          <div className="public-section-heading">
            <div>
              <span className="public-kicker">Academic Architecture &amp; MCA Programme</span>
              <h2 className="public-title">About MCA Smart Campus</h2>
              <p className="public-subtitle">
                Built around academic rigor, verified skill evidence, and institutional clarity across dedicated Student, Faculty, and Admin workspaces.
              </p>
            </div>
          </div>

          {/* Mission & Vision Equal Cards */}
          <div className="public-grid grid-cols-1 md:grid-cols-2">
            <div className="public-card public-card--accent gap-4 shadow-xs">
              <div className="space-y-3">
                <div className="public-icon-box bg-[#B83232]/10 dark:bg-[#B83232]/20 text-[#B83232] dark:text-[#F2C94C]">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-[#292929] dark:text-white">Our Mission</h3>
                <p className="text-xs sm:text-sm text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                  Deliver a unified postgraduate computing ecosystem where mathematical theory, algorithmic coding, relational data engineering, and Python systems mastery are studied, tested, and verified in unison.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] text-xs font-semibold text-[#795548] dark:text-[#F2C94C]">
                Aligned with MCA Semester 1–4 Curriculum Standards
              </div>
            </div>

            <div className="public-card public-card--accent gap-4 shadow-xs">
              <div className="space-y-3">
                <div className="public-icon-box bg-[#292929] text-[#F2C94C] border border-[#795548]/40">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-[#292929] dark:text-white">Our Vision</h3>
                <p className="text-xs sm:text-sm text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                  Set the institutional benchmark for postgraduate digital pedagogy through objective unit assessments, isolated code execution, faculty-verified Skill DNA, and transparent Academic Reports.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] text-xs font-semibold text-[#795548] dark:text-[#F2C94C]">
                Transparent Performance &amp; Evidence Verification
              </div>
            </div>
          </div>

          {/* Semesters 1–4 Structure Grid */}
          <div className="public-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {semesters.map(sem => (
              <div
                key={sem.id}
                className={`public-card gap-3 shadow-xs ${
                  sem.status === 'Active' ? 'public-card--accent' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#B83232] dark:text-[#F2C94C]">
                      {sem.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                        sem.number === 1
                          ? 'bg-amber-100 text-[#795548] dark:bg-amber-950/60 dark:text-[#F2C94C]'
                          : 'bg-[#EFEBE9] dark:bg-[#292929] text-[#795548] dark:text-[#BDB7B2]'
                      }`}
                    >
                      {sem.number === 1 ? 'Upcoming / Managed' : 'Admin Configurable'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">
                    {sem.number === 1
                      ? `${sem1Subjects.length} Core Subjects · 20 Units`
                      : `${allSubjects.filter(s => s.semester === sem.number).length} Configured Subjects`}
                  </p>
                </div>
                <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                  {sem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* C. SEMESTER 1 CORE SUBJECTS */}
      <section id="subjects" className="public-section relative z-10 bg-transparent">
        <div className="public-container">
          <div className="public-section-heading public-section-heading--split">
            <div>
              <span className="public-kicker">Curriculum Catalog</span>
              <h2 className="public-title">MCA Semester 1 Subjects</h2>
              <p className="public-subtitle">
                Preserved core MCA Semester 1 subjects with full 5-unit syllabus matrices, grounded AI study materials, and practical coding labs.
              </p>
            </div>

            <button
              onClick={() => {
                setCurrentPage('subjects');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>View Full Syllabus Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="public-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {sem1Subjects.map(subject => (
              <div
                key={subject.id}
                className="public-card public-card--accent shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C] border border-[#795548]/30">
                      {subject.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border whitespace-nowrap ${
                        subject.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : subject.status === 'Active'
                          ? 'bg-[#B83232]/10 text-[#B83232] border-[#B83232]/30 dark:text-[#F2C94C]'
                          : 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C] dark:border-amber-800'
                      }`}
                    >
                      {subject.status || 'Upcoming'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2] mb-2 group-hover:text-[#B83232] dark:group-hover:text-[#F2C94C] transition-colors">
                    {subject.name}
                  </h3>

                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed line-clamp-3 mb-4">
                    {subject.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 text-xs text-[#292929] dark:text-[#BDB7B2] pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#795548] dark:text-[#BDB7B2]">Credits &amp; Units:</span>
                      <span className="font-bold">{subject.credits} Credits · {subject.totalModules} Units</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#795548] dark:text-[#BDB7B2]">Coordinator:</span>
                      <span className="truncate font-semibold">{subject.instructor}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubjectExplore(subject)}
                    className="public-btn w-full py-2.5 px-4 text-xs text-white bg-[#B83232] hover:bg-[#9E2A2A] shadow-xs"
                  >
                    <span>Explore Subject</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* D. FEATURES (6 INTEGRATED GROWTH MODULES + CORE ENGINE) */}
      <section id="features" className="public-section public-section--alt relative z-10">
        <div className="public-container space-y-8">
          <div className="public-section-heading public-section-heading--split mb-0">
            <div>
              <span className="public-kicker">Platform Features &amp; Beyond Academics</span>
              <h2 className="public-title">6 Integrated Growth Modules &amp; Academic Engine</h2>
              <p className="public-subtitle">
                Every module connects verified coursework metrics with faculty-published PDFs, coding execution, and Skill DNA evidence.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentPage('features');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Explore All Platform Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6 Unique Growth Modules Grid */}
          <div className="public-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sixUniqueFeatures.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="public-card gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="public-icon-box bg-[#B83232]/10 dark:bg-[#B83232]/20 text-[#B83232] dark:text-[#F2C94C]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#795548] dark:text-[#BDB7B2]">
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2] mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFeatureLaunch(mod.page)}
                    className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline flex items-center gap-1.5 pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]"
                  >
                    <span>Preview Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Core Academic Engine 4-Card Row */}
          <div className="public-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {coreCapabilities.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="public-card public-card--accent gap-4 shadow-xs"
                >
                  <div>
                    <div className="public-icon-box bg-[#292929] text-[#F2C94C] mb-4 border border-[#795548]/40">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2] mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFeatureLaunch(feat.actionPage)}
                    className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline flex items-center gap-1.5 pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* E. IMPORTANT NOTICES SECTION */}
      <section id="important-notices" className="public-section relative z-10 bg-transparent">
        <div className="public-container">
          <ImportantNoticesSection allowManagement={false} />
        </div>
      </section>

      {/* F. HOW IT WORKS */}
      <section id="how-it-works" className="public-section public-section--alt relative z-10">
        <div className="public-container">
          <div className="public-section-heading public-section-heading--split">
            <div>
              <span className="public-kicker">End-to-End Academic Lifecycle</span>
              <h2 className="public-title">How It Works</h2>
              <p className="public-subtitle">
                Staff-governed academic workflow guiding cohorts from faculty content publication to assessments and verified results.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentPage('how-it-works');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Detailed 8-Stage Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="public-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={idx}
                  className="public-card public-card--accent gap-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="public-icon-box bg-[#292929] text-[#F2C94C] border border-[#795548]/40">
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-2xl font-black text-[#B83232] dark:text-[#F2C94C]">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* G. FAQ SECTION */}
      <section id="faq" className="public-section relative z-10 bg-transparent">
        <div className="public-container">
          <div className="public-section-heading">
            <div>
              <span className="public-kicker">Support Knowledge Base</span>
              <h2 className="public-title">Frequently Asked Questions</h2>
              <p className="public-subtitle">
                Search answers on isolated portal authentication, Semester 1 coursework, Python Coding Lab execution, and Skill DNA tracking.
              </p>
            </div>
          </div>

          <div className="public-grid grid-cols-1 lg:grid-cols-12 items-start">
            {/* Search & Categories Controls */}
            <div className="lg:col-span-4 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#795548] dark:text-[#BDB7B2] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={e => setFaqSearch(e.target.value)}
                  placeholder="Search FAQ keywords..."
                  aria-label="Search Frequently Asked Questions"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-xs text-[#292929] dark:text-white placeholder:text-[#795548]/70 focus:border-[#B83232]"
                />
              </div>

              <div className="p-2 rounded-xl bg-[#292929] border border-[#3D3835] flex flex-wrap gap-1.5">
                {faqCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFaqCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      faqCategory === cat
                        ? 'bg-[#B83232] text-white'
                        : 'text-[#D7CCC8] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion Questions */}
            <div className="lg:col-span-8 space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
                  <HelpCircle className="w-8 h-8 text-[#795548] dark:text-[#F2C94C] mx-auto" />
                  <p className="text-sm font-bold text-[#292929] dark:text-white">No matching answers found</p>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                    Try adjusting your search keywords or selecting All categories.
                  </p>
                </div>
              ) : (
                filteredFaqs.map(faq => {
                  const isOpen = !!openFaqIds[faq.id];
                  return (
                    <div
                      key={faq.id}
                      className="rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] overflow-hidden shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isOpen}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] transition-colors"
                      >
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 min-w-0">
                          <span className="font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C] shrink-0 border border-[#795548]/30">
                            {faq.category}
                          </span>
                          <span className="text-sm font-bold text-[#292929] dark:text-white leading-snug">
                            {faq.question}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#795548] dark:text-[#F2C94C] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#795548] dark:text-[#F2C94C] shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-3 text-xs sm:text-sm text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed border-t border-[#E5DFD9] dark:border-[#3D3835]">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
