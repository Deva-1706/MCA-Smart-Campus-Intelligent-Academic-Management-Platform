import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { ArrowLeft, Sun, Moon, LogOut } from 'lucide-react';
import authHeroBackdrop from '../../assets/images/academic_portal_hero_1794487199756.jpg';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { currentUser, logoutUser, setCurrentPage, theme, toggleTheme } = usePortal();

  const handleBackToWebsite = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToWorkspace = () => {
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
      setCurrentPage('admin-overview');
    } else if (currentUser.role === 'faculty') {
      setCurrentPage('faculty-overview');
    } else {
      setCurrentPage('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#1B1715] text-[#292929] dark:text-[#F7F5F2] transition-colors overflow-x-hidden">
      {/* Full-Bleed Campus Illustration Backdrop + Dark Readability Scrim */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
        <img
          src={authHeroBackdrop}
          alt=""
          className="w-full h-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#191513]/85 via-[#292929]/75 to-[#1E1412]/90 backdrop-blur-[2px]" />
      </div>

      {/* Minimal Dedicated Authentication Header (Zero Public Navigation Links) */}
      <header className="relative z-10 w-full border-b border-white/15 bg-[#292929]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={currentUser ? handleReturnToWorkspace : handleBackToWebsite}
            className="flex items-center gap-2.5 text-left text-white hover:opacity-90 transition-opacity min-w-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B83232] text-[#F2C94C] font-extrabold text-xs tracking-wider shadow-xs border border-[#F2C94C]/30 shrink-0">
              MCA
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap">
                MCA SMART CAMPUS
              </span>
              <span className="text-[10px] text-[#F2C94C] -mt-0.5 tracking-wide font-semibold whitespace-nowrap">
                Beyond Academics. Built for Growth.
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#D7CCC8] hover:bg-white/10 hover:text-[#F2C94C] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[#F2C94C]" />
              ) : (
                <Moon className="h-4 w-4 text-[#F2C94C]" />
              )}
            </button>

            {currentUser?.mustChangePassword ? (
              <button
                type="button"
                onClick={logoutUser}
                className="px-3.5 py-2 text-xs font-bold text-[#F2C94C] border border-[#F2C94C]/40 hover:bg-white/10 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            ) : currentUser ? (
              <button
                type="button"
                onClick={handleReturnToWorkspace}
                className="px-3.5 py-2 text-xs font-bold text-[#F2C94C] hover:text-white border border-white/20 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to Portal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBackToWebsite}
                className="px-3.5 py-2 text-xs font-semibold text-[#F7F5F2] hover:text-[#F2C94C] border border-white/20 bg-white/10 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Back to Website</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Centered Authentication Body */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {children}
      </main>

      {/* Minimal Authentication Footer */}
      <footer className="relative z-10 w-full border-t border-white/15 bg-[#1B1715]/80 backdrop-blur-sm py-4 px-4 text-center text-[11px] text-[#D7CCC8]">
        MCA Smart Campus · Department of Computer Applications · Role-Based Academic Authentication
      </footer>
    </div>
  );
};
