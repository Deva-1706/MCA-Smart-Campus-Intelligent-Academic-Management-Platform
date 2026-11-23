import React, { useState, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  Layers,
  Users,
  FolderArchive,
  Sparkles,
  Database,
  FileSpreadsheet,
  FileCheck2,
  ClipboardCheck,
  Award,
  Target,
  FolderKanban,
  Dna,
  Network,
  Brain,
  CalendarDays,
  Bell,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronRight,
  GraduationCap,
  KeyRound,
  ArrowLeftRight,
} from 'lucide-react';

interface FacultyLayoutProps {
  children: React.ReactNode;
}

interface FacultyMenuItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
}

interface FacultyMenuGroup {
  groupTitle: string;
  items: FacultyMenuItem[];
}

const FACULTY_MENU_GROUPS: FacultyMenuGroup[] = [
  {
    groupTitle: 'Teaching & Cohorts',
    items: [
      { id: 'faculty-overview', label: 'Faculty Overview', icon: LayoutDashboard },
      { id: 'faculty-profile', label: 'Faculty Profile', icon: UserCheck },
      { id: 'faculty-subjects', label: 'Assigned Subjects', icon: BookOpen },
      { id: 'faculty-units', label: 'Units & Topics', icon: Layers },
      { id: 'faculty-students', label: 'Student Cohorts', icon: Users },
    ],
  },
  {
    groupTitle: 'Curriculum & Materials',
    items: [
      { id: 'faculty-materials', label: 'Document & Material Mgr', icon: FolderArchive },
      { id: 'faculty-ai-notes', label: 'AI Notes & Revision Recs', icon: Sparkles },
      { id: 'faculty-question-bank', label: 'Question Bank', icon: Database },
    ],
  },
  {
    groupTitle: 'Assessments & Gradebook',
    items: [
      { id: 'faculty-assignments', label: 'Assignments', icon: FileSpreadsheet },
      { id: 'faculty-exams', label: 'Examinations', icon: FileCheck2 },
      { id: 'faculty-evaluation', label: 'Submission Evaluation', icon: ClipboardCheck },
      { id: 'faculty-gradebook', label: 'Gradebook & Marks', icon: Award },
    ],
  },
  {
    groupTitle: 'Smart Campus Supervision',
    items: [
      { id: 'faculty-practice', label: 'Practice Arena Authoring', icon: Target },
      { id: 'faculty-projects', label: 'Project Reviews', icon: FolderKanban },
      { id: 'faculty-skills', label: 'Skill DNA Verification', icon: Dna },
      { id: 'faculty-knowledge-graph', label: 'Knowledge Graph Map', icon: Network },
      { id: 'faculty-analytics', label: 'Subject Intelligence', icon: Brain },
      { id: 'faculty-calendar', label: 'Calendar & Schedule', icon: CalendarDays },
      { id: 'faculty-notices', label: 'Campus Notices', icon: Bell },
    ],
  },
];

const FLAT_FACULTY_ITEMS = FACULTY_MENU_GROUPS.flatMap(g =>
  g.items.map(item => ({ ...item, groupTitle: g.groupTitle }))
);

export const FacultyLayout: React.FC<FacultyLayoutProps> = ({ children }) => {
  const {
    currentUser,
    currentPage,
    setCurrentPage,
    logoutUser,
    returnToPortalSelect,
    theme,
    toggleTheme,
    allSubjects,
    canFacultyAccessSubject,
  } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  if (!currentUser || currentUser.role !== 'faculty') return null;

  const activeEntry = FLAT_FACULTY_ITEMS.find(m => m.id === currentPage);
  const activeLabel = activeEntry?.label || 'Faculty Portal';
  const activeGroup = activeEntry?.groupTitle || 'Faculty Workspace';
  const assignedCount = allSubjects.filter(s => canFacultyAccessSubject(s.code)).length;

  const handleNav = (id: PageId) => {
    setCurrentPage(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F2] dark:bg-[#1A1A1A] text-[#292929] dark:text-[#F7F5F2] transition-colors">
      {/* Top Institutional Faculty Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#3D3835] bg-[#292929] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(p => !p)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-[#795548]/60 bg-[#1E1E1E] text-[#F2C94C] shrink-0"
              aria-label="Toggle faculty menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={() => handleNav('faculty-overview')}
              className="flex items-center gap-2.5 text-left shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B83232] border border-[#F2C94C]/40 text-[#F2C94C] shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap">
                  MCA SMART CAMPUS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2C94C] whitespace-nowrap">
                  Faculty Workspace · {assignedCount} Subjects
                </span>
              </div>
            </button>

            <nav
              aria-label="Faculty Breadcrumb"
              className="hidden md:flex items-center gap-1.5 pl-3 ml-1 border-l border-white/15 text-xs min-w-0"
            >
              <span className="text-[#BDB7B2] whitespace-nowrap">{activeGroup}</span>
              <span className="text-[#795548]">/</span>
              <span className="font-semibold text-white truncate">{activeLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#1E1E1E] text-[#F2C94C] hover:border-[#F2C94C]/60 transition-colors shrink-0"
              aria-label="Toggle theme"
              title="Toggle light/dark theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleNav('change-password')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#1E1E1E] text-[#F2C94C] hover:border-[#F2C94C]/60 transition-colors shrink-0"
              aria-label="Change password"
              title="Change account password"
            >
              <KeyRound className="h-4 w-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-[#1E1E1E] border border-[#795548]/50 whitespace-nowrap shrink-0">
              <span className="text-[10px] font-mono font-bold uppercase text-[#BDB7B2]">
                {currentUser.studentId || 'FAC001'}
              </span>
              <span className="h-3 w-px bg-white/15" />
              <span className="text-xs font-bold text-[#F2C94C]">
                {currentUser.name}
              </span>
            </div>

            {currentUser.isDemo && (
              <button
                type="button"
                onClick={returnToPortalSelect}
                className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#F2C94C]/40 bg-[#1E1E1E] hover:bg-black text-[#F2C94C] text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Switch Portal</span>
              </button>
            )}

            <button
              type="button"
              onClick={logoutUser}
              className="flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Faculty Workspace Container */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <aside
              aria-label="Faculty Portal Navigation"
              className={`${
                mobileOpen
                  ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex shadow-2xl overflow-y-auto pt-4'
                  : 'hidden'
              } lg:static lg:z-auto lg:flex lg:w-64 shrink-0 bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] rounded-2xl flex-col justify-between p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto`}
            >
              <div className="space-y-4">
                <div className="px-2 pb-3 border-b border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
                      Faculty Coordinator
                    </p>
                    <p className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2] truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] font-mono text-[#795548] dark:text-[#BDB7B2] truncate">
                      {currentUser.department || 'Dept. of Computer Applications'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg text-[#795548] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E]"
                    aria-label="Close faculty menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {FACULTY_MENU_GROUPS.map(group => (
                  <div key={group.groupTitle} className="space-y-1">
                    <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]">
                      {group.groupTitle}
                    </p>
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const active = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNav(item.id)}
                          aria-current={active ? 'page' : undefined}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-[#B83232] text-white font-bold'
                              : 'text-[#292929] hover:text-[#B83232] hover:bg-[#F7F5F2] dark:text-[#F7F5F2] dark:hover:text-[#F2C94C] dark:hover:bg-[#1E1E1E]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                active ? 'text-[#F2C94C]' : 'text-[#795548] dark:text-[#BDB7B2]'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {active && <ChevronRight className="w-3.5 h-3.5 text-[#F2C94C] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                <button
                  type="button"
                  onClick={logoutUser}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] rounded-lg transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>

            <div className="flex-1 min-w-0 w-full">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
};
