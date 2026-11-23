import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Sun, Moon, Menu, X, LogIn } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logoutUser,
    theme,
    toggleTheme,
  } = usePortal();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  const navLinks = [
    { id: 'home', label: 'Home', targetSection: 'home' },
    { id: 'about', label: 'About', targetSection: 'about' },
    { id: 'subjects', label: 'Subjects', targetSection: 'subjects' },
    { id: 'features', label: 'Features', targetSection: 'features' },
    { id: 'notices', label: 'Important Notices', targetSection: 'important-notices' },
    { id: 'how-it-works', label: 'How It Works', targetSection: 'how-it-works' },
    { id: 'faq', label: 'FAQ', targetSection: 'faq' },
  ];

  const scrollToHomepageSection = (sectionId: string) => {
    const scrollTarget = () => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(sectionId);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(scrollTarget, 60);
    } else {
      scrollTarget();
    }
  };

  const handleNav = (id: string) => {
    setMobileMenuOpen(false);
    const matchedSection = navLinks.find(l => l.id === id);
    if (matchedSection) {
      setActiveSection(matchedSection.id);
      scrollToHomepageSection(matchedSection.targetSection);
      return;
    }
    setActiveSection('home');
    setCurrentPage(id as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleDashboardPage = () => {
    if (!currentUser) return 'login';
    if (currentUser.role === 'admin') return 'admin-overview';
    if (currentUser.role === 'faculty') return 'faculty-overview';
    return 'dashboard';
  };

  const getRolePortalLabel = () => {
    if (!currentUser) return 'Login';
    if (currentUser.role === 'admin') return 'Admin Portal';
    if (currentUser.role === 'faculty') return 'Faculty Portal';
    return 'Student Portal';
  };

  const isLinkActive = (linkId: string) => {
    if (currentPage === 'home') return activeSection === linkId;
    return currentPage === linkId;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5DFD9] bg-white/95 backdrop-blur-md transition-colors dark:border-[#3D3835] dark:bg-[#292929]/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-left text-[#292929] transition-opacity hover:opacity-90 dark:text-[#F7F5F2]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#292929] text-[#F2C94C] font-extrabold text-xs tracking-wider shadow-xs dark:bg-[#1E1E1E] border border-[#795548]/40 shrink-0">
              MCA
            </div>
            <div className="flex flex-col">
              <span className="text-sm xl:text-base font-extrabold tracking-tight text-[#292929] whitespace-nowrap dark:text-[#F7F5F2]">
                MCA SMART CAMPUS
              </span>
              <span className="text-[10px] text-[#795548] -mt-0.5 tracking-wide font-semibold whitespace-nowrap dark:text-[#F2C94C]">
                Beyond Academics. Built for Growth.
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Concise Public Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-3.5 text-xs font-medium text-[#6E6863] dark:text-[#BDB7B2]">
          {navLinks.map(link => {
            const isActive = isLinkActive(link.id);
            return (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive
                    ? 'text-[#B83232] font-bold border-b-2 border-[#B83232] dark:text-[#F2C94C] dark:border-[#F2C94C]'
                    : 'hover:text-[#B83232] dark:hover:text-[#F2C94C]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle & Single Login Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6E6863] hover:bg-[#F7F5F2] hover:text-[#B83232] transition-colors dark:text-[#BDB7B2] dark:hover:bg-[#1E1E1E] dark:hover:text-[#F2C94C]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#F2C94C]" />
            ) : (
              <Moon className="h-4 w-4 text-[#795548]" />
            )}
          </button>

          {!currentUser ? (
            <button
              id="navbar-login-button"
              type="button"
              onClick={() => handleNav('login')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-all duration-150 shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83232] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#292929]"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Login</span>
            </button>
          ) : currentUser.mustChangePassword ? (
            <button
              type="button"
              onClick={logoutUser}
              className="px-4 py-2 text-xs font-bold text-[#B83232] dark:text-[#F2C94C] border border-[#B83232]/40 dark:border-[#F2C94C]/40 hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav(getRoleDashboardPage())}
              className="px-4 py-2 text-xs font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              {getRolePortalLabel()}
            </button>
          )}

          {/* Mobile / Tablet menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="flex xl:hidden h-9 w-9 items-center justify-center rounded-lg text-[#292929] hover:bg-[#F7F5F2] dark:text-[#F7F5F2] dark:hover:bg-[#1E1E1E]"
            aria-label="Open mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-[#E5DFD9] bg-white px-4 py-4 dark:border-[#3D3835] dark:bg-[#292929]">
          <div className="flex flex-col gap-1.5">
            {navLinks.map(link => {
              const isActive = isLinkActive(link.id);
              return (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C] font-bold'
                      : 'text-[#292929] hover:bg-[#F7F5F2] dark:text-[#F7F5F2] dark:hover:bg-[#1E1E1E]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            <div className="sm:hidden pt-2">
              <PWAInstallButton />
            </div>

            {currentUser && (
              <button
                onClick={() => {
                  logoutUser();
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-sm text-[#B83232] hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg font-semibold"
              >
                Sign Out ({currentUser.name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

