import React, { useState, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import { StudentPortalHeader } from './StudentPortalHeader';
import { StudentSidebar } from './StudentSidebar';
import { AcademicGeminiChatbot } from '../portal/AcademicGeminiChatbot';
import { StudySessionSummaryModal } from '../portal/StudySessionSummaryModal';

interface StudentLayoutProps {
  children: React.ReactNode;
}

/**
 * Dedicated authenticated Student Portal layout shell.
 * Strictly excludes the public website Navbar and Footer, and encapsulates
 * StudentPortalHeader, StudentSidebar, mobile drawer state, and the portal Gemini chatbot.
 */
export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const { currentUser } = usePortal();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] transition-colors">
      <StudentPortalHeader
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
      />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <StudentSidebar
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />

            <div className="flex-1 min-w-0 w-full">
              {children}
            </div>
          </div>
        </div>
      </main>

      <AcademicGeminiChatbot />
      <StudySessionSummaryModal />
    </div>
  );
};
