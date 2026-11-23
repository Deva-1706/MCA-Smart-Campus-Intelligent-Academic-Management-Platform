import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { SEMESTER_SUBJECTS } from '../../data/academicData';
import { ShieldCheck, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, setSelectedSubject, allSubjects } = usePortal();

  const handleNav = (id: string) => {
    setCurrentPage(id as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubjectClick = (subj: typeof SEMESTER_SUBJECTS[0]) => {
    setSelectedSubject(subj);
    setCurrentPage('subjects');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sem1Subjects = allSubjects.filter(s => (s.semester ?? 1) === 1);

  return (
    <footer className="relative z-10 border-t-4 border-[#B83232] bg-[#292929] pt-12 pb-8 text-[#E5DFD9] text-sm">
      <div className="public-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-10">
          {/* Col 1: Brand Introduction */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B83232] text-[#F2C94C] font-extrabold text-xs tracking-wider shrink-0">
                MCA
              </div>
              <div>
                <span className="text-base font-extrabold text-white block">
                  MCA SMART CAMPUS
                </span>
                <span className="text-[11px] font-semibold text-[#F2C94C] block">
                  Beyond Academics. Built for Growth.
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-[#D7CCC8]">
              An academic-first postgraduate digital ecosystem unifying multi-semester MCA coursework, published faculty materials, Python coding laboratories, Skill DNA evidence tracking, and Project Studio evaluation.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-[#F2C94C]">
              <ShieldCheck className="w-4 h-4 text-[#F2C94C] shrink-0" />
              <span>Dedicated Admin, Faculty &amp; Student Role Architecture</span>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2C94C] mb-3.5">
              Campus Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D7CCC8]">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-[#F2C94C] transition-colors text-left">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-[#F2C94C] transition-colors text-left">
                  About Campus
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('subjects')} className="hover:text-[#F2C94C] transition-colors text-left">
                  MCA Subjects
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('features')} className="hover:text-[#F2C94C] transition-colors text-left">
                  Platform Features
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('how-it-works')} className="hover:text-[#F2C94C] transition-colors text-left">
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Semester 1 Core Courses */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2C94C] mb-3.5">
              Semester 1 Curriculum
            </h4>
            <ul className="space-y-2.5 text-xs">
              {sem1Subjects.map(subj => (
                <li key={subj.id}>
                  <button
                    onClick={() => handleSubjectClick(subj)}
                    className="w-full text-left text-[#D7CCC8] hover:text-[#F2C94C] transition-colors flex items-baseline gap-2 min-w-0"
                  >
                    <span className="font-mono text-[11px] text-[#F2C94C] font-bold shrink-0">{subj.code}</span>
                    <span className="truncate">{subj.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Academic Access & Department Info */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2C94C] mb-3.5">
              Campus Access &amp; FAQ
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D7CCC8]">
              <li>
                <button onClick={() => handleNav('login')} className="hover:text-[#F2C94C] transition-colors text-left">
                  Campus Login Portal
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('forgot-password')} className="hover:text-[#F2C94C] transition-colors text-left">
                  Reset Password (Email Verification)
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('faq')} className="hover:text-[#F2C94C] transition-colors text-left">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-[#3D3835] space-y-1.5 text-xs text-[#BDB7B2]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F2C94C] shrink-0" />
                <span>Department of Computer Applications</span>
              </div>
              <div className="text-[11px] text-[#D7CCC8] pt-1">
                Faculty Advisor: <span className="font-bold text-[#F2C94C]">HCASICAN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#3D3835] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#BDB7B2]">
          <p>© {new Date().getFullYear()} MCA SMART CAMPUS — Beyond Academics. Built for Growth.</p>
          <p className="text-[11px] text-[#BDB7B2]">
            Multi-Semester Postgraduate Academic &amp; Evaluation Ecosystem
          </p>
        </div>
      </div>
    </footer>
  );
};
