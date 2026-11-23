import React, { useState, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import { PageId } from '../../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  Award,
  FolderArchive,
  Bell,
  BadgeCheck,
  Brain,
  Sliders,
  Settings,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight,
  KeyRound,
  ArrowLeftRight
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_MENU: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'admin-overview', label: 'Admin Overview', icon: LayoutDashboard },
  { id: 'admin-users', label: 'User & Account Manager', icon: Users },
  { id: 'admin-academics', label: 'MCA Programme & Semesters', icon: BookOpen },
  { id: 'admin-allocations', label: 'Faculty Allocations & Perms', icon: UserCheck },
  { id: 'admin-assessments', label: 'Assessments & Exams', icon: FileSpreadsheet },
  { id: 'admin-results', label: 'Results Publishing', icon: Award },
  { id: 'admin-materials', label: 'Materials & Question Bank', icon: FolderArchive },
  { id: 'admin-notices', label: 'Notices & Calendar', icon: Bell },
  { id: 'admin-certificates', label: 'Institutional Certificates', icon: BadgeCheck },
  { id: 'admin-analytics', label: 'Institutional Intelligence', icon: Brain },
  { id: 'admin-features', label: 'Campus Feature Controls', icon: Sliders },
  { id: 'admin-settings', label: 'System Settings', icon: Settings },
  { id: 'admin-audit-logs', label: 'Audit Logs', icon: ClipboardList },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { currentUser, currentPage, setCurrentPage, logoutUser, returnToPortalSelect, theme, toggleTheme } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  if (!currentUser || currentUser.role !== 'admin') return null;

  const activeLabel = ADMIN_MENU.find(m => m.id === currentPage)?.label || 'Admin Portal';

  const handleNav = (id: PageId) => {
    setCurrentPage(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] transition-colors">
      <header className="sticky top-0 z-40 w-full border-b border-[#3D3835] bg-[#292929] text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(p => !p)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-[#795548]/50 bg-[#1E1E1E] text-[#F2C94C]"
              aria-label="Toggle admin menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={() => handleNav('admin-overview')}
              className="flex items-center gap-2.5 text-left shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2C94C] text-[#292929] font-extrabold text-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap">
                  MCA SMART CAMPUS · ADMIN
                </span>
                <span className="text-[10px] text-[#F2C94C] -mt-0.5 uppercase tracking-wider font-bold">
                  Institutional Governance
                </span>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-white/15">
              <span className="text-xs font-semibold text-[#D7CCC8] truncate">{activeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#1E1E1E] text-[#F2C94C]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleNav('change-password')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#1E1E1E] text-[#F2C94C] hover:border-[#F2C94C]/60 transition-colors"
              aria-label="Change password"
              title="Change account password"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#795548]/40 text-xs font-bold text-[#F2C94C]">
              {currentUser.name}
            </span>
            {currentUser.isDemo && (
              <button
                type="button"
                onClick={returnToPortalSelect}
                className="flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#F2C94C]/40 bg-[#1E1E1E] hover:bg-black text-[#F2C94C] text-xs font-bold whitespace-nowrap"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Switch Portal</span>
              </button>
            )}
            <button
              type="button"
              onClick={logoutUser}
              className="flex h-9 items-center gap-1.5 px-3 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <aside
              aria-label="Admin Portal Navigation"
              className={`${
                mobileOpen
                  ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex shadow-2xl overflow-y-auto pt-4'
                  : 'hidden'
              } lg:static lg:z-auto lg:flex lg:w-64 shrink-0 bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] lg:border-y-0 lg:border-l-0 lg:border-r flex-col justify-between p-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto`}
            >
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] mb-2">
                  Admin Workspace
                </p>
                {ADMIN_MENU.map(item => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-[#B83232] text-white font-bold shadow-xs'
                          : 'text-[#292929] hover:text-[#B83232] hover:bg-[#F7F5F2] dark:text-[#F7F5F2] dark:hover:text-[#F2C94C] dark:hover:bg-[#1E1E1E]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#F2C94C]' : 'text-[#795548] dark:text-[#BDB7B2]'}`} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-[#F2C94C] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                <button
                  type="button"
                  onClick={logoutUser}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#B83232] hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
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
