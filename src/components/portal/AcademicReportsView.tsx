import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  BookOpen,
  Trash2
} from 'lucide-react';
import { StudyResourceKey } from '../../types';

const RESOURCE_LABELS: Record<StudyResourceKey, string> = {
  'study-notes': 'Study Notes & PDFs',
  'coding-lab': 'Python Coding Lab',
  'practice-arena': 'Practice Arena',
  flashcards: 'AI Flashcards',
  assignments: 'Assignments & Exams',
  subjects: 'Core Subject Modules',
};

const formatStudyDuration = (totalSeconds: number) => {
  if (totalSeconds <= 0) return '0s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  return `${secs}s`;
};

export const AcademicReportsView: React.FC = () => {
  const {
    currentUser,
    reportedStudySessions,
    deleteReportedStudySession,
    allSubjects,
    assignments,
    completedExamResults,
    verifiedCodingProblemIds
  } = usePortal();
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!currentUser) return null;

  const totalLoggedStudySeconds = reportedStudySessions.reduce((acc, s) => acc + s.totalSeconds, 0);

  const computeGrade = (pct: number) => {
    if (pct >= 90) return { gp: 10, letter: 'O' };
    if (pct >= 80) return { gp: 9, letter: 'A+' };
    if (pct >= 70) return { gp: 8, letter: 'A' };
    if (pct >= 60) return { gp: 7, letter: 'B+' };
    if (pct >= 50) return { gp: 6, letter: 'B' };
    return { gp: 0, letter: 'RA' };
  };

  const coursesReport = allSubjects.map(sub => {
    const evalAssigns = assignments.filter(
      a => a.subjectCode === sub.code && a.status === 'Evaluated' && a.studentSubmission?.marksObtained !== undefined
    );
    const subExams = completedExamResults.filter(e => e.subjectCode === sub.code);
    const hasPracticalComponent = sub.code === '435C1B' || sub.code === '435C1C';

    const internalPct =
      evalAssigns.length > 0
        ? Math.round(
            evalAssigns.reduce((s, a) => s + ((a.studentSubmission?.marksObtained || 0) / Math.max(1, a.totalMarks)) * 40, 0) /
              evalAssigns.length
          )
        : null;

    const examPct =
      subExams.length > 0
        ? Math.round(subExams.reduce((s, e) => s + e.percentage, 0) / subExams.length)
        : null;

    const practicalScore =
      hasPracticalComponent && verifiedCodingProblemIds.length > 0
        ? Math.min(30, verifiedCodingProblemIds.length * 10)
        : null;

    const hasAnyGrade = internalPct !== null || examPct !== null || practicalScore !== null;
    const totalPct = hasAnyGrade
      ? Math.min(
          100,
          Math.round(
            examPct !== null && internalPct !== null
              ? internalPct + examPct * 0.6
              : examPct !== null
              ? examPct
              : internalPct !== null
              ? (internalPct / 40) * 100
              : ((practicalScore || 0) / 30) * 100
          )
        )
      : null;

    const grade = totalPct !== null ? computeGrade(totalPct) : null;

    return {
      code: sub.code,
      name: sub.name,
      status: sub.status || 'Upcoming',
      credits: sub.credits,
      internal: internalPct !== null ? `${internalPct}` : 'Pending',
      practical: hasPracticalComponent ? (practicalScore !== null ? `${practicalScore}` : 'Pending') : '—',
      total: totalPct !== null ? `${totalPct}` : 'Pending',
      gradePoint: grade ? `${grade.gp}` : '—',
      letterGrade: grade ? grade.letter : 'Pending',
      numericGp: grade ? grade.gp : null,
    };
  });

  const gradedCourses = coursesReport.filter(c => c.numericGp !== null);
  const totalCredits = coursesReport.reduce((sum, c) => sum + c.credits, 0);
  const computedSGPA =
    gradedCourses.length > 0
      ? gradedCourses.reduce((sum, c) => sum + (c.numericGp || 0) * c.credits, 0) /
        Math.max(1, gradedCourses.reduce((sum, c) => sum + c.credits, 0))
      : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Course Code', 'Course Name', 'Status', 'Credits', 'Internal Assessment (40)', 'Practical (30)', 'Total Marks', 'Grade Point', 'Letter Grade'];
    const rows = coursesReport.map(c => [
      c.code,
      `"${c.name}"`,
      c.status,
      c.credits,
      c.internal,
      c.practical,
      c.total,
      c.gradePoint,
      c.letterGrade
    ]);

    const baseLines = [headers.join(','), ...rows.map(r => r.join(','))];
    if (reportedStudySessions.length > 0) {
      baseLines.push('');
      baseLines.push('Logged Study Sessions');
      baseLines.push('Date,Time,Subjects Covered,Resources Studied,Duration,Notes');
      reportedStudySessions.forEach(s => {
        const subjectsStr = s.subjectsCovered.map(c => (c === 'ALL' ? 'All Semester 1 Subjects' : c)).join('; ');
        const resourcesStr = s.resourcesCovered.map(r => RESOURCE_LABELS[r] || r).join('; ');
        const notesStr = (s.notes || '').replace(/"/g, '""');
        baseLines.push(
          [
            s.completedDate,
            s.completedAt,
            `"${subjectsStr}"`,
            `"${resourcesStr}"`,
            `"${formatStudyDuration(s.totalSeconds)}"`,
            `"${notesStr}"`,
          ].join(',')
        );
      });
    }

    const csvContent = baseLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentUser.studentId}_Semester_1_Grade_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Exported Semester 1 Grade Sheet & Study Sessions in CSV format.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Institutional Transcripts & Documentation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Academic Grade Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Consolidated Semester 1 grade sheets, credit hour tallies, and downloadable institutional progress reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[#292929] dark:text-stone-200 transition-colors flex items-center gap-1.5 border border-stone-200 dark:border-stone-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Grade Card</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-stone-900 border border-[#F2C94C] text-[#292929] dark:text-[#F2C94C] text-xs font-semibold">
          {exportNotice}
        </div>
      )}

      {/* Official Grade Card Container (Printable) */}
      <div className="p-6 sm:p-10 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-sm space-y-8 print:border-none print:shadow-none">
        {/* University Header on Grade Card */}
        <div className="text-center pb-6 border-b border-stone-200 dark:border-stone-800 space-y-2">
          <div className="inline-block px-3 py-1 rounded-md bg-[#292929] text-[#F2C94C] font-bold text-xs tracking-wider">
            DEPARTMENT OF COMPUTER APPLICATIONS
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#292929] dark:text-white uppercase tracking-tight">
            Semester 1 Consolidated Performance Card
          </h2>
          <p className="text-xs text-[#795548] dark:text-stone-400 font-mono">
            Master of Computer Applications (MCA) · Academic Session 2024–2026
          </p>
        </div>

        {/* Student Metadata Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
          <div>
            <span className="text-[#795548] dark:text-stone-400 block text-[10px] uppercase font-semibold">Student Name</span>
            <span className="font-bold text-[#292929] dark:text-white">{currentUser.name}</span>
          </div>
          <div>
            <span className="text-[#795548] dark:text-stone-400 block text-[10px] uppercase font-semibold">Student ID / Roll No</span>
            <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">{currentUser.studentId}</span>
          </div>
          <div>
            <span className="text-[#795548] dark:text-stone-400 block text-[10px] uppercase font-semibold">Current Semester</span>
            <span className="font-bold text-[#292929] dark:text-white">Semester 1</span>
          </div>
          <div>
            <span className="text-[#795548] dark:text-stone-400 block text-[10px] uppercase font-semibold">Current SGPA</span>
            <span className="font-mono font-extrabold text-[#292929] dark:text-white">
              {computedSGPA !== null ? `${computedSGPA.toFixed(2)} / 10.0` : 'Pending Assessments'}
            </span>
          </div>
        </div>

        {/* Tabular Course Breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <thead className="bg-[#292929] text-white font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-3">Course Code</th>
                <th className="py-3 px-3">Course Title</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Credits</th>
                <th className="py-3 px-3 text-center">Internal (40)</th>
                <th className="py-3 px-3 text-center">Practical (30)</th>
                <th className="py-3 px-3 text-center">Total (100)</th>
                <th className="py-3 px-3 text-center">Grade Point</th>
                <th className="py-3 px-3 text-center">Letter Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-[#292929] dark:text-stone-200">
              {coursesReport.map(c => (
                <tr key={c.code} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                    {c.code}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#292929] dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-[#795548] dark:text-[#F2C94C]">
                    {c.status}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{c.credits}</td>
                  <td className="py-3 px-3 text-center font-mono">{c.internal}</td>
                  <td className="py-3 px-3 text-center font-mono">{c.practical}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-[#292929] dark:text-white">
                    {c.total}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">{c.gradePoint}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#B83232] dark:text-[#F2C94C]">
                    {c.letterGrade}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#F7F5F2] dark:bg-stone-800/90 font-semibold text-[#292929] dark:text-white border-t border-stone-200 dark:border-stone-800">
              <tr>
                <td colSpan={3} className="py-3 px-3 font-bold">
                  Semester 1 Totals & Performance Index
                </td>
                <td className="py-3 px-3 text-center font-mono font-bold text-[#B83232]">{totalCredits} Credits</td>
                <td colSpan={3} className="py-3 px-3 text-center text-[#795548] dark:text-stone-400">
                  Evaluated Courses: {gradedCourses.length} of {coursesReport.length}
                </td>
                <td colSpan={2} className="py-3 px-3 text-center font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                  SGPA: {computedSGPA !== null ? computedSGPA.toFixed(2) : 'Pending'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Logged Pomodoro Study Sessions (Printable Ledger) */}
        <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#292929] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
                <span>Logged Pomodoro Study Sessions</span>
              </h3>
              <p className="text-xs text-[#795548] dark:text-stone-400">
                Verified focused study sessions logged from the Pomodoro Study Studio.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="px-2.5 py-1 rounded bg-[#F7F5F2] dark:bg-stone-800 text-[#292929] dark:text-[#F2C94C] border border-stone-200 dark:border-stone-700">
                {reportedStudySessions.length} Session{reportedStudySessions.length === 1 ? '' : 's'}
              </span>
              <span className="px-2.5 py-1 rounded bg-[#B83232] text-white">
                Total: {formatStudyDuration(totalLoggedStudySeconds)}
              </span>
            </div>
          </div>

          {reportedStudySessions.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-[#795548] dark:text-stone-400">
              No Pomodoro study sessions logged to Academic Reports yet. Complete a focus session in the Dashboard Pomodoro Study Studio and choose &ldquo;Log to Academic Reports&rdquo; from the Study Session Summary modal.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                <thead className="bg-[#292929] text-white font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Subjects Covered</th>
                    <th className="py-2.5 px-3">Resources Studied</th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-[#292929] dark:text-stone-200">
                  {reportedStudySessions.map(session => {
                    const subjLabels = session.subjectsCovered.map(code => {
                      if (code === 'ALL') return 'All Semester 1 Subjects';
                      const found = allSubjects.find(s => s.code === code);
                      return found ? `${code} · ${found.name}` : code;
                    });

                    return (
                      <tr key={session.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <span className="font-bold block text-[#292929] dark:text-white">{session.completedDate}</span>
                          <span className="text-[11px] text-[#795548] dark:text-stone-400">{session.completedAt}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {subjLabels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFEBE9] dark:bg-stone-800 text-[#B83232] dark:text-[#F2C94C] font-semibold text-[11px]"
                              >
                                <BookOpen className="w-3 h-3 shrink-0" />
                                <span>{lbl}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {session.resourcesCovered.map(res => (
                              <span
                                key={res}
                                className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[#292929] dark:text-stone-300 text-[11px] font-medium"
                              >
                                {RESOURCE_LABELS[res] || res}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#B83232] dark:text-[#F2C94C] whitespace-nowrap">
                          {formatStudyDuration(session.totalSeconds)}
                        </td>
                        <td className="py-2.5 px-3 text-[#795548] dark:text-stone-400 max-w-xs">
                          {session.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => deleteReportedStudySession(session.id)}
                            className="p-1 rounded text-stone-400 hover:text-[#B83232] transition-colors"
                            aria-label="Remove logged study session"
                            title="Remove logged study session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signatures & Certification Footer */}
        <div className="pt-8 border-t border-stone-200 dark:border-stone-800 grid grid-cols-2 md:grid-cols-3 gap-6 text-xs text-[#795548] dark:text-stone-400">
          <div>
            <p className="font-semibold text-[#292929] dark:text-stone-200">Generated On</p>
            <p className="font-mono">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold text-[#292929] dark:text-stone-200">Faculty Advisor</p>
            <p className="font-bold text-[#B83232] dark:text-[#F2C94C]">HCASICAN</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#292929] dark:text-stone-200">Status</p>
            <span className="inline-flex items-center gap-1 text-[#B83232] dark:text-[#F2C94C] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" /> Authenticated Record
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
