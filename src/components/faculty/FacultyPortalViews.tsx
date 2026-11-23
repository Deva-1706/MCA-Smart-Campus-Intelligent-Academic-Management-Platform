import React, { useMemo, useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { ALL_FACULTY_PERMISSION_KEYS } from '../../data/smartCampusData';
import { Assignment, QuestionBankItem } from '../../types';
import {
  UserCheck,
  BookOpen,
  Layers,
  Users,
  Database,
  FileSpreadsheet,
  FileCheck2,
  ClipboardCheck,
  Award,
  Plus,
  Lock,
  CheckCircle2,
  Search,
  Download,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { FacultyDocumentManagement } from '../portal/FacultyDocumentManagement';
import { ImportantNoticesSection } from '../portal/ImportantNoticesSection';
import { AcademicIntelligenceView } from '../smart-campus/AcademicIntelligenceView';
import { SkillDNAView } from '../smart-campus/SkillDNAView';
import { ProjectStudioView } from '../smart-campus/ProjectStudioView';
import { KnowledgeGraphView } from '../smart-campus/KnowledgeGraphView';
import { ChallengeArenaView } from '../smart-campus/ChallengeArenaView';
import { SmartStudyPlannerView } from '../smart-campus/SmartStudyPlannerView';
import { AcademicCalendarView } from '../portal/AcademicCalendarView';

function computeGradeLetter(pct: number): string {
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  return 'RA';
}

export const FacultyPortalViews: React.FC = () => {
  const {
    currentUser,
    currentPage,
    setCurrentPage,
    allSubjects,
    canFacultyAccessSubject,
    hasFacultyPermission,
    userAccounts,
    questionBank,
    addQuestionBankItem,
    toggleQuestionApproval,
    assignments,
    allExaminations,
    evaluateAssignmentSubmission,
    createFacultyAssignment,
    createFacultyExamination,
    completedExamResults,
    projects,
    skillEvidence,
  } = usePortal();

  const assignedSubjects = useMemo(
    () => allSubjects.filter(s => canFacultyAccessSubject(s.code)),
    [allSubjects, canFacultyAccessSubject]
  );
  const assignedCodeSet = useMemo(
    () => new Set(assignedSubjects.map(s => s.code)),
    [assignedSubjects]
  );
  const studentCohorts = useMemo(
    () => userAccounts.filter(u => u.role === 'student'),
    [userAccounts]
  );

  // Shared Filter States
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<number | 'ALL'>('ALL');
  const [qbTypeFilter, setQbTypeFilter] = useState<string>('ALL');
  const [evalStatusFilter, setEvalStatusFilter] = useState<'ALL' | 'PENDING' | 'EVALUATED'>('ALL');

  // Question Bank Authoring Draft
  const [qbSubject, setQbSubject] = useState(assignedSubjects[0]?.code || '435C1A');
  const [qbUnit, setQbUnit] = useState<number>(1);
  const [qbType, setQbType] = useState<QuestionBankItem['questionType']>('Descriptive');
  const [qbDifficulty, setQbDifficulty] = useState<QuestionBankItem['difficulty']>('Medium');
  const [qbMarks, setQbMarks] = useState<number>(5);
  const [qbTopic, setQbTopic] = useState('');
  const [qbPrompt, setQbPrompt] = useState('');
  const [qbAnswer, setQbAnswer] = useState('');
  const [qbBanner, setQbBanner] = useState<string | null>(null);

  // Assignment Authoring Draft
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [asgSubject, setAsgSubject] = useState(assignedSubjects[0]?.code || '435C1A');
  const [asgUnit, setAsgUnit] = useState<number>(1);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgType, setAsgType] = useState<Assignment['assignmentType']>('Mixed Question Assignment');
  const [asgMarks, setAsgMarks] = useState<number>(25);
  const [asgDifficulty, setAsgDifficulty] = useState<Assignment['difficulty']>('Medium');
  const [asgDueDate, setAsgDueDate] = useState('2026-12-05');
  const [asgPrompt, setAsgPrompt] = useState('');
  const [assessmentBanner, setAssessmentBanner] = useState<string | null>(null);

  // Examination Authoring Draft
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examSubject, setExamSubject] = useState(assignedSubjects[0]?.code || '435C1A');
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState<number>(45);
  const [examMarks, setExamMarks] = useState<number>(50);
  const [examDueDate, setExamDueDate] = useState('2026-12-12');
  const [examQuestionText, setExamQuestionText] = useState('');
  const [examOptionA, setExamOptionA] = useState('');
  const [examOptionB, setExamOptionB] = useState('');
  const [examOptionC, setExamOptionC] = useState('');
  const [examOptionD, setExamOptionD] = useState('');
  const [examCorrectIndex, setExamCorrectIndex] = useState<number>(0);

  // Evaluation Drafts & Saved Feedback Indicator
  const [evalMarksDraft, setEvalMarksDraft] = useState<Record<string, number>>({});
  const [evalFeedbackDraft, setEvalFeedbackDraft] = useState<Record<string, string>>({});
  const [savedEvalId, setSavedEvalId] = useState<string | null>(null);

  const handleAddQB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbTopic.trim() || !qbPrompt.trim()) return;
    addQuestionBankItem({
      subjectCode: qbSubject,
      unit: qbUnit,
      topic: qbTopic.trim(),
      questionType: qbType,
      difficulty: qbDifficulty,
      marks: qbMarks,
      prompt: qbPrompt.trim(),
      correctAnswer: qbAnswer.trim() || 'Model university rubric solution.',
      explanation: `Authored by Faculty Coordinator ${currentUser?.name || 'HCASICAN'}.`,
      sourceRef: `${qbSubject} Unit ${qbUnit} Faculty Question Bank`,
      createdBy: currentUser?.name || 'HCASICAN',
      approved: true,
    });
    setQbBanner(`Added ${qbType} item to ${qbSubject} · Unit ${qbUnit}.`);
    setQbTopic('');
    setQbPrompt('');
    setQbAnswer('');
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgPrompt.trim()) return;
    const created = createFacultyAssignment({
      subjectCode: asgSubject,
      unit: asgUnit,
      title: asgTitle.trim(),
      assignmentType: asgType,
      totalMarks: asgMarks,
      difficulty: asgDifficulty,
      dueDate: asgDueDate,
      durationMinutes: 60,
      questionPrompt: asgPrompt.trim(),
    });
    setAssessmentBanner(`Published assignment "${created.title}" (${created.subjectCode}).`);
    setAsgTitle('');
    setAsgPrompt('');
    setShowCreateAssignment(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examQuestionText.trim()) return;
    const options = [examOptionA, examOptionB, examOptionC, examOptionD].filter(o => o.trim().length > 0);
    const safeOptions = options.length >= 2 ? options : ['True / Valid Condition', 'False / Invalid Condition'];
    const created = createFacultyExamination({
      subjectCode: examSubject,
      title: examTitle.trim(),
      durationMinutes: examDuration,
      totalMarks: examMarks,
      passingMarks: Math.round(examMarks * 0.4),
      dueDate: examDueDate,
      questionText: examQuestionText.trim(),
      options: safeOptions,
      correctAnswerIndex: Math.min(examCorrectIndex, safeOptions.length - 1),
      explanation: `Verified answer key authored by ${currentUser?.name || 'HCASICAN'}.`,
    });
    setAssessmentBanner(`Scheduled examination "${created.title}" (${created.subjectCode}).`);
    setExamTitle('');
    setExamQuestionText('');
    setExamOptionA('');
    setExamOptionB('');
    setExamOptionC('');
    setExamOptionD('');
    setShowCreateExam(false);
  };

  // Derived Pending Counts for Faculty Overview
  const scopedAssignments = assignments.filter(a => assignedCodeSet.has(a.subjectCode));
  const pendingEvaluationCount = scopedAssignments.filter(a => a.status !== 'Evaluated').length;
  const pendingSkillCount = skillEvidence.filter(e => e.status === 'Pending Review').length;
  const pendingProjectCount = projects.filter(p => p.status === 'Under Review').length;
  const totalPendingReviews = pendingEvaluationCount + pendingSkillCount + pendingProjectCount;

  // -------------------------------------------------------------
  // 1. FACULTY OVERVIEW DASHBOARD
  // -------------------------------------------------------------
  if (currentPage === 'faculty-overview') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
              Faculty Coordinator Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
              Welcome, Faculty Advisor {currentUser?.name || 'HCASICAN'}
            </h1>
            <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
              Managing {assignedSubjects.length} allocated MCA subjects across {studentCohorts.length} enrolled scholars with Admin-governed permissions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-evaluation')}
              className="px-3.5 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold whitespace-nowrap transition-colors"
            >
              Evaluate Submissions
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-gradebook')}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548] text-xs font-bold whitespace-nowrap transition-colors"
            >
              Gradebook & Marks
            </button>
          </div>
        </div>

        {/* KPI Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232]">
            <span className="text-xs font-medium text-[#795548] dark:text-[#BDB7B2]">Assigned Subjects</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{assignedSubjects.length}</p>
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-subjects')}
              className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline inline-flex items-center gap-1"
            >
              <span>Inspect Syllabus</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#795548]">
            <span className="text-xs font-medium text-[#795548] dark:text-[#BDB7B2]">Enrolled Students</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{studentCohorts.length}</p>
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-students')}
              className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline inline-flex items-center gap-1"
            >
              <span>View Student Cohorts</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#F2C94C]">
            <span className="text-xs font-medium text-[#795548] dark:text-[#BDB7B2]">Question Bank Items</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{questionBank.length}</p>
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-question-bank')}
              className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Question Bank</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#292929]">
            <span className="text-xs font-medium text-[#795548] dark:text-[#BDB7B2]">Pending Reviews</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{totalPendingReviews}</p>
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-skills')}
              className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline inline-flex items-center gap-1"
            >
              <span>Skill DNA & Projects</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Allocated Subject Ledger & Action Shortcuts */}
        <div className="rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold">Allocated Subject Roster & Evaluation Load</h2>
              <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                Semester 1 confirmed curriculum subjects assigned to {currentUser?.name || 'HCASICAN'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage('faculty-profile')}
              className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
            >
              Inspect Permissions →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-2.5">Code</th>
                  <th className="px-5 py-2.5">Subject Name</th>
                  <th className="px-5 py-2.5 text-right">Credits</th>
                  <th className="px-5 py-2.5 text-right">Units</th>
                  <th className="px-5 py-2.5 text-right">Assignments</th>
                  <th className="px-5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD9] dark:divide-[#3D3835]">
                {assignedSubjects.map(sub => {
                  const subAsgs = scopedAssignments.filter(a => a.subjectCode === sub.code);
                  return (
                    <tr key={sub.id} className="hover:bg-[#F7F5F2]/60 dark:hover:bg-[#1E1E1E]/60 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">{sub.code}</td>
                      <td className="px-5 py-3 font-semibold">{sub.name}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">{sub.credits}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">{sub.totalModules}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">{subAsgs.length}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSubjectFilter(sub.code);
                            setCurrentPage('faculty-evaluation');
                          }}
                          className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <AcademicIntelligenceView mode="faculty" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. FACULTY PROFILE & PERMISSIONS MATRIX
  // -------------------------------------------------------------
  if (currentPage === 'faculty-profile') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#B83232]" />
            <span>Faculty Advisor Profile & Governance Permissions</span>
          </h1>
          <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
            Official institutional profile, allocated course roster, and Admin-governed capability matrix.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="md:col-span-2 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
              Academic Coordinator Dossier
            </span>
            <h2 className="text-xl font-extrabold">{currentUser?.name || 'HCASICAN'}</h2>
            <p className="text-[#795548] dark:text-[#BDB7B2]">
              {currentUser?.designation || 'Faculty Advisor & Subject Coordinator'} ·{' '}
              {currentUser?.department || 'Department of Computer Applications'}
            </p>
            <div className="pt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px]">
              <span>ID: <strong>{currentUser?.studentId || 'FAC001'}</strong></span>
              <span>Username: <strong>@{currentUser?.username || 'hcasican_faculty'}</strong></span>
              <span>Email: <strong>{currentUser?.email || 'hcasican@mcasmartcampus.edu'}</strong></span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-[#795548] dark:text-[#F2C94C]">
              Allocated Subject Codes
            </p>
            <p className="font-mono font-bold text-sm">
              {assignedSubjects.map(s => s.code).join(' · ') || 'None Allocated'}
            </p>
            <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">
              Managed centrally via Institutional Admin Allocations.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E5DFD9] dark:border-[#3D3835] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B83232]" />
            <h2 className="text-sm font-extrabold">Admin-Governed Permission Matrix</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E5DFD9] dark:bg-[#3D3835]">
            {ALL_FACULTY_PERMISSION_KEYS.map(perm => {
              const granted = hasFacultyPermission(perm.key);
              return (
                <div key={perm.key} className="p-4 bg-white dark:bg-[#292929] space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{perm.label}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        granted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-[#1E1E1E] dark:text-[#BDB7B2]'
                      }`}
                    >
                      {granted ? 'Granted' : 'Restricted'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">{perm.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. ASSIGNED SUBJECTS & SYLLABUS UNITS / TOPICS
  // -------------------------------------------------------------
  if (currentPage === 'faculty-subjects' || currentPage === 'faculty-units') {
    const isUnitsView = currentPage === 'faculty-units';
    const filteredSubjects = assignedSubjects.filter(s => {
      if (subjectFilter !== 'ALL' && s.code !== subjectFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.units.some(u => u.title.toLowerCase().includes(q) || u.topics.some(t => t.toLowerCase().includes(q)))
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              {isUnitsView ? <Layers className="w-6 h-6 text-[#B83232]" /> : <BookOpen className="w-6 h-6 text-[#B83232]" />}
              <span>{isUnitsView ? 'Syllabus Units & Learning Topics' : 'Assigned MCA Subjects'}</span>
            </h1>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
              Explore structured unit modules, reference textbooks, and jump directly to assessment authoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#795548]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter subjects or topics..."
                className="pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
            </div>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Assigned Subjects</option>
              {assignedSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.code} · {s.name}</option>
              ))}
            </select>
            {isUnitsView && (
              <select
                value={unitFilter}
                onChange={e => setUnitFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <option value="ALL">All Units (1–5)</option>
                {[1, 2, 3, 4, 5].map(u => (
                  <option key={u} value={u}>Unit {u}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="p-8 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-center text-xs space-y-2">
            <p className="font-bold text-sm">No matching subjects or topics found.</p>
            <button
              type="button"
              onClick={() => {
                setSubjectFilter('ALL');
                setSearchQuery('');
                setUnitFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#B83232] text-white font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSubjects.map(sub => {
              const visibleUnits =
                isUnitsView && unitFilter !== 'ALL'
                  ? sub.units.filter(u => u.unitNumber === unitFilter)
                  : sub.units;
              return (
                <div key={sub.id} className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-4 text-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-[#E5DFD9] dark:border-[#3D3835] pb-2.5">
                      <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                        {sub.code} · {sub.type}
                      </span>
                      <span className="font-mono tabular-nums text-[#795548] dark:text-[#BDB7B2]">
                        {sub.credits} Credits · {sub.totalModules} Units
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold">{sub.name}</h2>
                      <p className="text-[#795548] dark:text-[#BDB7B2] mt-1">{sub.description}</p>
                    </div>
                    <div className="space-y-1.5">
                      {visibleUnits.map(u => (
                        <div key={u.unitNumber} className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9]/70 dark:border-[#3D3835]">
                          <p className="font-bold">Unit {u.unitNumber}: {u.title}</p>
                          <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-0.5">{u.topics.join(' · ')}</p>
                        </div>
                      ))}
                    </div>
                    {!isUnitsView && sub.referenceBooks.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[10px] font-bold uppercase text-[#795548] dark:text-[#BDB7B2]">
                          Recommended References
                        </p>
                        <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">
                          {sub.referenceBooks.slice(0, 2).join(' | ')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                    <button
                      type="button"
                      onClick={() => {
                        setQbSubject(sub.code);
                        setSubjectFilter(sub.code);
                        setCurrentPage('faculty-question-bank');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#292929] text-[#F2C94C] font-bold"
                    >
                      Author Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('faculty-materials')}
                      className="px-3 py-1.5 rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] font-bold hover:border-[#B83232]"
                    >
                      Manage PDFs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. STUDENT COHORTS (NO ATTENDANCE COLUMNS)
  // -------------------------------------------------------------
  if (currentPage === 'faculty-students') {
    const filteredCohorts = studentCohorts.filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Users className="w-6 h-6 text-[#B83232]" />
              <span>Assigned Student Cohorts ({filteredCohorts.length})</span>
            </h1>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
              Academic cohort roster showing MCA Semester 1 credit progression and SGPA benchmarks.
            </p>
          </div>
          <div className="relative text-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#795548]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student ID, roll, name..."
              className="pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] w-64"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Scholar Name & Email</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3 text-right">Credits</th>
                  <th className="px-4 py-3 text-right">Current SGPA</th>
                  <th className="px-4 py-3 text-right">Target SGPA</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD9] dark:divide-[#3D3835]">
                {filteredCohorts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#795548] dark:text-[#BDB7B2]">
                      No matching student records found.
                    </td>
                  </tr>
                ) : (
                  filteredCohorts.map(s => (
                    <tr key={s.id} className="hover:bg-[#F7F5F2]/60 dark:hover:bg-[#1E1E1E]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">{s.studentId}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{s.rollNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{s.name}</p>
                        <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">{s.email}</p>
                      </td>
                      <td className="px-4 py-3">{s.batch}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {s.completedCredits}/{s.totalCredits}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                        {s.currentSGPA.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-[#795548] dark:text-[#BDB7B2]">
                        {s.targetSGPA.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold">
                          {s.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. DOCUMENT MANAGEMENT & AI REVISION NOTES
  // -------------------------------------------------------------
  if (currentPage === 'faculty-materials') {
    if (!hasFacultyPermission('manage_materials')) {
      return (
        <div className="p-6 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-[#B83232] shrink-0" />
          <span>Permission Required: Ask Institutional Admin to grant "Manage Learning Materials".</span>
        </div>
      );
    }
    return <FacultyDocumentManagement />;
  }

  if (currentPage === 'faculty-ai-notes') {
    return <SmartStudyPlannerView mode="faculty" />;
  }

  // -------------------------------------------------------------
  // 6. QUESTION BANK AUTHORING & APPROVAL
  // -------------------------------------------------------------
  if (currentPage === 'faculty-question-bank') {
    const filteredQuestions = questionBank.filter(q => {
      if (subjectFilter !== 'ALL' && q.subjectCode !== subjectFilter) return false;
      if (qbTypeFilter !== 'ALL' && q.questionType !== qbTypeFilter) return false;
      if (!searchQuery.trim()) return true;
      const needle = searchQuery.toLowerCase();
      return (
        q.topic.toLowerCase().includes(needle) ||
        q.prompt.toLowerCase().includes(needle) ||
        q.subjectCode.toLowerCase().includes(needle)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Database className="w-6 h-6 text-[#B83232]" />
              <span>Faculty Question Bank ({filteredQuestions.length})</span>
            </h1>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
              Author syllabus-grounded MCQs, short answers, descriptive problems, and coding items across Units 1–5.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Subjects</option>
              {assignedSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.code}</option>
              ))}
            </select>
            <select
              value={qbTypeFilter}
              onChange={e => setQbTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Types</option>
              <option value="MCQ">MCQ</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Descriptive">Descriptive</option>
              <option value="Coding">Coding</option>
            </select>
          </div>
        </div>

        {qbBanner && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{qbBanner}</span>
            </span>
            <button type="button" onClick={() => setQbBanner(null)} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleAddQB} className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 text-xs">
          <h2 className="text-sm font-extrabold">Add New Question Bank Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              aria-label="Question Subject"
              value={qbSubject}
              onChange={e => setQbSubject(e.target.value)}
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              {assignedSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.code} · {s.name}</option>
              ))}
            </select>
            <select
              aria-label="Question Unit"
              value={qbUnit}
              onChange={e => setQbUnit(Number(e.target.value))}
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              {[1, 2, 3, 4, 5].map(u => (
                <option key={u} value={u}>Unit {u}</option>
              ))}
            </select>
            <select
              aria-label="Question Type"
              value={qbType}
              onChange={e => setQbType(e.target.value as QuestionBankItem['questionType'])}
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="Descriptive">Descriptive</option>
              <option value="Short Answer">Short Answer</option>
              <option value="MCQ">MCQ</option>
              <option value="Coding">Coding</option>
            </select>
            <select
              aria-label="Question Difficulty"
              value={qbDifficulty}
              onChange={e => setQbDifficulty(e.target.value as QuestionBankItem['difficulty'])}
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <input
              type="number"
              min={1}
              max={20}
              aria-label="Question Marks"
              value={qbMarks}
              onChange={e => setQbMarks(Number(e.target.value))}
              placeholder="Marks"
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono tabular-nums"
            />
          </div>
          <input
            type="text"
            required
            value={qbTopic}
            onChange={e => setQbTopic(e.target.value)}
            placeholder="Topic (e.g. AVL Balance Factor)"
            className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
          />
          <input
            type="text"
            required
            value={qbPrompt}
            onChange={e => setQbPrompt(e.target.value)}
            placeholder="Question prompt"
            className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
          />
          <input
            type="text"
            value={qbAnswer}
            onChange={e => setQbAnswer(e.target.value)}
            placeholder="Model solution / rubric key"
            className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question to Bank</span>
          </button>
        </form>

        <div className="space-y-2.5 text-xs">
          {filteredQuestions.map(q => (
            <div key={q.id} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                  {q.subjectCode} · Unit {q.unit} · {q.questionType} · {q.difficulty} · {q.marks} Marks
                </p>
                <p className="font-bold text-sm">{q.topic}: {q.prompt}</p>
                <p className="text-[#795548] dark:text-[#BDB7B2]">Key: {q.correctAnswer}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleQuestionApproval(q.id)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 whitespace-nowrap ${
                  q.approved
                    ? 'bg-[#292929] text-[#F2C94C]'
                    : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]'
                }`}
              >
                {q.approved ? 'Approved' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. ASSIGNMENTS & EXAMINATIONS AUTHORING + SCHEDULE
  // -------------------------------------------------------------
  if (currentPage === 'faculty-assignments' || currentPage === 'faculty-exams') {
    const isExams = currentPage === 'faculty-exams';
    const canCreate = hasFacultyPermission('create_assessments');
    const items = isExams
      ? allExaminations.filter(e => (subjectFilter === 'ALL' || e.subjectCode === subjectFilter))
      : scopedAssignments.filter(a => (subjectFilter === 'ALL' || a.subjectCode === subjectFilter));

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              {isExams ? <FileCheck2 className="w-6 h-6 text-[#B83232]" /> : <FileSpreadsheet className="w-6 h-6 text-[#B83232]" />}
              <span>{isExams ? 'Examinations Schedule & Question Sets' : 'Subject Assignments'}</span>
            </h1>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
              {isExams
                ? 'Manage timed MCA Semester 1 online examinations across allocated subjects.'
                : 'Publish unit assignments and review submission progress across cohorts.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Subjects</option>
              {assignedSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.code}</option>
              ))}
            </select>
            {canCreate && (
              <button
                type="button"
                onClick={() => (isExams ? setShowCreateExam(p => !p) : setShowCreateAssignment(p => !p))}
                className="px-3.5 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isExams ? 'Schedule Examination' : 'New Assignment'}</span>
              </button>
            )}
          </div>
        </div>

        {!canCreate && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>View-only mode: Assessment creation permission currently disabled by Institutional Admin.</span>
          </div>
        )}

        {assessmentBanner && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{assessmentBanner}</span>
            </span>
            <button type="button" onClick={() => setAssessmentBanner(null)} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {!isExams && canCreate && showCreateAssignment && (
          <form onSubmit={handleCreateAssignment} className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 text-xs">
            <h2 className="text-sm font-extrabold">Publish New Subject Assignment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={asgSubject}
                onChange={e => setAsgSubject(e.target.value)}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                {assignedSubjects.map(s => (
                  <option key={s.code} value={s.code}>{s.code} · {s.name}</option>
                ))}
              </select>
              <select
                value={asgUnit}
                onChange={e => setAsgUnit(Number(e.target.value))}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                {[1, 2, 3, 4, 5].map(u => <option key={u} value={u}>Unit {u}</option>)}
              </select>
              <select
                value={asgType}
                onChange={e => setAsgType(e.target.value as Assignment['assignmentType'])}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <option value="Mixed Question Assignment">Mixed Question Assignment</option>
                <option value="Programming Assignment">Programming Assignment</option>
                <option value="Long Answer Assignment">Long Answer Assignment</option>
                <option value="MCQ Assignment">MCQ Assignment</option>
              </select>
              <input
                type="date"
                value={asgDueDate}
                onChange={e => setAsgDueDate(e.target.value)}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={asgTitle}
                onChange={e => setAsgTitle(e.target.value)}
                placeholder="Assignment title"
                className="sm:col-span-2 p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={asgMarks}
                  onChange={e => setAsgMarks(Number(e.target.value))}
                  className="w-24 p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono"
                />
                <select
                  value={asgDifficulty}
                  onChange={e => setAsgDifficulty(e.target.value as Assignment['difficulty'])}
                  className="flex-1 p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
            <textarea
              required
              rows={2}
              value={asgPrompt}
              onChange={e => setAsgPrompt(e.target.value)}
              placeholder="Primary assessment prompt or problem specification..."
              className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#B83232] text-white font-bold">
              Publish Assignment
            </button>
          </form>
        )}

        {isExams && canCreate && showCreateExam && (
          <form onSubmit={handleCreateExam} className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 text-xs">
            <h2 className="text-sm font-extrabold">Schedule New Subject Examination</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={examSubject}
                onChange={e => setExamSubject(e.target.value)}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                {assignedSubjects.map(s => (
                  <option key={s.code} value={s.code}>{s.code} · {s.name}</option>
                ))}
              </select>
              <input
                type="text"
                required
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                placeholder="Examination title"
                className="sm:col-span-2 p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
              <input
                type="date"
                value={examDueDate}
                onChange={e => setExamDueDate(e.target.value)}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
                <span>Duration (min):</span>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={examDuration}
                  onChange={e => setExamDuration(Number(e.target.value))}
                  className="w-20 bg-transparent font-mono font-bold"
                />
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
                <span>Total Marks:</span>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={examMarks}
                  onChange={e => setExamMarks(Number(e.target.value))}
                  className="w-20 bg-transparent font-mono font-bold"
                />
              </label>
              <select
                value={examCorrectIndex}
                onChange={e => setExamCorrectIndex(Number(e.target.value))}
                className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <option value={0}>Correct Option: A</option>
                <option value={1}>Correct Option: B</option>
                <option value={2}>Correct Option: C</option>
                <option value={3}>Correct Option: D</option>
              </select>
            </div>
            <input
              type="text"
              required
              value={examQuestionText}
              onChange={e => setExamQuestionText(e.target.value)}
              placeholder="Examination MCQ prompt..."
              className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" required value={examOptionA} onChange={e => setExamOptionA(e.target.value)} placeholder="Option A" className="p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
              <input type="text" required value={examOptionB} onChange={e => setExamOptionB(e.target.value)} placeholder="Option B" className="p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
              <input type="text" value={examOptionC} onChange={e => setExamOptionC(e.target.value)} placeholder="Option C (optional)" className="p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
              <input type="text" value={examOptionD} onChange={e => setExamOptionD(e.target.value)} placeholder="Option D (optional)" className="p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#B83232] text-white font-bold">
              Publish Examination
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {items.map((item: any) => (
            <div key={item.id} className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                    {item.subjectCode} {item.unit ? `· Unit ${item.unit}` : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] font-mono text-[10px] font-bold">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm font-extrabold">{item.title}</p>
                <p className="text-[#795548] dark:text-[#BDB7B2] font-mono tabular-nums">
                  {item.totalMarks} Marks · {item.durationMinutes} min · Due {item.dueDate}
                </p>
              </div>
              <div className="pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835] flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage(isExams ? 'faculty-gradebook' : 'faculty-evaluation')}
                  className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
                >
                  {isExams ? 'Open Gradebook →' : 'Evaluate Submission →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. SUBMISSION EVALUATION
  // -------------------------------------------------------------
  if (currentPage === 'faculty-evaluation') {
    if (!hasFacultyPermission('evaluate_submissions')) {
      return (
        <div className="p-6 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#B83232]" />
          <span>Permission Required: Evaluation capability must be enabled by Institutional Admin.</span>
        </div>
      );
    }

    const filteredAssignments = scopedAssignments.filter(a => {
      if (subjectFilter !== 'ALL' && a.subjectCode !== subjectFilter) return false;
      if (evalStatusFilter === 'EVALUATED' && a.status !== 'Evaluated') return false;
      if (evalStatusFilter === 'PENDING' && a.status === 'Evaluated') return false;
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-[#B83232]" />
              <span>Assignment & Submission Evaluation</span>
            </h1>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
              Assign marks, record qualitative rubric remarks, and publish evaluated grades for student submissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Subjects</option>
              {assignedSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.code}</option>
              ))}
            </select>
            <select
              value={evalStatusFilter}
              onChange={e => setEvalStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'EVALUATED')}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Evaluation</option>
              <option value="EVALUATED">Evaluated</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {filteredAssignments.map(a => {
            const currentMarks = evalMarksDraft[a.id] ?? a.studentSubmission?.marksObtained ?? a.totalMarks;
            const currentFeedback = evalFeedbackDraft[a.id] ?? a.studentSubmission?.feedback ?? '';
            const justSaved = savedEvalId === a.id;

            return (
              <div key={a.id} className="p-5 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {a.subjectCode} · Unit {a.unit}
                    </span>
                    <h2 className="text-sm font-extrabold mt-0.5">{a.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                      Max: {a.totalMarks} Marks
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'Evaluated'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span>
                    Scholar: <strong>{a.studentSubmission?.studentName || 'Devanath N'}</strong> (
                    <span className="font-mono">{a.studentSubmission?.studentId || 'MCA2401'}</span>)
                  </span>
                  <span className="font-mono text-[#795548] dark:text-[#BDB7B2] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {a.studentSubmission?.submittedAt || 'Ready for direct rubric grading'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5">
                    <span className="font-bold">Marks:</span>
                    <input
                      type="number"
                      aria-label={`Marks for ${a.title}`}
                      min={0}
                      max={a.totalMarks}
                      value={currentMarks}
                      onChange={e => setEvalMarksDraft(p => ({ ...p, [a.id]: Number(e.target.value) }))}
                      className="w-20 p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono tabular-nums"
                    />
                  </label>
                  <input
                    type="text"
                    aria-label={`Remarks for ${a.title}`}
                    value={currentFeedback}
                    onChange={e => setEvalFeedbackDraft(p => ({ ...p, [a.id]: e.target.value }))}
                    placeholder="Evaluation remarks & rubric feedback..."
                    className="flex-1 min-w-[200px] p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      evaluateAssignmentSubmission(
                        a.id,
                        currentMarks,
                        currentFeedback.trim() || `Evaluated cleanly by Faculty Coordinator ${currentUser?.name || 'HCASICAN'}.`
                      );
                      setSavedEvalId(a.id);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold whitespace-nowrap"
                  >
                    Save Grade
                  </button>
                </div>

                {justSaved && (
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Grade saved ({currentMarks}/{a.totalMarks}) and recorded in institutional audit trail.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 9. SUBJECT GRADEBOOK & EXAMINATION MARKS LEDGER
  // -------------------------------------------------------------
  if (currentPage === 'faculty-gradebook') {
    if (!hasFacultyPermission('view_marks')) {
      return (
        <div className="p-6 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#B83232]" />
          <span>Permission Required: Ask Institutional Admin to grant "View Marks".</span>
        </div>
      );
    }

    const canPublishMarks = hasFacultyPermission('publish_marks');

    // Combine completed exams + evaluated/submitted assignments into unified ledger rows
    const ledgerRows = [
      ...completedExamResults
        .filter(r => subjectFilter === 'ALL' || r.subjectCode === subjectFilter)
        .map((r, idx) => ({
          id: `ex-${r.examId}-${idx}`,
          subjectCode: r.subjectCode,
          assessmentType: 'Examination',
          title: r.examTitle,
          studentName: 'Devanath N (MCA2401)',
          score: r.score,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          grade: computeGradeLetter(r.percentage),
          status: r.passed ? 'Passed' : 'Needs Review',
        })),
      ...scopedAssignments
        .filter(a => (subjectFilter === 'ALL' || a.subjectCode === subjectFilter) && a.studentSubmission?.marksObtained !== undefined)
        .map(a => {
          const score = a.studentSubmission!.marksObtained!;
          const pct = Math.round((score / Math.max(1, a.totalMarks)) * 100);
          return {
            id: `asg-${a.id}`,
            subjectCode: a.subjectCode,
            assessmentType: 'Assignment',
            title: a.title,
            studentName: `${a.studentSubmission?.studentName || 'Devanath N'} (${a.studentSubmission?.studentId || 'MCA2401'})`,
            score,
            totalMarks: a.totalMarks,
            percentage: pct,
            grade: computeGradeLetter(pct),
            status: a.status,
          };
        }),
    ].filter(row => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        row.subjectCode.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.studentName.toLowerCase().includes(q)
      );
    });

    const meanPct =
      ledgerRows.length > 0
        ? Math.round(ledgerRows.reduce((sum, r) => sum + r.percentage, 0) / ledgerRows.length)
        : 0;

    const handleExportCSV = () => {
      const headers = ['Subject Code', 'Type', 'Assessment Title', 'Student', 'Score', 'Max Marks', 'Percentage', 'Grade', 'Status'];
      const csvLines = [
        headers.join(','),
        ...ledgerRows.map(r =>
          [
            r.subjectCode,
            r.assessmentType,
            `"${r.title.replace(/"/g, '""')}"`,
            `"${r.studentName}"`,
            r.score,
            r.totalMarks,
            `${r.percentage}%`,
            r.grade,
            r.status,
          ].join(',')
        ),
      ];
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MCA_Faculty_Gradebook_${subjectFilter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Award className="w-6 h-6 text-[#B83232]" />
              <span>Subject Gradebook & Examination Marks</span>
            </h1>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
              Consolidated examination results, evaluated assignment marks, and student SGPA cohort ledger.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="ALL">All Assigned Subjects</option>
              {assignedSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.code}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg bg-[#292929] hover:bg-[#1E1E1E] text-[#F2C94C] font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Gradebook CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]">
            <span className="text-[#795548] dark:text-[#BDB7B2]">Recorded Grade Entries</span>
            <p className="text-2xl font-extrabold font-mono tabular-nums mt-1">{ledgerRows.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]">
            <span className="text-[#795548] dark:text-[#BDB7B2]">Mean Attainment Score</span>
            <p className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-[#B83232] dark:text-[#F2C94C]">
              {meanPct}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]">
            <span className="text-[#795548] dark:text-[#BDB7B2]">Marks Publishing Authority</span>
            <p className="text-sm font-extrabold mt-2">
              {canPublishMarks ? 'Direct Faculty Release Active' : 'Admin Verification Required'}
            </p>
          </div>
        </div>

        {/* Marks Ledger Table */}
        <div className="rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold">Evaluated Assignments & Exam Marks</h2>
            <div className="relative text-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#795548]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search title or student..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
            </div>
          </div>

          {ledgerRows.length === 0 ? (
            <div className="p-6 text-xs text-center space-y-2">
              <p className="font-bold">No completed student exam attempts or graded submissions recorded for this filter yet.</p>
              <button
                type="button"
                onClick={() => setCurrentPage('faculty-evaluation')}
                className="px-3.5 py-2 rounded-lg bg-[#B83232] text-white font-bold"
              >
                Grade Pending Submissions
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Assessment Title</th>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5 text-right">Score</th>
                    <th className="px-4 py-2.5 text-right">Percentage</th>
                    <th className="px-4 py-2.5 text-right">Grade</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD9] dark:divide-[#3D3835]">
                  {ledgerRows.map(row => (
                    <tr key={row.id} className="hover:bg-[#F7F5F2]/60 dark:hover:bg-[#1E1E1E]/60">
                      <td className="px-4 py-3 font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">{row.subjectCode}</td>
                      <td className="px-4 py-3">{row.assessmentType}</td>
                      <td className="px-4 py-3 font-semibold">{row.title}</td>
                      <td className="px-4 py-3">{row.studentName}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">
                        {row.score}/{row.totalMarks}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{row.percentage}%</td>
                      <td className="px-4 py-3 text-right font-mono font-extrabold">{row.grade}</td>
                      <td className="px-4 py-3 text-right">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. INTEGRATED SMART CAMPUS FACULTY MODULES
  // -------------------------------------------------------------
  if (currentPage === 'faculty-projects') return <ProjectStudioView mode="faculty" />;
  if (currentPage === 'faculty-challenges' || currentPage === 'faculty-practice') return <ChallengeArenaView mode="faculty" />;
  if (currentPage === 'faculty-skills') return <SkillDNAView mode="faculty" />;
  if (currentPage === 'faculty-knowledge-graph') return <KnowledgeGraphView mode="faculty" />;
  if (currentPage === 'faculty-analytics') return <AcademicIntelligenceView mode="faculty" />;
  if (currentPage === 'faculty-calendar') return <AcademicCalendarView />;
  return <ImportantNoticesSection allowManagement={true} />;
};
