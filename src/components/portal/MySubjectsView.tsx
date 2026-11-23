import React, { useState, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  BookOpen,
  FileCheck2,
  FolderArchive,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  Award,
  Sparkles
} from 'lucide-react';

export const MySubjectsView: React.FC = () => {
  const {
    allSubjects,
    selectedSubject,
    setCurrentPage,
    setSelectedSubject,
    isUnitCompleted,
    toggleUnitCompletion,
    getSubjectProgress,
    subjectPdfs,
    isPdfCompleted,
    assignments,
    allExaminations,
    completedExamResults
  } = usePortal();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    selectedSubject?.id || allSubjects[0].id
  );

  useEffect(() => {
    if (selectedSubject) {
      setSelectedSubjectId(selectedSubject.id);
    }
  }, [selectedSubject]);

  const activeSubject = allSubjects.find(s => s.id === selectedSubjectId) || allSubjects[0];
  const activeProgress = getSubjectProgress(activeSubject.code);

  // Semester-wide aggregate metrics
  const overallProgress = Math.round(
    allSubjects.reduce((acc, s) => acc + s.progressPercentage, 0) / allSubjects.length
  );
  const totalUnitsCompleted = allSubjects.reduce((acc, s) => acc + s.completedModules, 0);
  const totalUnitsAll = allSubjects.reduce((acc, s) => acc + s.totalModules, 0);
  const totalAssessmentsCompleted = allSubjects.reduce(
    (acc, s) => acc + getSubjectProgress(s.code).completedAssessments,
    0
  );
  const totalAssessmentsAll = allSubjects.reduce(
    (acc, s) => acc + getSubjectProgress(s.code).totalAssessments,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Overall Semester Progress Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Enrolled Courses · Semester 1
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            My Academic Subjects
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Dynamic course progress updated automatically from completed units, PDFs, assignments, and exams.
          </p>
        </div>

        {/* Semester Aggregate Progress Pill */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs flex items-center gap-4 min-w-[280px]">
          <div className="w-11 h-11 rounded-xl bg-[#B83232] text-[#F2C94C] flex items-center justify-center font-mono font-extrabold text-sm shrink-0">
            {overallProgress}%
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold text-[#292929] dark:text-[#F7F5F2] mb-1">
              <span>Semester 1 Mastery</span>
              <span className="font-mono text-[11px] text-[#795548] dark:text-[#F2C94C]">
                {totalUnitsCompleted}/{totalUnitsAll} Units
              </span>
            </div>
            <div className="w-full bg-[#E5DFD9] dark:bg-[#1E1E1E] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#B83232] to-[#F2C94C] h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2] mt-1">
              {totalAssessmentsCompleted}/{totalAssessmentsAll} Assessments & Assignments completed
            </p>
          </div>
        </div>
      </div>

      {/* Course Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allSubjects.map(subject => {
          const isSelected = subject.id === selectedSubjectId;
          const subjProgress = getSubjectProgress(subject.code);
          const isFullyCompleted = subjProgress.percentage >= 100;

          return (
            <button
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-white dark:bg-[#292929] border-[#B83232] shadow-md ring-2 ring-[#B83232]/20'
                  : 'bg-white/85 dark:bg-[#292929]/70 border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                    isSelected
                      ? 'bg-[#B83232] text-white'
                      : 'bg-[#292929] text-white'
                  }`}
                >
                  {subject.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835]">
                    {subject.status || 'Upcoming'}
                  </span>
                  {isFullyCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="text-xs font-mono font-extrabold text-[#B83232] dark:text-[#F2C94C]">
                    {subjProgress.percentage}%
                  </span>
                </div>
              </div>

              <h2 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2] truncate mb-1">
                {subject.name}
              </h2>

              <div className="w-full bg-[#E5DFD9] dark:bg-[#1E1E1E] h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFullyCompleted
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-[#B83232] to-[#F2C94C]'
                  }`}
                  style={{ width: `${subjProgress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#6E6863] dark:text-[#BDB7B2] mt-2 font-medium">
                <span>
                  {subjProgress.completedUnits}/{subjProgress.totalUnits} Units
                </span>
                <span>
                  {subjProgress.completedAssessments}/{subjProgress.totalAssessments} Assessed
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Subject In-Depth Workspace */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5DFD9] dark:border-[#3D3835]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                {activeSubject.code}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-[#795548] dark:text-[#F2C94C] border border-amber-200 dark:border-amber-800/60">
                {activeSubject.status || 'Upcoming'}
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">
                {activeSubject.credits} Credits ({activeSubject.type}) · Faculty: {activeSubject.instructor}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#292929] dark:text-[#F7F5F2]">
              {activeSubject.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1 max-w-2xl leading-relaxed">
              {activeSubject.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedSubject(activeSubject);
                setCurrentPage('materials');
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#292929] bg-[#F7F5F2] hover:bg-[#EFEBE9] dark:bg-[#1E1E1E] dark:text-[#F7F5F2] rounded-xl transition-colors flex items-center gap-1.5 border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <FolderArchive className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
              <span>Notes & PDF Study Packs</span>
            </button>

            <button
              onClick={() => setCurrentPage('examinations')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>Practice Tests</span>
            </button>
          </div>
        </div>

        {/* 3-Pillar Subject Progress Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Lessons & Units */}
          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#B83232]" />
                Syllabus Lessons
              </span>
              <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                {activeProgress.completedUnits} / {activeProgress.totalUnits} Units
              </span>
            </div>
            <div className="w-full bg-[#E5DFD9] dark:bg-[#292929] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#B83232] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (activeProgress.completedUnits / (activeProgress.totalUnits || 1)) * 100
                  )}%`
                }}
              />
            </div>
            <p className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2]">
              50% weight · Toggle units below to update
            </p>
          </div>

          {/* Pillar 2: Learning Materials & PDFs */}
          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-1.5">
                <FolderArchive className="w-3.5 h-3.5 text-[#795548] dark:text-[#F2C94C]" />
                Materials & Study Packs
              </span>
              <span className="font-mono font-bold text-[#795548] dark:text-[#F2C94C]">
                {activeProgress.completedMaterials} / {activeProgress.totalMaterials} Done
              </span>
            </div>
            <div className="w-full bg-[#E5DFD9] dark:bg-[#292929] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#795548] dark:bg-[#F2C94C] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    activeProgress.totalMaterials > 0
                      ? Math.round(
                          (activeProgress.completedMaterials / activeProgress.totalMaterials) * 100
                        )
                      : 0
                  }%`
                }}
              />
            </div>
            <p className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2]">
              25% weight · Synced with Learning Materials
            </p>
          </div>

          {/* Pillar 3: Assessments & Assignments */}
          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#B83232]" />
                Exams & Assignments
              </span>
              <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                {activeProgress.completedAssessments} / {activeProgress.totalAssessments} Done
              </span>
            </div>
            <div className="w-full bg-[#E5DFD9] dark:bg-[#292929] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    activeProgress.totalAssessments > 0
                      ? Math.round(
                          (activeProgress.completedAssessments / activeProgress.totalAssessments) * 100
                        )
                      : 0
                  }%`
                }}
              />
            </div>
            <p className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2]">
              25% weight · Updates when exams/assignments submit
            </p>
          </div>
        </div>

        {/* 5 Units Interactive Checklist */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
              Syllabus Units & Topics Completion
            </h3>
            <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
              Click any unit checkmark to mark lesson progress
            </span>
          </div>

          <div className="space-y-3">
            {activeSubject.units.map(unit => {
              const unitDone = isUnitCompleted(activeSubject.code, unit.unitNumber);

              // Find linked Published PDFs and Assignments for this subject/unit
              const unitPdfs = subjectPdfs.filter(
                p => p.subjectCode === activeSubject.code && p.unit === unit.unitNumber && p.status !== 'Draft'
              );
              const unitPdfsDone = unitPdfs.filter(p => isPdfCompleted(p.id)).length;

              const unitAssignments = assignments.filter(
                a => a.subjectCode === activeSubject.code && a.unit === unit.unitNumber
              );
              const unitAssignmentsDone = unitAssignments.filter(
                a => a.status === 'Submitted' || a.status === 'Evaluated'
              ).length;

              // Calculate unit-level visual progress bar
              let unitPercent = unitDone ? 100 : 15;
              if (!unitDone && (unitPdfsDone > 0 || unitAssignmentsDone > 0)) {
                unitPercent = 55;
              }

              return (
                <div
                  key={unit.unitNumber}
                  className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                    unitDone
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10'
                      : 'border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Interactive Completion Checkmark Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleUnitCompletion(activeSubject.code, unit.unitNumber)}
                        className={`mt-0.5 p-1 rounded-lg transition-all shrink-0 ${
                          unitDone
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                            : 'text-[#795548] dark:text-[#BDB7B2] hover:text-[#B83232] hover:bg-white dark:hover:bg-[#292929]'
                        }`}
                        title={unitDone ? 'Mark Unit as In Progress' : 'Mark Unit as Completed'}
                      >
                        {unitDone ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                            UNIT {unit.unitNumber}
                          </span>
                          {unitDone ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-[#795548] dark:text-[#F2C94C] font-bold">
                              <Sparkles className="w-3 h-3" /> In Progress
                            </span>
                          )}

                          {unitPdfs.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#6E6863] dark:text-[#BDB7B2] font-mono">
                              PDFs: {unitPdfsDone}/{unitPdfs.length}
                            </span>
                          )}

                          {unitAssignments.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#6E6863] dark:text-[#BDB7B2] font-mono">
                              Assignments: {unitAssignmentsDone}/{unitAssignments.length}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
                          {unit.title}
                        </h4>
                        <p className="text-xs text-[#795548] dark:text-[#BDB7B2] truncate">
                          {unit.topics.join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-8 md:pl-0">
                      <button
                        onClick={() => toggleUnitCompletion(activeSubject.code, unit.unitNumber)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                          unitDone
                            ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#292929] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50'
                            : 'border-[#B83232]/30 bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C] hover:bg-[#B83232]/20'
                        }`}
                      >
                        {unitDone ? 'Completed ✓' : 'Mark Complete'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubject(activeSubject);
                          setCurrentPage('materials');
                        }}
                        className="px-3 py-1.5 text-xs text-[#292929] dark:text-[#F7F5F2] hover:text-[#B83232] dark:hover:text-[#F2C94C] bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] rounded-lg transition-colors font-semibold"
                      >
                        Study Notes
                      </button>

                      {unitAssignments.length > 0 && (
                        <button
                          onClick={() => setCurrentPage('assignments')}
                          className="p-1.5 text-[#795548] dark:text-[#F2C94C] hover:text-[#B83232] bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] rounded-lg transition-colors"
                          title="Go to Unit Assignment"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mini Unit Progress Bar */}
                  <div className="pl-8 flex items-center gap-3">
                    <div className="flex-1 bg-[#E5DFD9] dark:bg-[#292929] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          unitDone ? 'bg-emerald-500' : 'bg-[#F2C94C]'
                        }`}
                        style={{ width: `${unitPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#6E6863] dark:text-[#BDB7B2] w-9 text-right">
                      {unitPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linked Course Exams Status Strip */}
        <div className="pt-4 border-t border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
            Course Assessments & Exam Completion
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allExaminations
              .filter(ex => ex.subjectCode === activeSubject.code)
              .map(exam => {
                const examResult = completedExamResults.find(r => r.examId === exam.id);
                return (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {examResult ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#795548] dark:text-[#BDB7B2] shrink-0" />
                        )}
                        <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                          {exam.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] pl-5.5 mt-0.5">
                        {examResult
                          ? `Completed · Score: ${examResult.score}/${examResult.totalMarks} (${examResult.percentage}%)`
                          : `Pending · ${exam.totalMarks} Marks · Due ${exam.dueDate}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentPage('examinations')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 ${
                        examResult
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-[#B83232] text-white hover:bg-[#9E2A2A]'
                      }`}
                    >
                      {examResult ? 'Reviewed ✓' : 'Start Test'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Reference Materials */}
        <div className="pt-4 border-t border-[#E5DFD9] dark:border-[#3D3835]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C] mb-3">
            Prescribed University References
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeSubject.referenceBooks.map((book, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-xs text-[#292929] dark:text-[#E0DBD5]"
              >
                {book}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
