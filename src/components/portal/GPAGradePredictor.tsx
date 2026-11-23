import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Sparkles,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BookOpen,
  Sliders,
  Info,
  CheckCircle2
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { SubjectReportRow } from '../../utils/exportAnalyticsPdf';

interface GradeScaleItem {
  minPercent: number;
  grade: string;
  points: number;
  label: string;
}

const GRADE_SCALE: GradeScaleItem[] = [
  { minPercent: 90, grade: 'O', points: 10, label: 'Outstanding' },
  { minPercent: 80, grade: 'A+', points: 9, label: 'Excellent' },
  { minPercent: 70, grade: 'A', points: 8, label: 'Very Good' },
  { minPercent: 60, grade: 'B+', points: 7, label: 'Good' },
  { minPercent: 50, grade: 'B', points: 6, label: 'Above Average' },
  { minPercent: 40, grade: 'C', points: 5, label: 'Pass' },
  { minPercent: 0, grade: 'F', points: 0, label: 'Re-appear' }
];

const BASELINE_COURSE_ESTIMATES: Record<string, number> = {
  '435C1A': 88,
  '435C1B': 76,
  '435E1A': 85,
  '435C1C': 90
};

function getGradeFromScore(score: number): GradeScaleItem {
  const rounded = Math.round(score);
  return GRADE_SCALE.find(item => rounded >= item.minPercent) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

export const GPAGradePredictor: React.FC<{
  onProjectedSGPAChange?: (sgpa: number) => void;
  onSubjectRowsChange?: (rows: SubjectReportRow[]) => void;
}> = ({ onProjectedSGPAChange, onSubjectRowsChange }) => {
  const {
    currentUser,
    allSubjects,
    assignments,
    completedExamResults,
    getSubjectProgress
  } = usePortal();

  const [internalWeight, setInternalWeight] = useState<number>(40); // 40% Internal (Assignments + Mid-Sem), 60% End-Sem Exam
  const [showScaleLegend, setShowScaleLegend] = useState<boolean>(false);

  // Build live per-subject telemetry from actual assignments & exam scores
  const subjectData = useMemo(() => {
    return allSubjects.map(subject => {
      const subjectAssignments = assignments.filter(a => a.subjectCode === subject.code);
      const evaluatedAssignments = subjectAssignments.filter(
        a => a.status === 'Evaluated' && a.studentSubmission?.marksObtained !== undefined
      );
      const submittedPendingCount = subjectAssignments.filter(a => a.status === 'Submitted').length;

      const assignmentAvg =
        evaluatedAssignments.length > 0
          ? evaluatedAssignments.reduce(
              (sum, a) => sum + ((a.studentSubmission?.marksObtained || 0) / a.totalMarks) * 100,
              0
            ) / evaluatedAssignments.length
          : null;

      const subjectExams = completedExamResults.filter(r => r.subjectCode === subject.code);
      const examAvg =
        subjectExams.length > 0
          ? subjectExams.reduce((sum, r) => sum + r.percentage, 0) / subjectExams.length
          : null;

      const syllabusProgress = getSubjectProgress(subject.code);

      // Compute current internal standing from real scores where available
      let currentScore: number;
      let scoreSourceLabel: string;

      if (assignmentAvg !== null && examAvg !== null) {
        currentScore = assignmentAvg * 0.45 + examAvg * 0.55;
        scoreSourceLabel = `${evaluatedAssignments.length} Assignment(s) + ${subjectExams.length} Exam(s)`;
      } else if (examAvg !== null) {
        currentScore = examAvg;
        scoreSourceLabel = `${subjectExams.length} Graded Exam(s)`;
      } else if (assignmentAvg !== null) {
        currentScore = assignmentAvg;
        scoreSourceLabel = `${evaluatedAssignments.length} Graded Assignment(s)`;
      } else {
        // Blend baseline estimate with syllabus mastery progress
        const baseline = BASELINE_COURSE_ESTIMATES[subject.code] ?? 80;
        currentScore = Math.round(baseline * 0.7 + syllabusProgress.percentage * 0.3);
        scoreSourceLabel =
          submittedPendingCount > 0
            ? `${submittedPendingCount} Submitted (Pending) · Progress Estimate`
            : 'Syllabus & Lab Progress Estimate';
      }

      return {
        subject,
        assignmentAvg: assignmentAvg !== null ? Math.round(assignmentAvg) : null,
        examAvg: examAvg !== null ? Math.round(examAvg) : null,
        evaluatedCount: evaluatedAssignments.length,
        examCount: subjectExams.length,
        submittedPendingCount,
        currentScore: Math.min(100, Math.max(0, Math.round(currentScore))),
        scoreSourceLabel
      };
    });
  }, [allSubjects, assignments, completedExamResults, getSubjectProgress]);

  // User-adjustable projected End-Semester exam score (%) per subject
  const [projectedEndSemScores, setProjectedEndSemScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    subjectData.forEach(item => {
      initial[item.subject.code] = item.currentScore;
    });
    return initial;
  });

  // Sync newly added scores if student completes an exam/assignment during session
  useEffect(() => {
    setProjectedEndSemScores(prev => {
      const next = { ...prev };
      subjectData.forEach(item => {
        if (next[item.subject.code] === undefined) {
          next[item.subject.code] = item.currentScore;
        }
      });
      return next;
    });
  }, [subjectData]);

  const predictions = useMemo(() => {
    const endSemWeight = 100 - internalWeight;

    const rows = subjectData.map(item => {
      const endSemScore = projectedEndSemScores[item.subject.code] ?? item.currentScore;
      const finalPercentage = Math.round(
        (item.currentScore * internalWeight + endSemScore * endSemWeight) / 100
      );
      const gradeInfo = getGradeFromScore(finalPercentage);
      const weightedPoints = gradeInfo.points * item.subject.credits;

      // Calculate points needed for next grade tier
      const currentTierIdx = GRADE_SCALE.findIndex(g => g.grade === gradeInfo.grade);
      const nextHigherTier = currentTierIdx > 0 ? GRADE_SCALE[currentTierIdx - 1] : null;
      const sgpaBoostIfNextTier = nextHigherTier
        ? ((nextHigherTier.points - gradeInfo.points) * item.subject.credits) /
          allSubjects.reduce((s, sub) => s + sub.credits, 0)
        : 0;

      return {
        ...item,
        endSemScore,
        finalPercentage,
        gradeInfo,
        weightedPoints,
        nextHigherTier,
        sgpaBoostIfNextTier
      };
    });

    const totalCredits = rows.reduce((sum, r) => sum + r.subject.credits, 0);
    const totalWeightedPoints = rows.reduce((sum, r) => sum + r.weightedPoints, 0);
    const predictedSGPA = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
    const avgPercentage =
      rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + r.finalPercentage, 0) / rows.length)
        : 0;

    return {
      rows,
      totalCredits,
      totalWeightedPoints,
      predictedSGPA,
      avgPercentage
    };
  }, [subjectData, projectedEndSemScores, internalWeight, allSubjects]);

  useEffect(() => {
    onProjectedSGPAChange?.(Number(predictions.predictedSGPA.toFixed(2)));
    onSubjectRowsChange?.(
      predictions.rows.map(r => ({
        code: r.subject.code,
        name: r.subject.name,
        credits: r.subject.credits,
        completedUnits: r.subject.completedModules,
        totalUnits: r.subject.totalModules,
        assignmentAvg: r.assignmentAvg,
        examAvg: r.examAvg,
        internalScore: r.currentScore,
        projectedFinalPercent: r.finalPercentage,
        grade: r.gradeInfo.grade,
        gradePoints: r.gradeInfo.points
      }))
    );
  }, [predictions, onProjectedSGPAChange, onSubjectRowsChange]);

  const handleSliderChange = (code: string, value: number) => {
    setProjectedEndSemScores(prev => ({
      ...prev,
      [code]: Math.min(100, Math.max(0, value))
    }));
  };

  const applyScenarioPreset = (scenario: 'pace' | 'target' | 'conservative') => {
    const updated: Record<string, number> = {};
    subjectData.forEach(item => {
      if (scenario === 'pace') {
        updated[item.subject.code] = item.currentScore;
      } else if (scenario === 'target') {
        updated[item.subject.code] = Math.min(98, Math.max(85, item.currentScore + 6));
      } else {
        updated[item.subject.code] = Math.max(45, item.currentScore - 8);
      }
    });
    setProjectedEndSemScores(updated);
  };

  const currentSGPA = currentUser?.currentSGPA ?? 8.85;
  const targetSGPA = currentUser?.targetSGPA ?? 9.20;
  const deltaFromCurrent = predictions.predictedSGPA - currentSGPA;
  const deltaFromTarget = predictions.predictedSGPA - targetSGPA;

  const academicStanding =
    predictions.predictedSGPA >= 9.0
      ? 'First Class with Distinction · Merit List'
      : predictions.predictedSGPA >= 7.5
      ? 'First Class with Distinction'
      : predictions.predictedSGPA >= 6.5
      ? 'First Class'
      : predictions.predictedSGPA >= 5.0
      ? 'Second Class'
      : 'Academic Review Needed';

  // Find highest-impact improvement opportunity
  const topRecommendation = useMemo(() => {
    const upgradable = predictions.rows
      .filter(r => r.nextHigherTier !== null && r.sgpaBoostIfNextTier > 0)
      .sort((a, b) => b.sgpaBoostIfNextTier - a.sgpaBoostIfNextTier);
    return upgradable[0] || null;
  }, [predictions.rows]);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-[#292929] text-[#F7F5F2] border-b border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#B83232] text-white text-[10px] font-bold uppercase tracking-wider">
                <Calculator className="w-3 h-3" />
                End-Semester Forecast
              </span>
              <span className="text-[11px] font-mono text-[#F2C94C]">
                MCA Semester 1 · {predictions.totalCredits} Credits
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Interactive GPA &amp; Grade Predictor
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Combines your live assignment evaluations and exam scores with simulated end-semester exam targets to estimate final course grades and Semester 1 SGPA.
            </p>
          </div>

          {/* Predicted SGPA Hero Box */}
          <div className="flex items-center gap-5 p-4 sm:p-5 rounded-2xl bg-black/30 border border-[#795548]/50 shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Predicted SGPA
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F2C94C]">
                  {predictions.predictedSGPA.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-stone-400">/ 10.0</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold">
                {deltaFromCurrent >= 0 ? (
                  <span className="text-[#F2C94C] flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{deltaFromCurrent.toFixed(2)} vs current ({currentSGPA.toFixed(2)})
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {deltaFromCurrent.toFixed(2)} vs current ({currentSGPA.toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            <div className="h-12 w-px bg-white/10 hidden sm:block" />

            <div className="hidden sm:block space-y-1">
              <div className="text-[11px] text-stone-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#F2C94C]" />
                <span>Target: {targetSGPA.toFixed(2)}</span>
              </div>
              <div className="text-[11px] font-semibold">
                {deltaFromTarget >= 0 ? (
                  <span className="text-[#F2C94C] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Target Achieved!
                  </span>
                ) : (
                  <span className="text-stone-400">
                    {Math.abs(deltaFromTarget).toFixed(2)} pts below target
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-[#F2C94C]/90 pt-0.5">
                {academicStanding}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Controls & Weighting Toolbar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-stone-400 mr-1">What-If Scenarios:</span>
            <button
              type="button"
              onClick={() => applyScenarioPreset('pace')}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-[#F2C94C]" />
              <span>Match Current Pace</span>
            </button>
            <button
              type="button"
              onClick={() => applyScenarioPreset('target')}
              className="px-3 py-1.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-[#F2C94C]" />
              <span>High-Effort Push (+6%)</span>
            </button>
            <button
              type="button"
              onClick={() => applyScenarioPreset('conservative')}
              className="px-3 py-1.5 rounded-lg bg-[#795548]/60 hover:bg-[#795548] text-white text-xs font-semibold transition-colors"
            >
              Conservative (-8%)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
              <Sliders className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span className="text-stone-300 text-[11px]">Weighting:</span>
              <select
                value={internalWeight}
                onChange={e => setInternalWeight(Number(e.target.value))}
                className="bg-transparent text-[#F2C94C] font-mono font-bold text-xs focus:outline-hidden cursor-pointer"
                aria-label="Internal vs End-Semester Weighting"
              >
                <option value={40} className="bg-[#292929] text-white">40% Internal / 60% End-Sem</option>
                <option value={50} className="bg-[#292929] text-white">50% Internal / 50% End-Sem</option>
                <option value={30} className="bg-[#292929] text-white">30% Internal / 70% End-Sem</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowScaleLegend(prev => !prev)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>{showScaleLegend ? 'Hide Grade Scale' : '10-Pt Scale'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible 10-Point Grade Legend */}
        {showScaleLegend && (
          <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {GRADE_SCALE.map(tier => (
              <div
                key={tier.grade}
                className="p-2 rounded-lg bg-[#292929] border border-white/10 text-center"
              >
                <div className="text-sm font-extrabold font-mono text-[#F2C94C]">
                  {tier.grade} <span className="text-xs text-stone-400">({tier.points})</span>
                </div>
                <div className="text-[10px] text-stone-300 font-medium">{tier.minPercent}%+</div>
                <div className="text-[10px] text-stone-400 truncate">{tier.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subject-by-Subject Prediction Rows */}
      <div className="p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {predictions.rows.map(row => {
            const isTopGrade = row.gradeInfo.points >= 9;
            return (
              <div
                key={row.subject.code}
                className="p-5 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 space-y-4"
              >
                {/* Row Top: Subject Info & Predicted Grade Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#292929] text-[#F2C94C] font-mono text-[10px] font-bold">
                        {row.subject.code}
                      </span>
                      <span className="text-[11px] font-semibold text-[#795548] dark:text-stone-400">
                        {row.subject.credits} Credits · {row.subject.type}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#292929] dark:text-white truncate">
                      {row.subject.name}
                    </h3>
                    <p className="text-[11px] text-[#795548] dark:text-stone-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 shrink-0 text-[#B83232] dark:text-[#F2C94C]" />
                      <span>Source: {row.scoreSourceLabel}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono ${
                        isTopGrade
                          ? 'bg-[#292929] border-[#F2C94C]/50 text-[#F2C94C]'
                          : row.gradeInfo.points >= 7
                          ? 'bg-white dark:bg-stone-900 border-[#795548]/40 text-[#292929] dark:text-white'
                          : 'bg-rose-50 dark:bg-rose-950/30 border-[#B83232]/40 text-[#B83232] dark:text-rose-300'
                      }`}
                    >
                      <span className="text-lg font-extrabold">{row.gradeInfo.grade}</span>
                      <span className="text-[11px] opacity-80">({row.gradeInfo.points} GP)</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-[#292929] dark:text-stone-300 mt-1">
                      Final Est: {row.finalPercentage}%
                    </div>
                  </div>
                </div>

                {/* Live Assessment Pills */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] uppercase tracking-wider text-[#795548] dark:text-stone-400 block">
                      Assignments
                    </span>
                    <span className="text-xs font-mono font-bold text-[#292929] dark:text-white">
                      {row.assignmentAvg !== null ? `${row.assignmentAvg}%` : 'Pending'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] uppercase tracking-wider text-[#795548] dark:text-stone-400 block">
                      Exams / Quizzes
                    </span>
                    <span className="text-xs font-mono font-bold text-[#292929] dark:text-white">
                      {row.examAvg !== null ? `${row.examAvg}%` : 'Pending'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-700">
                    <span className="text-[10px] uppercase tracking-wider text-[#795548] dark:text-stone-400 block">
                      Internal ({internalWeight}%)
                    </span>
                    <span className="text-xs font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {row.currentScore}%
                    </span>
                  </div>
                </div>

                {/* Interactive End-Sem Exam Target Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`slider-${row.subject.code}`}
                      className="font-semibold text-[#292929] dark:text-stone-200"
                    >
                      Projected End-Semester Exam ({100 - internalWeight}% weight)
                    </label>
                    <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {row.endSemScore}%
                    </span>
                  </div>
                  <input
                    id={`slider-${row.subject.code}`}
                    type="range"
                    min={0}
                    max={100}
                    value={row.endSemScore}
                    onChange={e => handleSliderChange(row.subject.code, Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-stone-300 dark:bg-stone-700 accent-[#B83232]"
                  />
                  <div className="flex items-center justify-between text-[10px] text-[#795548] dark:text-stone-400">
                    <span>Credit Points: {row.weightedPoints}/{row.subject.credits * 10}</span>
                    {row.nextHigherTier ? (
                      <span>
                        Need <strong className="text-[#292929] dark:text-stone-200">{row.nextHigherTier.minPercent}%</strong> total for{' '}
                        <strong className="text-[#B83232] dark:text-[#F2C94C]">{row.nextHigherTier.grade}</strong> (+{row.sgpaBoostIfNextTier.toFixed(2)} SGPA)
                      </span>
                    ) : (
                      <span className="text-[#B83232] dark:text-[#F2C94C] font-semibold">
                        Maximum Grade Tier (O) Projected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary & Strategic Recommendation Footer */}
        <div className="p-4 rounded-xl bg-[#292929] text-[#F7F5F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#795548]/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#B83232]/20 border border-[#B83232]/40 text-[#F2C94C] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-white">
                {topRecommendation
                  ? `Highest SGPA Leverage: ${topRecommendation.subject.code} (${topRecommendation.subject.name})`
                  : 'Optimal Grade Trajectory Across All Courses'}
              </p>
              <p className="text-stone-300">
                {topRecommendation && topRecommendation.nextHigherTier
                  ? `Reaching ${topRecommendation.nextHigherTier.minPercent}% overall in ${topRecommendation.subject.name} (${topRecommendation.subject.credits} credits) lifts your grade to ${topRecommendation.nextHigherTier.grade} and raises projected SGPA by +${topRecommendation.sgpaBoostIfNextTier.toFixed(2)}.`
                  : `You are currently projected at ${predictions.avgPercentage}% average across all ${predictions.totalCredits} Semester 1 credits.`}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 font-mono">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">Total Grade Points</div>
            <div className="text-base font-extrabold text-[#F2C94C]">
              {predictions.totalWeightedPoints} / {predictions.totalCredits * 10}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
