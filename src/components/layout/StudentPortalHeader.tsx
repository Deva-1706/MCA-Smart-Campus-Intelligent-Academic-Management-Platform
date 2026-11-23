import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { PageId } from '../../types';
import { ArrowLeftRight, Bell, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface StudentPortalHeaderProps {
  mobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  about: 'About',
  subjects: 'Subjects',
  features: 'Features',
  'how-it-works': 'How It Works',
  faq: 'FAQ',
  login: 'Student Login',
  'student-login': 'Student Login',
  'faculty-login': 'Faculty Login',
  'admin-login': 'Admin Login',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  'change-password': 'Change Password',
  dashboard: 'Dashboard',
  'my-courses': 'My Courses',
  'my-semesters': 'My Semesters',
  'my-subjects': 'My Subjects',
  assignments: 'Assignments',
  examinations: 'Examinations',
  'coding-lab': 'Python Coding Lab',
  materials: 'Learning Materials',
  'ai-notes': 'AI Study Notes',
  'ai-assistant': 'AI Tutor Assistant',
  'question-bank': 'Question Bank',
  bookmarks: 'Bookmarks',
  analytics: 'Performance Analytics',
  reports: 'Academic Reports',
  notifications: 'Notifications',
  profile: 'Student Profile',
  achievements: 'Achievements & Certificates',
  'practice-arena': 'Practice Arena',
  flashcards: 'AI Flashcards & Revision',
  calendar: 'Academic Calendar & Timetable',
  intelligence: 'Academic Intelligence Centre',
  'skill-dna': 'Skill DNA',
  'project-studio': 'Project Studio',
  'career-lab': 'Career Readiness Lab',
  'study-planner': 'Smart Study Planner',
  'knowledge-graph': 'Knowledge Graph',
};

export const StudentPortalHeader: React.FC<StudentPortalHeaderProps> = ({
  mobileSidebarOpen,
  onToggleMobileSidebar,
}) => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logoutUser,
    returnToPortalSelect,
    theme,
    toggleTheme,
    unreadNotificationsCount,
  } = usePortal();

  if (!currentUser) return null;

  const activeTitle = PAGE_LABELS[currentPage] || 'Student Portal';

  const navigateTo = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#3D3835] bg-[#292929] text-[#F7F5F2] shadow-sm transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Sidebar Toggle + Portal Brand + Active Section */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-[#795548]/50 bg-[#1E1E1E] text-[#F2C94C] hover:bg-black transition-colors shrink-0"
            aria-label={mobileSidebarOpen ? 'Close student menu' : 'Open student menu'}
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B83232] text-[#F2C94C] font-extrabold text-sm tracking-wide border border-[#F2C94C]/30 shadow-xs">
              MCA
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap">
                MCA SMART CAMPUS
              </span>
              <span className="text-[10px] text-[#F2C94C] -mt-0.5 tracking-wider uppercase font-bold whitespace-nowrap">
                Student · Sem {currentUser.semester} · {currentUser.studentId}
              </span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-2.5 pl-3 ml-1 border-l border-white/15 min-w-0">
            <span className="text-xs font-semibold text-[#D7CCC8] truncate max-w-[220px]">
              {activeTitle}
            </span>
          </div>
        </div>

        {/* Right: Student Actions (No Public Nav Links) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#1E1E1E] text-[#F2C94C] hover:border-[#F2C94C]/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#F2C94C]" />
            ) : (
              <Moon className="h-4 w-4 text-[#F2C94C]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('notifications')}
            className="relative flex h-9 items-center gap-1.5 px-2.5 rounded-lg border border-white/10 bg-[#1E1E1E] text-xs font-semibold text-[#F7F5F2] hover:border-[#F2C94C]/50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-[#F2C94C]" />
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#B83232] text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="hidden sm:flex h-9 items-center gap-2 px-3 rounded-lg border border-[#795548]/50 bg-[#1E1E1E] hover:border-[#F2C94C]/60 transition-colors text-left"
          >
            <User className="h-3.5 w-3.5 text-[#F2C94C] shrink-0" />
            <span className="text-xs font-bold text-white whitespace-nowrap max-w-[140px] truncate">
              {currentUser.name}
            </span>
          </button>

          {currentUser.isDemo && (
            <button
              type="button"
              onClick={returnToPortalSelect}
              className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#F2C94C]/40 bg-[#1E1E1E] hover:bg-black text-[#F2C94C] text-xs font-bold transition-colors whitespace-nowrap"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Switch Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={logoutUser}
            className="flex h-9 items-center gap-1.5 px-3 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
