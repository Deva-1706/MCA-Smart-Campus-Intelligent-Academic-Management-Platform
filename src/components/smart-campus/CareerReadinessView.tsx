import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { INITIAL_CAREER_QUESTIONS, JOB_ROLE_BENCHMARKS } from '../../data/smartCampusData';
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';

export const CareerReadinessView: React.FC = () => {
  const { currentUser, skillEvidence, projects, issuedCertificates } = usePortal();

  const [selectedTrack, setSelectedTrack] = useState<string>('All');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>(JOB_ROLE_BENCHMARKS[0].id);

  // Compute verified Skill DNA scores cleanly
  const getVerifiedSkillScore = (skillName: string) => {
    const items = skillEvidence.filter(e => e.skill === skillName && e.status === 'Verified');
    if (items.length === 0) return 0;
    return Math.min(100, Math.round(items.reduce((s, i) => s + i.levelScore, 0) / items.length));
  };

  const tracks = ['All', 'Python Interview', 'DSA Interview', 'Aptitude & Reasoning', 'Verbal & Communication'];
  const filteredQuestions =
    selectedTrack === 'All'
      ? INITIAL_CAREER_QUESTIONS
      : INITIAL_CAREER_QUESTIONS.filter(q => q.track === selectedTrack);

  const activeBenchmark =
    JOB_ROLE_BENCHMARKS.find(r => r.id === selectedRoleId) || JOB_ROLE_BENCHMARKS[0];

  const verifiedProjects = projects.filter(p => p.status === 'Verified');

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" /> Career Preparation & Skill-Gap Lab
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
          Career Readiness Lab
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
          Structured interview tracks, verified project resume synthesis, and Skill DNA gap comparison against target roles.
        </p>
      </div>

      {/* Explicit Governance Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-[#292929] text-[#F7F5F2] border border-[#795548]/50 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#F2C94C] shrink-0 mt-0.5" />
        <span>
          <strong>Practice Readiness Notice:</strong> Modules in the Career Readiness Lab measure interview practice readiness against verified Skill DNA evidence. They remain completely separate from official university exam grading and do not guarantee employer hiring outcomes.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Practice Interview Tracks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Interview Practice Sets
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {tracks.map(track => (
                  <button
                    key={track}
                    onClick={() => setSelectedTrack(track)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      selectedTrack === track
                        ? 'bg-[#B83232] text-white'
                        : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2]'
                    }`}
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredQuestions.map(q => {
                const isOpen = !!revealedIds[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">
                        {q.track} · {q.relatedSkill}
                      </span>
                      <span className="font-mono text-[#795548] dark:text-[#BDB7B2]">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
                      {q.question}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRevealedIds(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
                    >
                      {isOpen ? 'Hide Key Answer Rubric' : 'Reveal Key Answer Points'}
                    </button>

                    {isOpen && (
                      <ul className="pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835] space-y-1 text-xs text-[#292929] dark:text-[#D7CCC8]">
                        {q.keyAnswerPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Job Role Skill-Gap Analyzer & Portfolio Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Job Role Skill-Gap Analyzer
              </h2>
              <Sparkles className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
            </div>

            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              className="w-full p-2.5 rounded-lg text-xs font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
            >
              {JOB_ROLE_BENCHMARKS.map(role => (
                <option key={role.id} value={role.id}>
                  {role.roleTitle}
                </option>
              ))}
            </select>

            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">{activeBenchmark.description}</p>

            <div className="space-y-3">
              {activeBenchmark.requiredSkills.map(req => {
                const current = getVerifiedSkillScore(req.skill);
                const gap = Math.max(0, req.targetScore - current);
                return (
                  <div key={req.skill} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">{req.skill}</span>
                      <span className="font-mono tabular-nums text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                        {current}% vs Target {req.targetScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#EFEBE9] dark:bg-[#1E1E1E] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${gap === 0 ? 'bg-emerald-600' : 'bg-[#B83232]'}`}
                        style={{ width: `${current}%` }}
                      />
                    </div>
                    {gap > 0 && (
                      <p className="text-[10px] text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3 h-3" /> +{gap}% verified evidence needed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resume Portfolio Snapshot */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
              <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Verified Portfolio Resume Summary
              </h2>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2 text-xs">
              <p className="font-extrabold text-sm text-[#292929] dark:text-[#F7F5F2]">
                {currentUser?.name || 'MCA Scholar'} · {currentUser?.program || 'Master of Computer Applications'}
              </p>
              <p className="text-[#795548] dark:text-[#BDB7B2]">
                Advisor: {currentUser?.advisorName || 'HCASICAN'} · Verified Projects: {verifiedProjects.length} · Campus Certificates: {issuedCertificates.filter(c => c.status === 'Issued').length}
              </p>
              {verifiedProjects.map(p => (
                <div key={p.id} className="pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                  <p className="font-bold text-[#292929] dark:text-[#F7F5F2]">{p.title}</p>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">{p.contributions}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
