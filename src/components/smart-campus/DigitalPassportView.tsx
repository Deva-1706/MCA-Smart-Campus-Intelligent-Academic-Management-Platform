import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  BadgeCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  Award,
  FolderKanban,
  Dna,
  Lock
} from 'lucide-react';

export const DigitalPassportView: React.FC = () => {
  const {
    currentUser,
    skillEvidence,
    projects,
    issuedCertificates,
    challengeAttempts,
    passportSettings,
    updatePassportSettings,
  } = usePortal();

  const [publicPreview, setPublicPreview] = useState(false);

  const verifiedSkills = skillEvidence.filter(e => e.status === 'Verified');
  const showcaseProjects = projects.filter(p => p.approvedForShowcase && p.status === 'Verified');
  const activeCertificates = issuedCertificates.filter(c => c.status === 'Issued');
  const passedChallenges = challengeAttempts.filter(c => c.passed);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4" /> Verified Academic Portfolio
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            Digital Academic Passport
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            Official MCA Smart Campus portfolio uniting verified competencies, showcase projects, and Admin certificates with granular privacy controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPublicPreview(prev => !prev)}
          className="px-4 py-2 rounded-xl bg-[#292929] hover:bg-black text-[#F2C94C] text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          {publicPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{publicPreview ? 'Exit Public Share Preview' : 'Preview Public Share View'}</span>
        </button>
      </div>

      {/* Privacy Governance Bar (Hidden in Public Preview to demonstrate enforcement) */}
      {!publicPreview && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#B83232]" />
              <span>Student-Controlled Visibility Preferences</span>
            </h2>
            <span className="text-[11px] font-mono text-[#795548] dark:text-[#BDB7B2]">
              Slug: {passportSettings.portfolioSlug}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Public Sharing</span>
              <input
                type="checkbox"
                checked={passportSettings.isPublicShareEnabled}
                onChange={e => updatePassportSettings({ isPublicShareEnabled: e.target.checked })}
              />
            </label>
            <label className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Show Skill DNA</span>
              <input
                type="checkbox"
                checked={passportSettings.showVerifiedSkills}
                onChange={e => updatePassportSettings({ showVerifiedSkills: e.target.checked })}
              />
            </label>
            <label className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Show Projects</span>
              <input
                type="checkbox"
                checked={passportSettings.showApprovedProjects}
                onChange={e => updatePassportSettings({ showApprovedProjects: e.target.checked })}
              />
            </label>
            <label className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Show Academic Marks</span>
              <input
                type="checkbox"
                checked={passportSettings.showAcademicMarks}
                onChange={e => updatePassportSettings({ showAcademicMarks: e.target.checked })}
              />
            </label>
          </div>
        </div>
      )}

      {/* Passport Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#292929] border-2 border-[#795548]/40 border-t-4 border-t-[#B83232] shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD9] dark:border-[#3D3835]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#292929] text-[#F2C94C] flex items-center justify-center font-extrabold text-2xl border border-[#795548]/50">
              {(currentUser?.name || 'D').charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B83232] dark:text-[#F2C94C]">
                MCA SMART CAMPUS · VERIFIED PASSPORT
              </p>
              <h2 className="text-xl font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                {currentUser?.name || 'Devanath N'}
              </h2>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-mono">
                {currentUser?.studentId || 'MCA2401'} · {currentUser?.batch || 'MCA 2024–2026'} · Advisor: {currentUser?.advisorName || 'HCASICAN'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Identity & Credentials Verified
            </span>
            {passportSettings.showAcademicMarks ? (
              <span className="font-mono font-extrabold text-[#B83232] dark:text-[#F2C94C] mt-1">
                SGPA: {(currentUser?.currentSGPA || 8.85).toFixed(2)}
              </span>
            ) : (
              <span className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-1">
                Private Academic Marks Hidden by Scholar
              </span>
            )}
          </div>
        </div>

        {/* Verified Skill DNA Badges */}
        {passportSettings.showVerifiedSkills && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2] flex items-center gap-1.5">
              <Dna className="w-4 h-4 text-[#B83232]" /> Faculty-Verified Skill DNA ({verifiedSkills.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {verifiedSkills.map(ev => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">{ev.skill}</span>
                    <span className="font-mono font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                      {ev.levelScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-1 line-clamp-2">
                    {ev.evidenceTitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Showcase Projects */}
        {passportSettings.showApprovedProjects && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2] flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-[#B83232]" /> Verified Showcase Projects ({showcaseProjects.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showcaseProjects.map(proj => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">{proj.subjectCode}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Verified Showcase</span>
                  </div>
                  <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">{proj.title}</p>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Issued Certificates & Challenge Milestones */}
        {passportSettings.showCertificates && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#B83232]" /> Institutional Certificates & Challenge Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeCertificates.map(cert => (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl bg-[#292929] text-white border border-[#795548]/50 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#F2C94C]">{cert.title}</p>
                    <p className="text-[11px] text-[#D7CCC8] font-mono mt-0.5">
                      Code: {cert.certificateCode} · Issued {cert.issuedAt}
                    </p>
                  </div>
                  <BadgeCheck className="w-5 h-5 text-[#F2C94C] shrink-0" />
                </div>
              ))}
              {passedChallenges.map(att => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#292929] dark:text-[#F7F5F2]">{att.challengeTitle}</p>
                    <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] font-mono">
                      Challenge Passed · {att.score}/{att.maxScore} pts
                    </p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
