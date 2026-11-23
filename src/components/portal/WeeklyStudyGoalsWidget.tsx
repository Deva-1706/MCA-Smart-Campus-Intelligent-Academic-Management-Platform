import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  Target,
  Edit3,
  Check,
  RotateCcw,
  Play,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const WeeklyStudyGoalsWidget: React.FC = () => {
  const {
    allSubjects,
    weeklyGoalHoursBySubject,
    weeklyStudySecondsBySubject,
    weeklyGoalWeekLabel,
    setSubjectWeeklyGoalHours,
    resetWeeklyGoalsToDefault,
    logManualSubjectStudyMinutes,
    resetWeeklyStudyProgress,
    setActiveStudySubject,
    timerMode,
    switchTimerMode,
    isTimerRunning,
    toggleTimer,
  } = usePortal();

  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [draftTargets, setDraftTargets] = useState<Record<string, string>>({});
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const openEditor = () => {
    const initial: Record<string, string> = {};
    allSubjects.forEach(s => {
      initial[s.code] = String(weeklyGoalHoursBySubject[s.code] ?? 6);
    });
    setDraftTargets(initial);
    setIsEditingGoals(true);
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    allSubjects.forEach(s => {
      const parsed = parseFloat(draftTargets[s.code]);
      if (Number.isFinite(parsed) && parsed > 0) {
        setSubjectWeeklyGoalHours(s.code, parsed);
      }
    });
    setIsEditingGoals(false);
    setFeedbackNotice('Weekly subject study targets updated.');
    setTimeout(() => setFeedbackNotice(null), 2600);
  };

  const handleFocusSubject = (subjectCode: string) => {
    setActiveStudySubject(subjectCode);
    if (timerMode !== 'focus') {
      switchTimerMode('focus');
    }
    if (!isTimerRunning) {
      toggleTimer();
    }
    setFeedbackNotice(`Focused Pomodoro timer on ${subjectCode}.`);
    setTimeout(() => setFeedbackNotice(null), 2600);
  };

  const formatHoursMins = (seconds: number) => {
    const totalMins = Math.floor(seconds / 60);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const subjectRows = allSubjects.map(subject => {
    const targetHours = Math.max(0.5, weeklyGoalHoursBySubject[subject.code] ?? 6);
    const loggedSeconds = weeklyStudySecondsBySubject[subject.code] || 0;
    const loggedHours = loggedSeconds / 3600;
    const percentage = Math.min(100, Math.round((loggedHours / targetHours) * 100));
    const remainingSeconds = Math.max(0, Math.round(targetHours * 3600) - loggedSeconds);
    const completed = loggedHours >= targetHours;

    let statusLabel = 'Not Started';
    let barColor = 'bg-[#795548] dark:bg-[#A1887F]';
    let badgeClass = 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] border-[#E5DFD9] dark:border-[#3D3835]';

    if (completed) {
      statusLabel = 'Goal Achieved';
      barColor = 'bg-emerald-600 dark:bg-emerald-500';
      badgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    } else if (percentage >= 50) {
      statusLabel = 'On Track';
      barColor = 'bg-[#F2C94C]';
      badgeClass = 'bg-amber-50 dark:bg-amber-950/30 text-[#795548] dark:text-[#F2C94C] border-amber-200 dark:border-amber-800/60';
    } else if (loggedSeconds > 0) {
      statusLabel = 'In Progress';
      barColor = 'bg-[#B83232]';
      badgeClass = 'bg-rose-50 dark:bg-rose-950/30 text-[#B83232] dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
    }

    return {
      subject,
      targetHours,
      loggedSeconds,
      loggedHours,
      percentage,
      remainingSeconds,
      completed,
      statusLabel,
      barColor,
      badgeClass,
    };
  });

  const totalTargetHours = subjectRows.reduce((sum, r) => sum + r.targetHours, 0);
  const totalLoggedSeconds = subjectRows.reduce((sum, r) => sum + r.loggedSeconds, 0);
  const totalLoggedHours = totalLoggedSeconds / 3600;
  const overallPercentage =
    totalTargetHours > 0 ? Math.min(100, Math.round((totalLoggedHours / totalTargetHours) * 100)) : 0;
  const completedCount = subjectRows.filter(r => r.completed).length;

  return (
    <section
      aria-label="Weekly Subject Study Goals"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-2 border-t-[#B83232] shadow-xs space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
              <Target className="w-3.5 h-3.5" />
              Weekly Study Goals
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] border border-[#E5DFD9] dark:border-[#3D3835] tabular-nums">
              {weeklyGoalWeekLabel}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#292929] dark:text-[#F7F5F2]">
            Subject-Wise Target Learning Hours
          </h2>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
            Define weekly hour targets per MCA subject. Focus sessions tracked in Pomodoro Studio automatically credit toward each subject.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isEditingGoals ? (
            <button
              type="button"
              onClick={openEditor}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-[#292929] hover:bg-black text-[#F2C94C] dark:bg-[#1E1E1E] dark:hover:bg-black border border-[#795548]/50 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Targets</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingGoals(false)}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#BDB7B2] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              resetWeeklyStudyProgress();
              setFeedbackNotice('Weekly logged hours reset for a fresh start.');
              setTimeout(() => setFeedbackNotice(null), 2600);
            }}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#B83232] dark:hover:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835] transition-colors flex items-center gap-1"
            title="Reset logged hours for current week"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Week</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#795548]/40 text-xs font-semibold text-[#292929] dark:text-[#F2C94C] flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Overall Weekly Attainment Bar */}
      <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">
            <Clock className="w-4 h-4 text-[#B83232]" />
            <span>Overall Weekly Target Progress</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-[#6E6863] dark:text-[#BDB7B2]">
              {completedCount}/{subjectRows.length} Goals Met
            </span>
            <span className="font-extrabold text-[#292929] dark:text-[#F7F5F2]">
              {totalLoggedHours.toFixed(1)} / {totalTargetHours.toFixed(1)} hrs ({overallPercentage}%)
            </span>
          </div>
        </div>
        <div
          className="w-full h-2.5 rounded-full bg-[#E5DFD9] dark:bg-[#292929] overflow-hidden"
          role="progressbar"
          aria-valuenow={overallPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall weekly study goal attainment"
        >
          <div
            className="h-full rounded-full bg-[#B83232] transition-all duration-500"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Inline Goal Target Editor Form */}
      {isEditingGoals && (
        <form
          onSubmit={handleSaveGoals}
          className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#B83232]/40 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">
              Configure Weekly Target Hours (0.5 – 40 hrs per subject)
            </p>
            <button
              type="button"
              onClick={() => {
                resetWeeklyGoalsToDefault();
                setDraftTargets({ '435C1A': '6', '435C1B': '8', '435E1A': '5', '435C1C': '8' });
              }}
              className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
            >
              Restore Recommended Defaults
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {allSubjects.map(subj => (
              <label
                key={subj.code}
                className="block p-3 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1.5"
              >
                <span className="block font-mono text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C]">
                  {subj.code}
                </span>
                <span className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] truncate">
                  {subj.name}
                </span>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    min={0.5}
                    max={40}
                    step={0.5}
                    value={draftTargets[subj.code] ?? String(weeklyGoalHoursBySubject[subj.code] ?? 6)}
                    onChange={e =>
                      setDraftTargets(prev => ({
                        ...prev,
                        [subj.code]: e.target.value,
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs font-mono font-bold text-[#292929] dark:text-[#F7F5F2] tabular-nums"
                  />
                  <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] font-mono shrink-0">
                    hrs
                  </span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingGoals(false)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#6E6863] dark:text-[#BDB7B2] hover:bg-white dark:hover:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Weekly Targets</span>
            </button>
          </div>
        </form>
      )}

      {/* Subject-Wise Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectRows.map(row => (
          <div
            key={row.subject.code}
            className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 min-w-0"
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-[#292929] text-[#B83232] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835]">
                    {row.subject.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${row.badgeClass}`}>
                    {row.statusLabel}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                  {row.subject.name}
                </h3>
              </div>

              <div className="text-right shrink-0 font-mono tabular-nums">
                <p className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                  {row.percentage}%
                </p>
                <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
                  {row.loggedHours.toFixed(2)} / {row.targetHours.toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Subject Progress Bar */}
            <div
              className="w-full h-2 rounded-full bg-[#E5DFD9] dark:bg-[#292929] overflow-hidden"
              role="progressbar"
              aria-valuenow={row.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${row.subject.name} weekly study progress`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${row.barColor}`}
                style={{ width: `${row.percentage}%` }}
              />
            </div>

            {/* Footer Controls: Remaining Time, Quick Log & Focus Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
              <span className="text-[#6E6863] dark:text-[#BDB7B2] font-mono tabular-nums">
                {row.completed
                  ? `Completed (${formatHoursMins(row.loggedSeconds)} logged)`
                  : `${formatHoursMins(row.remainingSeconds)} left to target`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => logManualSubjectStudyMinutes(row.subject.code, 30)}
                  className="px-2 py-1 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548] text-[#292929] dark:text-[#F7F5F2] font-semibold transition-colors inline-flex items-center gap-1"
                  title={`Log 30 minutes of offline study for ${row.subject.code}`}
                >
                  <Plus className="w-3 h-3 text-[#795548] dark:text-[#F2C94C]" />
                  <span>30m</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFocusSubject(row.subject.code)}
                  className="px-2.5 py-1 rounded bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold transition-colors inline-flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Focus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
