import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Award,
  CheckCircle2,
  Lock,
  Download,
  Code2,
  FileCheck2,
  BookOpen,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { AchievementItem } from '../../types';

export const AchievementsView: React.FC = () => {
  const { currentUser, achievements, setCurrentPage } = usePortal();
  const [filterCategory, setFilterCategory] = useState<'All' | AchievementItem['category']>('All');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  if (!currentUser) return null;

  const earnedAchievements = achievements.filter(a => a.earned);
  const filtered =
    filterCategory === 'All'
      ? achievements
      : achievements.filter(a => a.category === filterCategory);

  const handleDownloadCertificate = (ach: AchievementItem) => {
    if (!ach.earned || !ach.certificateEligible) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Outer Dark Gray & Gold Frame
    doc.setFillColor(247, 245, 242);
    doc.rect(0, 0, w, h, 'F');
    doc.setDrawColor(41, 41, 41);
    doc.setLineWidth(3);
    doc.rect(10, 10, w - 20, h - 20);
    doc.setDrawColor(184, 50, 50);
    doc.setLineWidth(1);
    doc.rect(14, 14, w - 28, h - 28);

    // Header Banner
    doc.setFillColor(41, 41, 41);
    doc.rect(14, 14, w - 28, 28, 'F');

    doc.setTextColor(242, 201, 76);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MCA SEMESTER 1 ACADEMIC ASSESSMENT & LEARNING PORTAL', w / 2, 25, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('CERTIFICATE OF VERIFIED ACADEMIC ACHIEVEMENT', w / 2, 36, { align: 'center' });

    // Body
    doc.setTextColor(121, 85, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('This is to certify that', w / 2, 62, { align: 'center' });

    doc.setTextColor(41, 41, 41);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text(currentUser.name, w / 2, 76, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(121, 85, 72);
    doc.text(
      `Student ID: ${currentUser.studentId}  |  Roll No: ${currentUser.rollNumber}  |  Batch: ${currentUser.batch}`,
      w / 2,
      86,
      { align: 'center' }
    );

    doc.setFontSize(12);
    doc.setTextColor(41, 41, 41);
    doc.text('has fulfilled all verified academic criteria for the milestone:', w / 2, 104, {
      align: 'center'
    });

    doc.setTextColor(184, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(ach.title, w / 2, 118, { align: 'center' });

    doc.setTextColor(80, 75, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(ach.description, w / 2, 130, { align: 'center', maxWidth: w - 70 });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 41, 41);
    doc.text(`Verified Evidence: ${ach.metricLabel}`, w / 2, 144, { align: 'center' });

    // Signatures
    doc.setDrawColor(180, 175, 170);
    doc.setLineWidth(0.4);
    doc.line(35, 172, 105, 172);
    doc.line(w - 105, 172, w - 35, 172);

    doc.setFontSize(10);
    doc.setTextColor(41, 41, 41);
    doc.text(`Faculty Advisor: ${currentUser.advisorName}`, 70, 179, { align: 'center' });
    doc.text(`Certificate ID: ${ach.certificateCode || ach.id}`, w - 70, 179, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(121, 85, 72);
    doc.text(
      `Issued Date: ${ach.earnedAt || new Date().toLocaleDateString()} · Authorized Portal Record`,
      w / 2,
      190,
      { align: 'center' }
    );

    const fileName = `${currentUser.studentId}_${ach.id}_Certificate.pdf`;
    doc.save(fileName);
    setDownloadNotice(`Downloaded authorized certificate: ${fileName}`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const categoryIcon = (cat: AchievementItem['category']) => {
    switch (cat) {
      case 'Coding Lab':
        return Code2;
      case 'Quiz & Exam':
        return FileCheck2;
      case 'Assignment':
        return ClipboardCheck;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Verified Academic Milestones
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Achievements &amp; Certificates
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            View earned achievements, coding lab milestones, quiz honors, and download authorized certificates.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#292929] text-white border border-[#795548]/40 flex items-center gap-3 shrink-0">
          <Award className="w-6 h-6 text-[#F2C94C]" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
              Earned / Total
            </div>
            <div className="text-lg font-extrabold font-mono text-[#F2C94C]">
              {earnedAchievements.length} / {achievements.length}
            </div>
          </div>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3 rounded-xl bg-[#292929] border border-[#F2C94C]/50 text-[#F2C94C] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Integrity Banner */}
      <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center gap-3 text-xs text-[#795548] dark:text-stone-300">
        <ShieldCheck className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
        <span>
          Certificates and badges are unlocked strictly from verified examination scores, evaluated assignments, completed syllabus units, and passing Python Coding Lab runs.
        </span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {(['All', 'Quiz & Exam', 'Assignment', 'Coding Lab', 'Curriculum'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              filterCategory === cat
                ? 'bg-[#B83232] border-[#B83232] text-white'
                : 'bg-white dark:bg-[#292929] border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-stone-300 hover:border-[#795548]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(ach => {
          const Icon = categoryIcon(ach.category);
          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                ach.earned
                  ? 'bg-white dark:bg-[#292929] border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs'
                  : 'bg-[#F7F5F2]/70 dark:bg-[#202020] border-stone-200 dark:border-stone-800 opacity-90'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ach.earned
                          ? 'bg-[#292929] text-[#F2C94C] border border-[#795548]/40'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-stone-400">
                        {ach.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#292929] dark:text-white">
                        {ach.title}
                      </h3>
                    </div>
                  </div>

                  {ach.earned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#292929] text-[#F2C94C] text-[10px] font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Earned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold shrink-0">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6E6863] dark:text-stone-300 leading-relaxed">
                  {ach.description}
                </p>

                <div className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between text-xs">
                  <span className="text-[#795548] dark:text-stone-400 font-medium">Progress / Record</span>
                  <span className="font-mono font-bold text-[#292929] dark:text-[#F2C94C]">
                    {ach.metricLabel}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-2">
                {ach.earned ? (
                  <>
                    <span className="text-[11px] font-mono text-[#795548] dark:text-stone-400">
                      {ach.certificateCode ? `ID: ${ach.certificateCode}` : 'Verified'}
                    </span>
                    {ach.certificateEligible && (
                      <button
                        onClick={() => handleDownloadCertificate(ach)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#F2C94C]" />
                        <span>Download Certificate</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-stone-500">Complete requirement to unlock certificate</span>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          ach.category === 'Coding Lab'
                            ? 'coding-lab'
                            : ach.category === 'Quiz & Exam'
                            ? 'examinations'
                            : ach.category === 'Assignment'
                            ? 'assignments'
                            : 'my-subjects'
                        )
                      }
                      className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
                    >
                      Go to Module →
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Achievement History Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-4">
        <h2 className="text-base font-extrabold text-[#292929] dark:text-white">
          Verified Achievement History
        </h2>
        {earnedAchievements.length === 0 ? (
          <p className="text-xs text-[#795548] dark:text-stone-400">
            No achievements earned yet. Complete examinations, assignments, or coding lab exercises to earn verified records.
          </p>
        ) : (
          <div className="space-y-2">
            {earnedAchievements.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#292929] dark:text-white">{item.title}</span>
                  <span className="text-[#795548] dark:text-stone-400 ml-2">({item.category})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[#B83232] dark:text-[#F2C94C] font-bold">{item.metricLabel}</span>
                  {item.earnedAt && <span className="text-stone-500">{item.earnedAt}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
