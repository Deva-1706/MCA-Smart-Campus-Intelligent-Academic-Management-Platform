import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { INITIAL_SKILL_CRITERIA } from '../../data/smartCampusData';
import { SkillDNASkillKey } from '../../types';
import {
  Dna,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Plus,
  Info
} from 'lucide-react';

interface SkillDNAViewProps {
  mode?: 'student' | 'faculty';
}

export const SkillDNAView: React.FC<SkillDNAViewProps> = ({ mode = 'student' }) => {
  const {
    currentUser,
    skillEvidence,
    submitSkillEvidence,
    verifySkillEvidence,
    hasFacultyPermission,
    assignments,
    completedExamResults,
    verifiedCodingProblemIds,
  } = usePortal();

  const [selectedSkill, setSelectedSkill] = useState<SkillDNASkillKey>('Python');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<'Coding Lab' | 'Assignment' | 'Project'>('Coding Lab');
  const [sourceRef, setSourceRef] = useState('');
  const [scoreInputs, setScoreInputs] = useState<Record<string, number>>({});
  const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const canVerify = mode === 'faculty' && hasFacultyPermission('verify_skills');

  // Strict Skill DNA computation: Verified practical evidence + verified academic performance
  const skillScores = INITIAL_SKILL_CRITERIA.map(criterion => {
    const verifiedItems = skillEvidence.filter(
      e => e.skill === criterion.skill && e.status === 'Verified'
    );
    const pendingItems = skillEvidence.filter(
      e => e.skill === criterion.skill && e.status === 'Pending Review'
    );

    const autoProofScores: number[] = [];
    if (criterion.skill === 'Python' && verifiedCodingProblemIds.length > 0) {
      autoProofScores.push(Math.min(100, verifiedCodingProblemIds.length * 25));
    }

    const matchingSubjectCode =
      criterion.skill === 'Mathematics'
        ? '435C1A'
        : criterion.skill === 'Problem-solving'
        ? '435C1B'
        : criterion.skill === 'Database Management'
        ? '435E1A'
        : criterion.skill === 'Python'
        ? '435C1C'
        : null;

    if (matchingSubjectCode) {
      completedExamResults
        .filter(r => r.subjectCode === matchingSubjectCode && r.passed)
        .forEach(r => autoProofScores.push(r.percentage));

      assignments
        .filter(
          a =>
            a.subjectCode === matchingSubjectCode &&
            a.status === 'Evaluated' &&
            a.studentSubmission?.marksObtained !== undefined
        )
        .forEach(a =>
          autoProofScores.push(
            Math.round(((a.studentSubmission?.marksObtained || 0) / Math.max(1, a.totalMarks)) * 100)
          )
        );
    }

    const allProofScores = [...verifiedItems.map(i => i.levelScore), ...autoProofScores];
    const score =
      allProofScores.length > 0
        ? Math.min(100, Math.round(allProofScores.reduce((sum, val) => sum + val, 0) / allProofScores.length))
        : 0;

    return {
      ...criterion,
      score,
      verifiedCount: allProofScores.length,
      pendingCount: pendingItems.length,
    };
  });

  const overallDNAIndex = Math.round(
    skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length
  );

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim()) return;

    submitSkillEvidence({
      studentId: currentUser?.studentId || 'MCA2401',
      skill: selectedSkill,
      evidenceTitle: evidenceTitle.trim(),
      evidenceType,
      sourceRefId: sourceRef.trim() || `EV-${Date.now().toString().slice(-4)}`,
      levelScore: 75,
      remarks: 'Submitted by scholar for faculty practical evidence review.',
    });

    setEvidenceTitle('');
    setSourceRef('');
    setStatusFeedback(`Evidence submitted under ${selectedSkill}. Score stays unchanged until Faculty verification.`);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <Dna className="w-4 h-4" /> Evidence-Based Competency Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            Skill DNA — 9 Postgraduate Competencies
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            {mode === 'faculty'
              ? 'Audit student practical submissions and verify evidence against Skill DNA competency criteria.'
              : 'Dynamic competency fingerprint built exclusively from verified labs, assignments, projects, and challenges.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#292929] text-white border border-[#795548]/50 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#F2C94C] font-bold block">
              Verified DNA Index
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-white">
              {overallDNAIndex}%
            </span>
          </div>
          <ShieldCheck className="w-7 h-7 text-[#F2C94C]" />
        </div>
      </div>

      {/* Clear Purpose & Strict Verification Guide */}
      <div className="p-4 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#795548]/40 text-xs text-[#292929] dark:text-[#F7F5F2] space-y-1.5">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
          <div>
            <strong>How Skill DNA Works (Strict Verification Rule):</strong> Viewing study notes or scrolling lessons never auto-awards Skill DNA points. Competencies update strictly from verified Python Coding Lab runs, passed examinations, evaluated assignments, and faculty-verified Project Studio or practical evidence.
          </div>
        </div>
        {overallDNAIndex === 0 && (
          <p className="text-[11px] text-[#795548] dark:text-[#F2C94C] pl-6 font-semibold">
            Current Status: 0% Verified — Complete an assignment, exam, coding lab run, or submit practical evidence below to build your Skill DNA profile.
          </p>
        )}
      </div>

      {statusFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          {statusFeedback}
        </div>
      )}

      {/* 9-Skill Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {skillScores.map(item => (
          <div
            key={item.skill}
            className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]">
                  {item.category}
                </span>
                <h2 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                  {item.skill}
                </h2>
              </div>
              <span className="text-lg font-extrabold font-mono tabular-nums text-[#B83232] dark:text-[#F2C94C]">
                {item.score}%
              </span>
            </div>

            <div className="w-full h-2 bg-[#EFEBE9] dark:bg-[#1E1E1E] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B83232] dark:bg-[#F2C94C] rounded-full transition-all duration-500"
                style={{ width: `${item.score}%` }}
              />
            </div>

            <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] leading-snug">
              {item.description}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#795548] dark:text-[#BDB7B2] pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
              <span>{item.verifiedCount} verified proof(s)</span>
              {item.pendingCount > 0 && (
                <span className="text-[#B83232] dark:text-[#F2C94C] font-bold">
                  {item.pendingCount} pending review
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Evidence Form (Student Mode) */}
      {mode === 'student' && (
        <form
          onSubmit={handleSubmitEvidence}
          className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4"
        >
          <div>
            <h3 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
              Submit Practical Evidence for Faculty Verification
            </h3>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2]">
              Link completed lab scripts, project commits, or challenge outputs for advisor review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#292929] dark:text-[#F7F5F2]">
                Target Skill
              </label>
              <select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value as SkillDNASkillKey)}
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
              >
                {INITIAL_SKILL_CRITERIA.map(c => (
                  <option key={c.skill} value={c.skill}>
                    {c.skill}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#292929] dark:text-[#F7F5F2]">
                Evidence Source
              </label>
              <select
                value={evidenceType}
                onChange={e => setEvidenceType(e.target.value as any)}
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
              >
                <option value="Coding Lab">Coding Lab</option>
                <option value="Project">Project</option>
                <option value="Assignment">Assignment</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-[#292929] dark:text-[#F7F5F2]">
                Evidence Title & Deliverable
              </label>
              <input
                type="text"
                required
                value={evidenceTitle}
                onChange={e => setEvidenceTitle(e.target.value)}
                placeholder="e.g. Implemented Dijkstra min-heap solver with unit tests"
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <input
              type="text"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              placeholder="Optional reference ID or GitHub commit URL"
              className="flex-1 p-2.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#B83232] hover:bg-[#9E2A2A] text-white flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Evidence for Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Evidence Ledger */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
          Competency Evidence Ledger ({skillEvidence.length})
        </h3>

        <div className="space-y-3">
          {skillEvidence.map(ev => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#292929] text-[#F2C94C]">
                      {ev.skill}
                    </span>
                    <span className="text-[11px] font-semibold text-[#795548] dark:text-[#BDB7B2]">
                      {ev.evidenceType} · Ref: {ev.sourceRefId}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C]">
                      Score: {ev.levelScore}/100
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
                    {ev.evidenceTitle}
                  </p>
                  {ev.remarks && (
                    <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">{ev.remarks}</p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded border ${
                    ev.status === 'Verified'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : ev.status === 'Needs Improvement'
                      ? 'bg-rose-50 text-[#B83232] border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C]'
                  }`}
                >
                  {ev.status === 'Verified' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : ev.status === 'Needs Improvement' ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>{ev.status}</span>
                </span>
              </div>

              {canVerify && ev.status === 'Pending Review' && (
                <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scoreInputs[ev.id] ?? ev.levelScore}
                    onChange={e =>
                      setScoreInputs(prev => ({
                        ...prev,
                        [ev.id]: Math.min(100, Math.max(0, Number(e.target.value))),
                      }))
                    }
                    className="w-20 p-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] font-mono"
                    aria-label="Verification score"
                  />
                  <input
                    type="text"
                    value={remarkInputs[ev.id] ?? ''}
                    onChange={e =>
                      setRemarkInputs(prev => ({ ...prev, [ev.id]: e.target.value }))
                    }
                    placeholder="Faculty verification notes..."
                    className="flex-1 min-w-[180px] p-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      verifySkillEvidence(
                        ev.id,
                        'Verified',
                        scoreInputs[ev.id] ?? ev.levelScore,
                        remarkInputs[ev.id] || 'Verified by Faculty Coordinator HCASICAN.'
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                  >
                    Approve & Verify
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      verifySkillEvidence(
                        ev.id,
                        'Needs Improvement',
                        0,
                        remarkInputs[ev.id] || 'Requires stronger test proof before verification.'
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold"
                  >
                    Needs Improvement
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
