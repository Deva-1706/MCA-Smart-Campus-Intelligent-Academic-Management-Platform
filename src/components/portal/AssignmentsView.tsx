import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { Assignment, AssignmentQuestion, GenerationMethod } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
  Code2,
  ArrowLeft,
  Upload,
  Download,
  BookOpen,
  Award,
  Filter,
  Check
} from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const {
    assignments,
    currentUser,
    submitAssignment,
    saveAssignmentDraft,
    generateDynamicAssignment,
    allSubjects,
    setCurrentPage
  } = usePortal();

  const studentName = currentUser?.name || 'MCA Student';
  const studentId = currentUser?.studentId || 'MCA2401';
  const studentRoll = currentUser?.rollNumber || studentId;
  const advisorName = currentUser?.advisorName || 'HCASICAN';

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState<boolean>(false);

  // Assignment Runner State
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);

  // Generator Modal Form State
  const [genSubjectCode, setGenSubjectCode] = useState<string>('435C1A');
  const [genMethod, setGenMethod] = useState<GenerationMethod>('Topic-Based');
  const [genDifficulty, setGenDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
  const [genQuestionType, setGenQuestionType] = useState<string>('Mixed');
  const [genCO, setGenCO] = useState<string>('CO1: Foundational Conceptual Analysis');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const activeAssignment = assignments.find(a => a.id === activeAssignmentId);

  // Start taking or reviewing an assignment
  const handleOpenAssignment = (assignment: Assignment) => {
    setActiveAssignmentId(assignment.id);
    setSubmitSuccess(false);
    setIsDraftSaved(false);
    // Pre-populate if student has previous draft or submission
    if (assignment.studentSubmission?.answers) {
      setUserAnswers(assignment.studentSubmission.answers);
      setAttachedFileName(assignment.studentSubmission.attachedFileName || '');
    } else {
      setUserAnswers({});
      setAttachedFileName('');
    }
  };

  const handleAnswerChange = (questionId: string, val: string | number) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: val }));
    setIsDraftSaved(false);
  };

  const handleSaveDraft = () => {
    if (!activeAssignmentId) return;
    saveAssignmentDraft(activeAssignmentId, userAnswers);
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId) return;
    submitAssignment(activeAssignmentId, userAnswers, attachedFileName || undefined);
    setSubmitSuccess(true);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newAsg = await generateDynamicAssignment({
        subjectCode: genSubjectCode,
        generationMethod: genMethod,
        difficulty: genDifficulty,
        questionType: genQuestionType,
        targetCO: genCO
      });
      setShowGeneratorModal(false);
      handleOpenAssignment(newAsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter(asg => {
    if (selectedSubjectFilter !== 'all' && asg.subjectCode !== selectedSubjectFilter) return false;
    if (activeTab === 'pending') return asg.status === 'Not Started' || asg.status === 'In Progress';
    if (activeTab === 'submitted') return asg.status === 'Submitted' || asg.status === 'Under Review';
    if (activeTab === 'evaluated') return asg.status === 'Evaluated';
    return true;
  });

  // Calculate summary statistics
  const totalCount = assignments.length;
  const pendingCount = assignments.filter(a => a.status === 'Not Started' || a.status === 'In Progress').length;
  const evaluatedCount = assignments.filter(a => a.status === 'Evaluated').length;
  const avgScore = Math.round(
    assignments
      .filter(a => a.studentSubmission?.marksObtained !== undefined)
      .reduce((acc, a) => acc + (a.studentSubmission?.marksObtained || 0), 0) / (evaluatedCount || 1)
  );

  // If taking or viewing a single assignment
  if (activeAssignment) {
    const isSubmittedOrEvaluated = activeAssignment.status === 'Submitted' || activeAssignment.status === 'Evaluated';

    return (
      <div className="space-y-6">
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD9] dark:border-[#3D3835]">
          <button
            onClick={() => setActiveAssignmentId(null)}
            className="flex items-center gap-2 text-xs font-bold text-[#795548] dark:text-[#BDB7B2] hover:text-[#B83232] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Assignments</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-[#795548]/10 text-[#795548] dark:bg-[#795548]/30 dark:text-[#F2C94C] border border-[#795548]/20">
              {activeAssignment.subjectCode} · {activeAssignment.subjectName}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-[#B83232]/10 text-[#B83232] dark:bg-[#B83232]/30 dark:text-rose-300 border border-[#B83232]/20">
              {activeAssignment.generationMethod}
            </span>
          </div>
        </div>

        {/* Assignment Header Card */}
        <div className="bg-white dark:bg-[#292929] rounded-2xl p-6 border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#795548] dark:text-[#BDB7B2] mb-1">
                <span>Unit {activeAssignment.unit}: {activeAssignment.chapter}</span>
                <span>•</span>
                <span>Topic: {activeAssignment.topic}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                {activeAssignment.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                activeAssignment.status === 'Evaluated'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : activeAssignment.status === 'Submitted'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                Status: {activeAssignment.status}
              </span>
              <span className="px-3 py-1 text-xs font-mono font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] rounded-lg border border-[#E5DFD9] dark:border-[#3D3835]">
                {activeAssignment.totalMarks} Marks
              </span>
            </div>
          </div>

          {/* Student & Faculty Advisor Reference Badge */}
          <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[#6E6863] dark:text-[#BDB7B2]">Student: </span>
                <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">
                  {currentUser?.name || 'Devanath N'} (Roll: {currentUser?.rollNumber || 'P26CA125'})
                </span>
              </div>
              <div>
                <span className="text-[#6E6863] dark:text-[#BDB7B2]">Faculty Advisor: </span>
                <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">HCASICAN</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#6E6863] dark:text-[#BDB7B2]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B83232]" /> Due: {activeAssignment.dueDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#795548]" /> {activeAssignment.durationMinutes} mins
              </span>
            </div>
          </div>

          {/* Source Document Citation */}
          <div className="flex items-center gap-2 text-xs text-[#795548] dark:text-[#F2C94C] bg-[#F2C94C]/10 border border-[#F2C94C]/30 px-3 py-2 rounded-lg">
            <BookOpen className="w-4 h-4 shrink-0 text-[#795548] dark:text-[#F2C94C]" />
            <span>
              <strong>PDF Knowledge Source:</strong> {activeAssignment.sourcePdfTitle} · Verified Reference Pages: [
              {activeAssignment.sourcePageReferences.join(', ')}]
            </span>
          </div>

          {/* Instructions */}
          <div className="text-xs text-[#6E6863] dark:text-[#BDB7B2] space-y-1">
            <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">Instructions:</span>
            <ul className="list-disc list-inside space-y-0.5">
              {activeAssignment.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>

          {/* Evaluation Banner if Evaluated */}
          {activeAssignment.status === 'Evaluated' && activeAssignment.studentSubmission && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Evaluation Score: {activeAssignment.studentSubmission.marksObtained} / {activeAssignment.totalMarks} Marks</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Reviewed on {activeAssignment.studentSubmission.submittedAt}
                </span>
              </div>
              <p className="font-medium">
                <strong>Advisor Feedback:</strong> {activeAssignment.studentSubmission.feedback}
              </p>
            </div>
          )}
        </div>

        {/* Interactive Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeAssignment.questions.map((q: AssignmentQuestion, index: number) => {
            const currentVal = userAnswers[q.id] || '';

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-[#292929] rounded-2xl p-6 border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#B83232] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      Q{index + 1}
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
                        {q.questionType} · {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.sourcePageRef && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] border border-[#E5DFD9] dark:border-[#3D3835]">
                        Page {q.sourcePageRef}
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                      [{q.marks} Marks]
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-[#292929] dark:text-[#F7F5F2] leading-relaxed">
                  {q.text}
                </p>

                {/* Input according to Question Type */}
                {q.questionType === 'MCQ' && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = currentVal === opt;
                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#B83232]/10 border-[#B83232] text-[#B83232] dark:bg-[#B83232]/20 dark:text-rose-200'
                              : 'border-[#E5DFD9] dark:border-[#3D3835] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={isSelected}
                            disabled={isSubmittedOrEvaluated}
                            onChange={() => handleAnswerChange(q.id, opt)}
                            className="text-[#B83232] focus:ring-[#B83232]"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.questionType === 'Short Answer' && (
                  <div className="space-y-1">
                    <textarea
                      rows={3}
                      value={currentVal as string}
                      disabled={isSubmittedOrEvaluated}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Type your concise, step-by-step academic answer..."
                      className="w-full text-xs p-3 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
                    />
                    {q.expectedKeywords && (
                      <p className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2]">
                        Expected concepts: {q.expectedKeywords.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {q.questionType === 'Long Answer' && (
                  <div className="space-y-1">
                    <textarea
                      rows={6}
                      value={currentVal as string}
                      disabled={isSubmittedOrEvaluated}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Provide full theoretical derivation, equations, or comparative analysis..."
                      className="w-full text-xs p-3 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232] font-sans"
                    />
                  </div>
                )}

                {q.questionType === 'Programming' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#795548] dark:text-[#F2C94C]">
                      <span className="flex items-center gap-1 font-mono">
                        <Code2 className="w-3.5 h-3.5" /> Python 3 Solution Script
                      </span>
                      <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">Tested in Python Lab</span>
                    </div>
                    <textarea
                      rows={7}
                      value={currentVal as string}
                      disabled={isSubmittedOrEvaluated}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      placeholder={`def solution():\n    # Write clean, optimized Python code here\n    pass`}
                      className="w-full text-xs p-3 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#1E1E1E] text-[#F7F5F2] font-mono focus:outline-hidden focus:ring-2 focus:ring-[#F2C94C]"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Submission Attachment & Actions */}
          {!isSubmittedOrEvaluated && (
            <div className="bg-white dark:bg-[#292929] rounded-2xl p-6 border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#B83232]" />
                Optional File Solution Upload (PDF, ZIP, IPYNB)
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={attachedFileName}
                  onChange={e => setAttachedFileName(e.target.value)}
                  placeholder={`e.g. ${studentName.replace(/\s+/g, '_')}_${studentId}_Solution.zip`}
                  className="flex-1 w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setAttachedFileName(
                      `${studentName.replace(/\s+/g, '_')}_Roll${studentRoll}_${activeAssignment.subjectCode}_Solution.pdf`
                    )
                  }
                  className="px-3 py-2 text-xs font-semibold bg-[#795548]/10 text-[#795548] dark:bg-[#795548]/30 dark:text-[#F2C94C] rounded-xl hover:bg-[#795548]/20 transition-colors whitespace-nowrap"
                >
                  Attach Standard Template
                </button>
              </div>

              {/* Status Notifications */}
              {isDraftSaved && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Draft saved successfully! You can resume anytime.
                </div>
              )}
              {submitSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Assignment submitted to Faculty Advisor {advisorName}.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 text-xs font-bold text-[#795548] dark:text-[#F7F5F2] bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] hover:bg-[#EFEBE9] rounded-xl transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#B83232] hover:bg-[#a02b2b] rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  Submit Assignment for Evaluation
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // Master Assignment List View
  return (
    <div className="space-y-6">
      {/* Assessment Workspace Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] w-fit">
        <button
          type="button"
          onClick={() => setCurrentPage('assignments')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#B83232] text-white"
        >
          Assignments
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage('examinations')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white"
        >
          Examinations
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage('coding-lab')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white"
        >
          Python Coding Lab
        </button>
      </div>

      {/* Header & Generator Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Continuous Academic Evaluation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight">
            MCA Semester 1 Assignments
          </h1>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">
            Student: <span className="font-bold text-[#292929] dark:text-white">{studentName}</span> (Roll: <span className="font-mono text-[#B83232] dark:text-[#F2C94C]">{studentRoll}</span>) · Advisor: <span className="font-bold text-[#795548] dark:text-[#F2C94C]">{advisorName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGeneratorModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#B83232] to-[#795548] text-white hover:opacity-95 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#F2C94C]" />
            <span>Generate Dynamic Assignment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <span className="text-xs font-medium text-[#6E6863] dark:text-[#BDB7B2]">Total Assignments</span>
          <div className="text-2xl font-extrabold text-[#292929] dark:text-[#F7F5F2] mt-1">{totalCount}</div>
          <span className="text-[10px] text-[#795548] dark:text-[#F2C94C]">All 4 MCA Subjects</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <span className="text-xs font-medium text-[#6E6863] dark:text-[#BDB7B2]">Pending Actions</span>
          <div className="text-2xl font-extrabold text-[#B83232] mt-1">{pendingCount}</div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">Due within next 14 days</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <span className="text-xs font-medium text-[#6E6863] dark:text-[#BDB7B2]">Evaluated</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{evaluatedCount}</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Advisor Verified</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
          <span className="text-xs font-medium text-[#6E6863] dark:text-[#BDB7B2]">Average Marks</span>
          <div className="text-2xl font-extrabold text-[#795548] dark:text-[#F2C94C] mt-1">{avgScore}/30</div>
          <span className="text-[10px] text-[#795548] dark:text-[#F2C94C]">Top 5% percentile</span>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#292929] p-3 rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835]">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'submitted', 'evaluated'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#B83232] text-white shadow-xs'
                  : 'text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-[#F7F5F2]'
              }`}
            >
              {tab === 'all' ? 'All Assignments' : tab}
            </button>
          ))}
        </div>

        {/* Subject dropdown filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#795548] dark:text-[#F2C94C]" />
          <select
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden font-medium"
          >
            <option value="all">All 4 Subjects</option>
            {allSubjects.map(s => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Cards Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-center space-y-3">
          <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
            No assignments match the selected filter criteria.
          </p>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
            Reset filters or generate a new PDF-grounded assignment.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedSubjectFilter('all');
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#B83232] hover:bg-[#9E2A2A] text-white transition-colors"
          >
            Show All Assignments
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map(asg => {
          const isEvaluated = asg.status === 'Evaluated';
          const isSubmitted = asg.status === 'Submitted';

          return (
            <div
              key={asg.id}
              className="bg-white dark:bg-[#292929] rounded-2xl p-5 border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs flex flex-col justify-between hover:border-[#B83232]/50 transition-all group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#795548]/10 text-[#795548] dark:bg-[#795548]/30 dark:text-[#F2C94C]">
                      {asg.subjectCode}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#6E6863] dark:text-[#BDB7B2] border border-[#E5DFD9] dark:border-[#3D3835]">
                      Unit {asg.unit}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isEvaluated
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : isSubmitted
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {asg.status}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2] group-hover:text-[#B83232] transition-colors line-clamp-1">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] line-clamp-2 mt-1">
                    {asg.topic} · Generated via {asg.generationMethod} ({asg.generatedBy})
                  </p>
                </div>

                {/* Source PDF Citation */}
                <div className="text-[11px] text-[#795548] dark:text-[#F2C94C] bg-[#F2C94C]/10 border border-[#F2C94C]/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Pages [{asg.sourcePageReferences.join(', ')}] from {asg.sourcePdfTitle}
                  </span>
                </div>

                {/* Meta stats */}
                <div className="flex items-center justify-between text-xs text-[#6E6863] dark:text-[#BDB7B2] pt-1 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#B83232]" /> Due: {asg.dueDate}
                  </span>
                  <span className="font-mono font-bold text-[#292929] dark:text-[#F7F5F2]">
                    {asg.questions.length} Questions · {asg.totalMarks} Marks
                  </span>
                </div>

                {/* Evaluated Marks Pill */}
                {isEvaluated && asg.studentSubmission && (
                  <div className="text-xs bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg text-emerald-800 dark:text-emerald-200 font-semibold flex items-center justify-between">
                    <span>Scored: {asg.studentSubmission.marksObtained}/{asg.totalMarks}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Advisor Feedback Recorded</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => handleOpenAssignment(asg)}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    isEvaluated
                      ? 'bg-[#795548]/10 text-[#795548] hover:bg-[#795548]/20 dark:bg-[#795548]/30 dark:text-[#F2C94C]'
                      : isSubmitted
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-200'
                      : 'bg-[#B83232] text-white hover:bg-[#a02b2b] shadow-xs'
                  }`}
                >
                  {isEvaluated ? (
                    <>
                      <FileCheck className="w-3.5 h-3.5" /> View Evaluated Submission & Feedback
                    </>
                  ) : isSubmitted ? (
                    <>
                      <FileCheck className="w-3.5 h-3.5" /> View Submitted Answers
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Start Assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Dynamic Assignment Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Curriculum System
                </span>
                <h2 className="text-xl font-extrabold text-[#292929] dark:text-[#F7F5F2] mt-0.5">
                  Generate Dynamic Assignment
                </h2>
                <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                  Instantly extracts questions from verified subject PDF knowledge bases.
                </p>
              </div>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="p-1 rounded-lg text-[#6E6863] hover:text-[#292929] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Subject Selection */}
              <div>
                <label className="font-bold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                  Target Subject
                </label>
                <select
                  value={genSubjectCode}
                  onChange={e => setGenSubjectCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] font-semibold"
                >
                  {allSubjects.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name} ({s.instructor})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5 Generation Methods */}
              <div>
                <label className="font-bold text-[#292929] dark:text-[#F7F5F2] block mb-1.5">
                  Generation Method (5 Pedagogical Modes)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'Topic-Based', desc: 'Focus on specific syllabus chapter' },
                      { id: 'Difficulty-Based', desc: 'Targeted easy, medium or hard' },
                      { id: 'Question-Type', desc: 'Specific MCQ, short, or code' },
                      { id: 'Randomized', desc: 'Diagnostic multi-topic sample' },
                      { id: 'Learning Outcome-Based', desc: 'Mapped to CO1-CO5 objectives' }
                    ] as const
                  ).map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setGenMethod(method.id as GenerationMethod)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        genMethod === method.id
                          ? 'border-[#B83232] bg-[#B83232]/10 dark:bg-[#B83232]/20 text-[#B83232] dark:text-rose-200'
                          : 'border-[#E5DFD9] dark:border-[#3D3835] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2]'
                      }`}
                    >
                      <div className="font-bold">{method.id}</div>
                      <div className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2]">{method.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Question Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={e => setGenDifficulty(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2]"
                  >
                    <option value="Easy">Easy (Conceptual)</option>
                    <option value="Medium">Medium (Analytical)</option>
                    <option value="Hard">Hard (Problem Solving)</option>
                    <option value="Mixed">Mixed (Standard Exam Model)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                    Target Format
                  </label>
                  <select
                    value={genQuestionType}
                    onChange={e => setGenQuestionType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2]"
                  >
                    <option value="Mixed">Mixed (MCQ + Short + Long)</option>
                    <option value="Programming">Programming & Lab Problem</option>
                    <option value="MCQ">Pure MCQ Diagnostic</option>
                    <option value="Theory">Theoretical Derivations</option>
                  </select>
                </div>
              </div>

              {/* Target Course Outcome */}
              <div>
                <label className="font-bold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                  Target Learning Outcome (CO Mapping)
                </label>
                <input
                  type="text"
                  value={genCO}
                  onChange={e => setGenCO(e.target.value)}
                  placeholder="e.g. CO2: Algorithmic Verification & Induction"
                  className="w-full p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2]"
                />
              </div>

              {/* Student Header Confirmation */}
              <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[11px] text-[#6E6863] dark:text-[#BDB7B2] flex items-center justify-between">
                <span>Assigned To: <strong>{studentName}</strong> (Roll: {studentRoll})</span>
                <span>Advisor: <strong>{advisorName}</strong></span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]">
              <button
                type="button"
                onClick={() => setShowGeneratorModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6E6863] hover:text-[#292929] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#B83232] hover:bg-[#a02b2b] rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Synthesizing Questions from PDF...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F2C94C]" />
                    Generate & Start Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
