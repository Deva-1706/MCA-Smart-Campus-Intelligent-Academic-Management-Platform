import React from 'react';
import { PortalProvider, usePortal } from './context/PortalContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { FacultyLayout } from './components/layout/FacultyLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Public Pages
import { HomePage } from './components/public/HomePage';
import { AboutPage } from './components/public/AboutPage';
import { SubjectsPage } from './components/public/SubjectsPage';
import { FeaturesPage } from './components/public/FeaturesPage';
import { HowItWorksPage } from './components/public/HowItWorksPage';
import { FAQPage } from './components/public/FAQPage';
import { LoginPage } from './components/public/LoginPage';
import { PasswordResetPage } from './components/public/PasswordResetPage';
import { ChangePasswordPage } from './components/public/ChangePasswordPage';

// Student Portal Pages
import { DashboardView } from './components/portal/DashboardView';
import { MySubjectsView } from './components/portal/MySubjectsView';
import { AssignmentsView } from './components/portal/AssignmentsView';
import { ExaminationsView } from './components/portal/ExaminationsView';
import { PythonLabView } from './components/portal/PythonLabView';
import { PDFLearningView } from './components/portal/PDFLearningView';
import { PDFChatAssistantView } from './components/portal/PDFChatAssistantView';
import { BookmarksView } from './components/portal/BookmarksView';
import { AnalyticsView } from './components/portal/AnalyticsView';
import { AcademicReportsView } from './components/portal/AcademicReportsView';
import { NotificationsView } from './components/portal/NotificationsView';
import { ProfileView } from './components/portal/ProfileView';
import { AchievementsView } from './components/portal/AchievementsView';
import { PracticeArenaView } from './components/portal/PracticeArenaView';
import { FlashcardsView } from './components/portal/FlashcardsView';
import { AcademicCalendarView } from './components/portal/AcademicCalendarView';

// MCA Smart Campus 6 Unique Modules
import { AcademicIntelligenceView } from './components/smart-campus/AcademicIntelligenceView';
import { SkillDNAView } from './components/smart-campus/SkillDNAView';
import { ProjectStudioView } from './components/smart-campus/ProjectStudioView';
import { CareerReadinessView } from './components/smart-campus/CareerReadinessView';
import { SmartStudyPlannerView } from './components/smart-campus/SmartStudyPlannerView';
import { KnowledgeGraphView } from './components/smart-campus/KnowledgeGraphView';

// Role Workspaces
import { AdminPortalViews } from './components/admin/AdminPortalViews';
import { FacultyPortalViews } from './components/faculty/FacultyPortalViews';

const STUDENT_PAGES = new Set([
  'dashboard',
  'my-courses',
  'my-semesters',
  'my-subjects',
  'assignments',
  'examinations',
  'coding-lab',
  'materials',
  'ai-notes',
  'ai-assistant',
  'question-bank',
  'bookmarks',
  'analytics',
  'reports',
  'notifications',
  'profile',
  'achievements',
  'practice-arena',
  'flashcards',
  'calendar',
  'intelligence',
  'skill-dna',
  'project-studio',
  'career-lab',
  'study-planner',
  'knowledge-graph',
  'challenge-arena',
  'academic-passport',
]);

const FACULTY_PAGES = new Set([
  'faculty-overview',
  'faculty-profile',
  'faculty-subjects',
  'faculty-units',
  'faculty-students',
  'faculty-materials',
  'faculty-ai-notes',
  'faculty-question-bank',
  'faculty-assignments',
  'faculty-exams',
  'faculty-evaluation',
  'faculty-gradebook',
  'faculty-practice',
  'faculty-projects',
  'faculty-challenges',
  'faculty-skills',
  'faculty-knowledge-graph',
  'faculty-analytics',
  'faculty-calendar',
  'faculty-notices',
]);

const ADMIN_PAGES = new Set([
  'admin-overview',
  'admin-users',
  'admin-academics',
  'admin-allocations',
  'admin-assessments',
  'admin-results',
  'admin-materials',
  'admin-notices',
  'admin-certificates',
  'admin-analytics',
  'admin-features',
  'admin-settings',
  'admin-audit-logs',
]);

const MainAppContent: React.FC = () => {
  const { currentPage, setCurrentPage, currentUser } = usePortal();

  const isStudentPage = STUDENT_PAGES.has(currentPage);
  const isFacultyPage = FACULTY_PAGES.has(currentPage);
  const isAdminPage = ADMIN_PAGES.has(currentPage);
  const isLoginRoute =
    currentPage === 'login' ||
    currentPage === 'student-login' ||
    currentPage === 'faculty-login' ||
    currentPage === 'admin-login';

  const renderStudentWorkspace = () => (
    <StudentLayout>
      {currentPage === 'dashboard' && <DashboardView />}
      {(currentPage === 'my-subjects' || currentPage === 'my-courses' || currentPage === 'my-semesters') && (
        <MySubjectsView />
      )}
      {currentPage === 'assignments' && <AssignmentsView />}
      {currentPage === 'examinations' && <ExaminationsView />}
      {currentPage === 'coding-lab' && <PythonLabView />}
      {(currentPage === 'materials' ||
        currentPage === 'ai-notes' ||
        currentPage === 'question-bank') && <PDFLearningView />}
      {currentPage === 'ai-assistant' && <PDFChatAssistantView />}
      {currentPage === 'bookmarks' && <BookmarksView />}
      {currentPage === 'analytics' && <AnalyticsView />}
      {currentPage === 'reports' && <AcademicReportsView />}
      {currentPage === 'notifications' && <NotificationsView />}
      {currentPage === 'profile' && <ProfileView />}
      {currentPage === 'achievements' && <AchievementsView />}
      {currentPage === 'practice-arena' && <PracticeArenaView />}
      {currentPage === 'flashcards' && <FlashcardsView />}
      {currentPage === 'calendar' && <AcademicCalendarView />}
      {currentPage === 'intelligence' && <AcademicIntelligenceView mode="student" />}
      {currentPage === 'skill-dna' && <SkillDNAView mode="student" />}
      {currentPage === 'project-studio' && <ProjectStudioView mode="student" />}
      {currentPage === 'career-lab' && <CareerReadinessView />}
      {currentPage === 'study-planner' && <SmartStudyPlannerView mode="student" />}
      {currentPage === 'knowledge-graph' && <KnowledgeGraphView mode="student" />}
      {(currentPage === 'challenge-arena' || currentPage === 'academic-passport') && <DashboardView />}
    </StudentLayout>
  );

  // Guard authenticated sessions from accessing role login routes or another role's workspace
  React.useEffect(() => {
    if (!currentUser || currentUser.mustChangePassword) return;
    const roleHome =
      currentUser.role === 'admin'
        ? 'admin-overview'
        : currentUser.role === 'faculty'
        ? 'faculty-overview'
        : 'dashboard';
    const isCrossRoleWorkspace =
      (isAdminPage && currentUser.role !== 'admin') ||
      (isFacultyPage && currentUser.role !== 'faculty') ||
      (isStudentPage && currentUser.role !== 'student');

    if (isLoginRoute || isCrossRoleWorkspace) {
      setCurrentPage(roleHome);
    }
  }, [currentUser, isLoginRoute, isAdminPage, isFacultyPage, isStudentPage, setCurrentPage]);

  // 0. Authenticated Change-Password / Mandatory First-Login Setup Shell (Dedicated Auth Layout)
  if (currentUser && (currentPage === 'change-password' || currentUser.mustChangePassword)) {
    return (
      <AuthLayout>
        <ChangePasswordPage />
      </AuthLayout>
    );
  }

  // 1. Authenticated Role Workspaces & Login Route Protection
  if (currentUser) {
    if (isAdminPage && currentUser.role === 'admin') {
      return (
        <AdminLayout>
          <AdminPortalViews />
        </AdminLayout>
      );
    }

    if (isFacultyPage && currentUser.role === 'faculty') {
      return (
        <FacultyLayout>
          <FacultyPortalViews />
        </FacultyLayout>
      );
    }

    if (isStudentPage && currentUser.role === 'student') {
      return renderStudentWorkspace();
    }

    // Prevent authenticated users from entering /admin-login/, /faculty-login/, /student-login/, or cross-role routes
    if (isLoginRoute || isAdminPage || isFacultyPage || isStudentPage) {
      if (currentUser.role === 'admin') {
        return (
          <AdminLayout>
            <AdminPortalViews />
          </AdminLayout>
        );
      }
      if (currentUser.role === 'faculty') {
        return (
          <FacultyLayout>
            <FacultyPortalViews />
          </FacultyLayout>
        );
      }
      return (
        <StudentLayout>
          <DashboardView />
        </StudentLayout>
      );
    }
  }

  // 2. Unauthenticated Role-Specific Login & Password Reset (Dedicated Auth Layout, No Public Navbar)
  const unauthenticatedLoginRole = isAdminPage
    ? 'admin'
    : isFacultyPage
    ? 'faculty'
    : isStudentPage
    ? 'student'
    : undefined;

  const isAuthPage =
    isLoginRoute || currentPage === 'forgot-password' || currentPage === 'reset-password';

  if (unauthenticatedLoginRole || isAuthPage) {
    return (
      <AuthLayout>
        {unauthenticatedLoginRole ? (
          <LoginPage portalRole={unauthenticatedLoginRole} />
        ) : currentPage === 'forgot-password' || currentPage === 'reset-password' ? (
          <PasswordResetPage />
        ) : (
          <LoginPage
            portalRole={
              currentPage === 'admin-login'
                ? 'admin'
                : currentPage === 'faculty-login'
                ? 'faculty'
                : currentPage === 'student-login'
                ? 'student'
                : undefined
            }
          />
        )}
      </AuthLayout>
    );
  }

  // 3. Public Website Shell (Public Navbar + Sections + Public Footer)
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] transition-colors">
      <Navbar />

      <main className="flex-1">
        <div>
          {(currentPage === 'home' || currentPage === 'contact') && <HomePage />}
          {currentPage === 'about' && <AboutPage />}
          {currentPage === 'subjects' && <SubjectsPage />}
          {currentPage === 'features' && <FeaturesPage />}
          {currentPage === 'how-it-works' && <HowItWorksPage />}
          {currentPage === 'faq' && <FAQPage />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <PortalProvider>
      <MainAppContent />
      <OfflineIndicator />
    </PortalProvider>
  );
}
