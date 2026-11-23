import React, { useState, useCallback } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  Award,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowUpRight,
  FileDown,
  Loader2
} from 'lucide-react';
import { GPAGradePredictor } from './GPAGradePredictor';
import { exportAnalyticsSummaryPdf, SubjectReportRow } from '../../utils/exportAnalyticsPdf';

export const AnalyticsView: React.FC = () => {
  const {
    currentUser,
    allSubjects,
    completedExamResults,
    assignments,
    weeklyStudySecondsBySubject,
    weeklyGoalHoursBySubject,
    weeklyGoalWeekLabel,
  } = usePortal();
  const [projectedSGPA, setProjectedSGPA] = useState<number | null>(null);
  const [subjectReportRows, setSubjectReportRows] = useState<SubjectReportRow[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleSubjectRowsChange = useCallback((rows: SubjectReportRow[]) => {
    setSubjectReportRows(rows);
  }, []);

  if (!currentUser) return null;

  const subjectProficiencies = allSubjects.map(sub => {
    const fallbackTargets: Record<string, number> = {
      '435C1A': 85,
      '435C1B': 80,
      '435E1A': 88,
      '435C1C': 92
    };
    return {
      code: sub.code,
      name: sub.name,
      mastery: sub.progressPercentage,
      target: fallbackTargets[sub.code] ?? 85
    };
  });

  const avgCurriculumMastery =
    subjectProficiencies.length > 0
      ? (
          subjectProficiencies.reduce((sum, s) => sum + s.mastery, 0) /
          subjectProficiencies.length
        ).toFixed(1)
      : '0.0';

  const weeklySubjectBreakdown = allSubjects.map(sub => {
    const loggedHours = Number(((weeklyStudySecondsBySubject[sub.code] || 0) / 3600).toFixed(2));
    const targetHours = Math.max(0.5, weeklyGoalHoursBySubject[sub.code] ?? 6);
    return {
      day: sub.code,
      name: sub.name,
      hours: loggedHours,
      targetHours,
    };
  });

  const totalWeeklyStudyHours = weeklySubjectBreakdown.reduce((sum, s) => sum + s.hours, 0);
  const totalWeeklyTargetHours = weeklySubjectBreakdown.reduce((sum, s) => sum + s.targetHours, 0);
  const maxStudyHour = Math.max(1, ...weeklySubjectBreakdown.map(d => Math.max(d.hours, d.targetHours)));

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      const fallbackRows: SubjectReportRow[] = allSubjects.map(sub => ({
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        completedUnits: sub.completedModules,
        totalUnits: sub.totalModules,
        assignmentAvg: null,
        examAvg: null,
        internalScore: sub.progressPercentage,
        projectedFinalPercent: sub.progressPercentage,
        grade: sub.progressPercentage >= 90 ? 'O' : sub.progressPercentage >= 80 ? 'A+' : 'A',
        gradePoints: sub.progressPercentage >= 90 ? 10 : sub.progressPercentage >= 80 ? 9 : 8
      }));

      const fileName = exportAnalyticsSummaryPdf({
        student: currentUser,
        projectedSGPA: projectedSGPA ?? currentUser.currentSGPA,
        avgCurriculumMastery,
        subjectRows: subjectReportRows.length > 0 ? subjectReportRows : fallbackRows,
        completedExams: completedExamResults,
        assignments,
        weeklyStudyHours: weeklySubjectBreakdown.map(s => ({ day: s.day, hours: s.hours }))
      });

      setExportNotice(`Generated and downloaded PDF summary: ${fileName}`);
      setTimeout(() => setExportNotice(null), 4500);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Continuous Evaluation Metrics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Detailed telemetry on course proficiency, study cadence, unit completion velocity, and projected SGPA curves.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-60"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 text-[#F2C94C]" />
          )}
          <span>{isExporting ? 'Generating PDF...' : 'Export Report (PDF)'}</span>
        </button>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-[#292929] border border-[#F2C94C]/50 text-[#F2C94C] text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-stone-400 mb-1">
            <span>Cumulative SGPA</span>
            <Award className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#292929] dark:text-white">
            {currentUser.currentSGPA.toFixed(2)}
          </p>
          <div className="mt-2 text-[11px] text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              Projected End-Sem: {(projectedSGPA ?? currentUser.currentSGPA).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-stone-400 mb-1">
            <span>Credits Earned</span>
            <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-white">
            {currentUser.completedCredits}/{currentUser.totalCredits}
          </p>
          <div className="mt-2 text-[11px] text-[#795548] dark:text-stone-400 font-medium">
            Semester {currentUser.semester} Degree Credits
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-stone-400 mb-1">
            <span>Weekly Study Total</span>
            <Clock className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono tabular-nums text-[#292929] dark:text-white">
            {totalWeeklyStudyHours.toFixed(1)} hrs
          </p>
          <div className="mt-2 text-[11px] text-[#795548] dark:text-stone-400 font-medium font-mono tabular-nums">
            Target: {totalWeeklyTargetHours.toFixed(1)} hrs ({weeklyGoalWeekLabel})
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#795548] dark:text-stone-400 mb-1">
            <span>Curriculum Mastery</span>
            <BarChart3 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#292929] dark:text-white">
            {avgCurriculumMastery}%
          </p>
          <div className="mt-2 text-[11px] text-[#B83232] dark:text-[#F2C94C] font-semibold">
            Across 20 Syllabus Units
          </div>
        </div>
      </div>

      {/* Interactive GPA / Grade Predictor */}
      <GPAGradePredictor
        onProjectedSGPAChange={setProjectedSGPA}
        onSubjectRowsChange={handleSubjectRowsChange}
      />

      {/* Subject-Wise Competency & Weekly Cadence Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Subject Mastery Meters */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-base font-bold text-[#292929] dark:text-white">
                Course Competency & Proficiency
              </h2>
              <p className="text-xs text-[#795548] dark:text-stone-400">
                Calculated from unit quizzes, programming challenges, and syllabus milestones.
              </p>
            </div>
            <span className="font-mono text-xs text-[#795548] dark:text-stone-400">Target ≥ 80%</span>
          </div>

          <div className="space-y-5">
            {subjectProficiencies.map(sub => (
              <div key={sub.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#292929] dark:text-stone-200">
                    <span className="font-mono text-[#B83232] dark:text-[#F2C94C] mr-1.5">{sub.code}</span>
                    {sub.name}
                  </span>
                  <span className="font-mono font-bold text-[#292929] dark:text-white">
                    {sub.mastery}%
                  </span>
                </div>
                <div className="w-full bg-[#F7F5F2] dark:bg-stone-800 h-2.5 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
                  <div
                    className="bg-[#B83232] h-full rounded-full transition-all duration-700"
                    style={{ width: `${sub.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Weekly Subject Study Allocation Chart */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-base font-bold text-[#292929] dark:text-white">
                Weekly Study Allocation
              </h2>
              <p className="text-xs text-[#795548] dark:text-stone-400">
                Logged hours vs weekly targets across Semester 1 subjects.
              </p>
            </div>
            <Clock className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
          </div>

          <div className="flex items-end justify-between gap-3 h-44 pt-6">
            {weeklySubjectBreakdown.map(d => {
              const heightPercent = Math.round((d.hours / maxStudyHour) * 100);
              const goalReached = d.hours >= d.targetHours;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tabular-nums text-[#795548] dark:text-stone-400">
                    {d.hours.toFixed(1)}/{d.targetHours}h
                  </span>
                  <div className="w-full max-w-[36px] bg-stone-100 dark:bg-stone-800 h-32 rounded-t-md flex items-end overflow-hidden">
                    <div
                      className={`w-full ${goalReached ? 'bg-[#F2C94C]' : 'bg-[#B83232]'} rounded-t-md transition-all duration-500`}
                      style={{ height: `${Math.max(d.hours > 0 ? 6 : 0, heightPercent)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#292929] dark:text-stone-400">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-[#795548] dark:text-stone-300 font-mono tabular-nums">
            Logged {totalWeeklyStudyHours.toFixed(1)} / {totalWeeklyTargetHours.toFixed(1)} hrs for {weeklyGoalWeekLabel}. Use Dashboard Pomodoro Studio or quick logs to credit study hours.
          </div>
        </div>
      </div>
    </div>
  );
};
