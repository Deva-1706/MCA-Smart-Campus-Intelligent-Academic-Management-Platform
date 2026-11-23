import React from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  FileSpreadsheet,
  ArrowRight,
  Target,
  Users
} from 'lucide-react';

interface AcademicIntelligenceViewProps {
  mode?: 'student' | 'faculty' | 'admin';
}

export const AcademicIntelligenceView: React.FC<AcademicIntelligenceViewProps> = ({
  mode = 'student',
}) => {
  const {
    currentUser,
    allSubjects,
    assignments,
    completedExamResults,
    weeklyStudySecondsBySubject,
    weeklyGoalHoursBySubject,
    challengeAttempts,
    skillEvidence,
    projects,
    userAccounts,
    setCurrentPage,
  } = usePortal();

  const subjectAnalytics = allSubjects.map(sub => {
    const subExams = completedExamResults.filter(e => e.subjectCode === sub.code);
    const examAvg =
      subExams.length > 0
        ? Math.round(subExams.reduce((s, e) => s + e.percentage, 0) / subExams.length)
        : null;

    const subAssignments = assignments.filter(a => a.subjectCode === sub.code);
    const evaluatedAssigns = subAssignments.filter(
      a => a.status === 'Evaluated' && a.studentSubmission?.marksObtained !== undefined
    );
    const assignAvg =
      evaluatedAssigns.length > 0
        ? Math.round(
            evaluatedAssigns.reduce(
              (s, a) => s + ((a.studentSubmission!.marksObtained || 0) / a.totalMarks) * 100,
              0
            ) / evaluatedAssigns.length
          )
        : null;

    const pendingCount = subAssignments.filter(
      a => a.status === 'Not Started' || a.status === 'In Progress'
    ).length;

    const loggedHours = (weeklyStudySecondsBySubject[sub.code] || 0) / 3600;
    const goalHours = Math.max(1, weeklyGoalHoursBySubject[sub.code] ?? 6);
    const studyRatio = Math.min(100, Math.round((loggedHours / goalHours) * 100));

    const compositeSignal = Math.round(
      ((examAvg ?? sub.progressPercentage) * 0.45 +
        (assignAvg ?? sub.progressPercentage) * 0.35 +
        sub.progressPercentage * 0.2)
    );

    const status: 'Strong' | 'On Track' | 'Needs Focus' =
      compositeSignal >= 82 ? 'Strong' : compositeSignal >= 65 ? 'On Track' : 'Needs Focus';

    return {
      code: sub.code,
      name: sub.name,
      credits: sub.credits,
      progressPercentage: sub.progressPercentage,
      examAvg,
      assignAvg,
      pendingCount,
      loggedHours,
      goalHours,
      studyRatio,
      compositeSignal,
      status,
    };
  });

  const strongSubjects = subjectAnalytics.filter(s => s.status === 'Strong');
  const focusSubjects = subjectAnalytics.filter(s => s.status !== 'Strong');
  const pendingAssignmentsTotal = assignments.filter(
    a => a.status === 'Not Started' || a.status === 'In Progress'
  ).length;

  const verifiedSkillCount = skillEvidence.filter(e => e.status === 'Verified').length;
  const passedChallenges = challengeAttempts.filter(c => c.passed).length;

  const studentCount = userAccounts.filter(u => u.role === 'student').length;
  const pendingProjectReviews = projects.filter(p => p.status === 'Under Review').length;
  const pendingSkillReviews = skillEvidence.filter(s => s.status === 'Pending Review').length;

  const recommendedActions = [
    pendingAssignmentsTotal > 0
      ? {
          title: `Complete ${pendingAssignmentsTotal} pending subject assignment${pendingAssignmentsTotal > 1 ? 's' : ''}`,
          detail: 'Submitting pending coursework updates evaluation readiness across your internal assessment weights.',
          page: mode === 'student' ? 'assignments' : mode === 'faculty' ? 'faculty-assignments' : 'admin-assessments',
          cta: 'Open Assignments',
        }
      : null,
    focusSubjects.length > 0
      ? {
          title: `Reinforce ${focusSubjects[0].code} (${focusSubjects[0].name})`,
          detail: `Current study pace is ${focusSubjects[0].loggedHours.toFixed(1)}h / ${focusSubjects[0].goalHours}h weekly target.`,
          page: mode === 'student' ? 'study-planner' : mode === 'faculty' ? 'faculty-ai-notes' : 'admin-academics',
          cta: 'Plan Revision Block',
        }
      : null,
    mode === 'student'
      ? {
          title: 'Submit verified practical evidence to Skill DNA',
          detail: `${verifiedSkillCount} skill records currently verified. Run Python Coding Lab exercises or Project milestones to add evidence.`,
          page: 'skill-dna',
          cta: 'Open Skill DNA',
        }
      : {
          title: `Review ${pendingSkillReviews} pending skill & ${pendingProjectReviews} project submission(s)`,
          detail: 'Faculty and Admin verification keeps institutional skill analytics strictly evidence-based.',
          page: mode === 'faculty' ? 'faculty-skills' : 'admin-analytics',
          cta: 'Review Pending Queue',
        },
  ].filter(Boolean) as { title: string; detail: string; page: string; cta: string }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <Brain className="w-4 h-4" /> Academic Intelligence Centre
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            {mode === 'admin'
              ? 'Institutional Academic Intelligence'
              : mode === 'faculty'
              ? 'Cohort & Subject Performance Diagnostics'
              : 'Personal Academic Intelligence'}
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            Live diagnostics computed strictly from verified exam scores, evaluated assignments, study logs, and challenge outcomes.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-[#BDB7B2] mb-1">
            <span>{mode === 'student' ? 'Strong Subjects' : 'Enrolled Scholars'}</span>
            {mode === 'student' ? <TrendingUp className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" /> : <Users className="w-4 h-4 text-[#B83232]" />}
          </div>
          <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-[#F7F5F2]">
            {mode === 'student' ? `${strongSubjects.length}/${subjectAnalytics.length}` : studentCount}
          </p>
          <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-1">
            {mode === 'student' ? 'Composite score ≥ 82%' : 'Active MCA Batch 2024–2026'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-[#BDB7B2] mb-1">
            <span>Pending Work Items</span>
            <FileSpreadsheet className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono tabular-nums text-[#B83232] dark:text-[#F2C94C]">
            {pendingAssignmentsTotal}
          </p>
          <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-1">
            Open assignments awaiting completion
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-[#BDB7B2] mb-1">
            <span>Verified Skill Proofs</span>
            <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-[#F7F5F2]">
            {verifiedSkillCount}
          </p>
          <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-1">
            {passedChallenges} Arena challenges passed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-[#BDB7B2] mb-1">
            <span>{mode === 'student' ? 'Current SGPA' : 'Verification Queue'}</span>
            <Target className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-[#F7F5F2]">
            {mode === 'student' ? (currentUser?.currentSGPA || 8.85).toFixed(2) : pendingProjectReviews + pendingSkillReviews}
          </p>
          <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-1">
            {mode === 'student' ? `Target SGPA ${(currentUser?.targetSGPA || 9.2).toFixed(2)}` : 'Projects & Skills awaiting review'}
          </p>
        </div>
      </div>

      {/* Subject Diagnostic Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9] dark:border-[#3D3835]">
            <div>
              <h2 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2]">
                Subject Strength & Readiness Matrix
              </h2>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2]">
                Combines exam averages, assignment evaluations, unit progress, and weekly hours.
              </p>
            </div>
            <BookOpen className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>

          <div className="space-y-4">
            {subjectAnalytics.map(sub => (
              <div
                key={sub.code}
                className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C] mr-2">
                      {sub.code}
                    </span>
                    <span className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
                      {sub.name}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                      sub.status === 'Strong'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : sub.status === 'On Track'
                        ? 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C] dark:border-amber-800'
                        : 'bg-rose-50 text-[#B83232] border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                    }`}
                  >
                    {sub.status} · {sub.compositeSignal}%
                  </span>
                </div>

                <div className="w-full bg-white dark:bg-[#292929] h-2 rounded-full overflow-hidden border border-[#E5DFD9] dark:border-[#3D3835]">
                  <div
                    className={`h-full rounded-full ${
                      sub.status === 'Strong' ? 'bg-emerald-600' : 'bg-[#B83232]'
                    }`}
                    style={{ width: `${sub.compositeSignal}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums text-[#6E6863] dark:text-[#BDB7B2]">
                  <span>Syllabus: {sub.progressPercentage}%</span>
                  <span>Exams: {sub.examAvg !== null ? `${sub.examAvg}%` : 'No attempts'}</span>
                  <span>Assign: {sub.assignAvg !== null ? `${sub.assignAvg}%` : `${sub.pendingCount} pending`}</span>
                  <span>Study: {sub.loggedHours.toFixed(1)}/{sub.goalHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Next Study Actions */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD9] dark:border-[#3D3835]">
            <div>
              <h2 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2]">
                Next Recommended Actions
              </h2>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2]">
                Actionable priorities based on current semester records.
              </p>
            </div>
            <AlertTriangle className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>

          <div className="space-y-3">
            {recommendedActions.map((act, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2"
              >
                <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">{act.title}</p>
                <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                  {act.detail}
                </p>
                <button
                  onClick={() => setCurrentPage(act.page as any)}
                  className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <span>{act.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
