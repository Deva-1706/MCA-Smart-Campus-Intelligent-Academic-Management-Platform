import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  FileSpreadsheet,
  Terminal,
  FolderArchive,
  Bookmark,
  TrendingUp,
  FileText,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Award,
  Target,
  Layers,
  CalendarDays,
  Brain,
  Dna,
  FolderKanban,
  Briefcase,
  CalendarClock,
  Network,
  Bot
} from 'lucide-react';
import { PomodoroTimerWidget } from '../portal/PomodoroTimerWidget';

interface StudentSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logoutUser,
    bookmarks,
    assignments,
    allExaminations,
    completedExamResults,
    unreadNotificationsCount,
    achievements,
    flashcardDecks
  } = usePortal();

  if (!currentUser) return null;

  const activeAssignmentsCount = assignments.filter(a => a.status === 'In Progress' || a.status === 'Not Started').length;
  const completedExamIds = new Set(completedExamResults.map(r => r.examId));
  const upcomingExamsCount = allExaminations.filter(
    e => e.status !== 'Completed' && !completedExamIds.has(e.id)
  ).length;
  const earnedAchievementsCount = achievements.filter(a => a.earned).length;

  const overviewMenuItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const contentMenuItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'materials', label: 'Learning Materials', icon: FolderArchive, badge: 'Content & Read' },
    { id: 'my-subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'ai-assistant', label: 'AI PDF Chat', icon: Bot },
  ];

  const assessmentMenuItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'assignments', label: 'Assignments', icon: FileSpreadsheet, badge: activeAssignmentsCount > 0 ? `${activeAssignmentsCount} Due` : undefined },
    { id: 'examinations', label: 'Examinations', icon: FileCheck2, badge: upcomingExamsCount > 0 ? `${upcomingExamsCount} Due` : undefined },
    { id: 'coding-lab', label: 'Python Coding Lab', icon: Terminal },
    { id: 'practice-arena', label: 'Practice Arena', icon: Target },
  ];

  const resultsMenuItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'reports', label: 'Academic Reports', icon: FileText },
    { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements & Certificates', icon: Award, badge: earnedAchievementsCount > 0 ? earnedAchievementsCount : undefined },
    { id: 'flashcards', label: 'AI Flashcards & Revision', icon: Layers, badge: flashcardDecks.length > 0 ? flashcardDecks.length : undefined },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, badge: bookmarks.length },
    { id: 'calendar', label: 'Academic Calendar & Timetable', icon: CalendarDays },
  ];

  const growthMenuItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'intelligence', label: 'Academic Intelligence', icon: Brain },
    { id: 'skill-dna', label: 'Skill DNA', icon: Dna },
    { id: 'project-studio', label: 'Project Studio', icon: FolderKanban },
    { id: 'career-lab', label: 'Career Readiness Lab', icon: Briefcase },
    { id: 'study-planner', label: 'Smart Study Planner', icon: CalendarClock },
    { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network },
  ];

  const accountMenuItems: { id: PageId; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'profile', label: 'Student Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined },
  ];

  const handleSelect = (id: PageId) => {
    setCurrentPage(id);
    onCloseMobile?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderGroup = (title: string, items: typeof overviewMenuItems) => (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C] mt-4 mb-1.5">
        {title}
      </p>
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
              isActive
                ? 'bg-[#B83232] text-white shadow-xs font-bold'
                : 'text-[#292929] hover:text-[#B83232] hover:bg-[#F7F5F2] dark:text-[#F7F5F2] dark:hover:text-[#F2C94C] dark:hover:bg-[#1E1E1E]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#F2C94C]'
                    : 'text-[#795548] group-hover:text-[#B83232] dark:text-[#BDB7B2] dark:group-hover:text-[#F2C94C]'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive
                      ? 'bg-[#292929] text-[#F2C94C]'
                      : item.id === 'notifications'
                      ? 'bg-[#B83232] text-white'
                      : 'bg-[#EFEBE9] text-[#795548] dark:bg-[#1E1E1E] dark:text-[#F2C94C]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-0.5 shrink-0 text-[#F2C94C]" />}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside
      aria-label="Student Portal Navigation"
      className={`${
        mobileOpen
          ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex shadow-2xl overflow-y-auto pt-4'
          : 'hidden'
      } lg:static lg:z-auto lg:flex lg:w-64 lg:shadow-none shrink-0 bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] lg:border-y-0 lg:border-l-0 lg:border-r lg:rounded-none flex-col justify-between p-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto`}
    >
      <div>
        {/* Student Mini Profile */}
        <div className="p-3 mb-2 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B83232] text-[#F2C94C] flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm border border-[#795548]/30">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-mono">
                {currentUser.rollNumber || currentUser.studentId} · Sem {currentUser.semester}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between text-xs">
            <span className="text-[#6E6863] dark:text-[#BDB7B2]">Faculty Advisor</span>
            <span className="font-bold text-[#292929] dark:text-[#F2C94C]">
              {currentUser.advisorName}
            </span>
          </div>
        </div>

        {renderGroup('Overview', overviewMenuItems)}
        {renderGroup('1. Content & Read', contentMenuItems)}
        {renderGroup('2. Assessment', assessmentMenuItems)}
        {renderGroup('3. Results & Study Tools', resultsMenuItems)}
        {renderGroup('Smart Campus Growth', growthMenuItems)}
        {renderGroup('Account & Alerts', accountMenuItems)}
      </div>

      {/* Pomodoro Timer & Bottom Section */}
      <div className="pt-4 space-y-3">
        <PomodoroTimerWidget />

        <div className="pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
          <button
            onClick={() => {
              onCloseMobile?.();
              logoutUser();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#B83232] hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
