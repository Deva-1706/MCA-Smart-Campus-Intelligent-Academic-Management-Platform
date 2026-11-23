import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  Volume2,
  VolumeX,
  BookOpen,
  Terminal,
  Target,
  Layers,
  FileSpreadsheet,
  FolderArchive,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { usePortal, TimerMode } from '../../context/PortalContext';
import { SEMESTER_SUBJECTS } from '../../data/academicData';
import { PageId, StudyResourceKey } from '../../types';

interface ResourceMeta {
  key: StudyResourceKey;
  label: string;
  shortLabel: string;
  page: PageId;
  icon: React.ElementType;
  barColor: string;
}

const ACADEMIC_RESOURCES: ResourceMeta[] = [
  {
    key: 'study-notes',
    label: 'Study Notes & PDFs',
    shortLabel: 'Notes & PDFs',
    page: 'materials',
    icon: FolderArchive,
    barColor: 'bg-[#B83232]',
  },
  {
    key: 'coding-lab',
    label: 'Python Coding Lab',
    shortLabel: 'Python Lab',
    page: 'coding-lab',
    icon: Terminal,
    barColor: 'bg-[#F2C94C]',
  },
  {
    key: 'practice-arena',
    label: 'Practice Arena',
    shortLabel: 'Practice',
    page: 'practice-arena',
    icon: Target,
    barColor: 'bg-[#795548]',
  },
  {
    key: 'flashcards',
    label: 'AI Flashcards',
    shortLabel: 'Flashcards',
    page: 'flashcards',
    icon: Layers,
    barColor: 'bg-[#B83232]',
  },
  {
    key: 'assignments',
    label: 'Assignments & Exams',
    shortLabel: 'Assessments',
    page: 'assignments',
    icon: FileSpreadsheet,
    barColor: 'bg-[#795548]',
  },
  {
    key: 'subjects',
    label: 'Core Subject Modules',
    shortLabel: 'Subjects',
    page: 'my-subjects',
    icon: BookOpen,
    barColor: 'bg-[#292929] dark:bg-[#F2C94C]',
  },
];

const FOCUS_PRESETS = [15, 25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDurationHuman = (totalSeconds: number) => {
  if (totalSeconds <= 0) return '0m';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  return `${secs}s`;
};

export const DashboardPomodoroWidget: React.FC = () => {
  const {
    timerMode,
    timerDurations,
    timerTimeLeft,
    isTimerRunning,
    completedFocusSessions,
    timerSoundEnabled,
    timerHasCompleted,
    activeStudyResource,
    activeStudySubject,
    autoTrackStudyResource,
    learningTimeByResource,
    studySessionLogs,
    setActiveStudyResource,
    setActiveStudySubject,
    setAutoTrackStudyResource,
    toggleTimer,
    resetTimer,
    switchTimerMode,
    setCustomIntervalMinutes,
    toggleTimerSound,
    dismissTimerCompletion,
    logCurrentStudySegment,
    completeAndSummarizeSession,
    resetLearningTimeStats,
    setCurrentPage,
  } = usePortal();

  const [showLogs, setShowLogs] = useState(false);

  const currentDuration = timerDurations[timerMode] || 1;
  const progressRatio = Math.min(1, Math.max(0, (currentDuration - timerTimeLeft) / currentDuration));
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference * (1 - progressRatio);

  const totalActiveSeconds = Object.values(learningTimeByResource).reduce((acc, s) => acc + s, 0);
  const activeResourceMeta =
    ACADEMIC_RESOURCES.find(r => r.key === activeStudyResource) || ACADEMIC_RESOURCES[0];

  const handleLaunchStudyResource = () => {
    if (!isTimerRunning) {
      if (timerMode !== 'focus') {
        switchTimerMode('focus');
      }
      toggleTimer();
    }
    setCurrentPage(activeResourceMeta.page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const presets = timerMode === 'focus' ? FOCUS_PRESETS : BREAK_PRESETS;
  const currentModeMinutes = Math.round(timerDurations[timerMode] / 60);

  return (
    <section
      aria-label="Pomodoro Study Timer & Active Learning Tracker"
      className="rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs overflow-hidden"
    >
      {/* Top Strip */}
      <div className="px-5 py-4 bg-[#F7F5F2] dark:bg-[#1E1E1E] border-b border-[#E5DFD9] dark:border-[#3D3835] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#292929] text-[#F2C94C] flex items-center justify-center border border-[#795548]/40 shrink-0">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Pomodoro Study Studio & Active Learning Tracker
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  isTimerRunning
                    ? 'bg-[#B83232] text-white'
                    : 'bg-white dark:bg-[#292929] text-[#795548] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isTimerRunning ? 'bg-[#F2C94C] animate-pulse' : 'bg-[#795548]'
                  }`}
                />
                {isTimerRunning ? 'Tracking Active Time' : 'Synced Across Portal'}
              </span>
            </div>
            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
              Track focused study minutes across Study Notes, Python Lab, Practice Arena, Flashcards & Assessments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[11px] font-semibold text-[#795548] dark:text-[#D7CCC8] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoTrackStudyResource}
              onChange={e => setAutoTrackStudyResource(e.target.checked)}
              className="accent-[#B83232] rounded"
            />
            <span>Auto-detect active page</span>
          </label>

          <button
            type="button"
            onClick={toggleTimerSound}
            className="p-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#795548] dark:text-[#F2C94C] hover:border-[#B83232] transition-colors"
            title={timerSoundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
            aria-label={timerSoundEnabled ? 'Mute chime' : 'Enable chime'}
          >
            {timerSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Timer Control + Right Active Resource Breakdown */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Circular Pomodoro Clock & Resource Target */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-[#292929] text-white border border-[#795548]/40 flex flex-col sm:flex-row items-center gap-5">
            {/* Circular SVG Ring */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke={timerMode === 'focus' ? '#F2C94C' : '#34D399'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-mono font-extrabold tracking-tight tabular-nums text-white">
                  {formatCountdown(timerTimeLeft)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2C94C] mt-0.5">
                  {timerMode === 'focus'
                    ? 'Focus'
                    : timerMode === 'short_break'
                    ? 'Short Break'
                    : 'Long Break'}
                </span>
              </div>
            </div>

            {/* Timer Controls & Mode Switch */}
            <div className="flex-1 w-full space-y-3">
              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                {(
                  [
                    { id: 'focus', label: 'Focus' },
                    { id: 'short_break', label: 'Break' },
                    { id: 'long_break', label: 'Long' },
                  ] as { id: TimerMode; label: string }[]
                ).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => switchTimerMode(tab.id)}
                    className={`py-1 rounded text-[11px] font-bold transition-colors ${
                      timerMode === tab.id
                        ? 'bg-[#B83232] text-white'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Duration Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {presets.map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCustomIntervalMinutes(timerMode, mins)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                      currentModeMinutes === mins
                        ? 'bg-[#F2C94C] text-[#292929] border-[#F2C94C]'
                        : 'bg-white/5 text-stone-300 border-white/15 hover:border-[#F2C94C]/60'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Primary Action Row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors ${
                    isTimerRunning
                      ? 'bg-[#B83232] hover:bg-[#9E2A2A] text-white'
                      : 'bg-[#F2C94C] hover:bg-[#e2b93b] text-[#292929]'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Focus</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Reset timer"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={logCurrentStudySegment}
                  className="px-2.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F2C94C] text-[11px] font-bold transition-colors"
                  title="Save elapsed focus progress to study log"
                >
                  Log
                </button>

                {timerMode === 'focus' && timerTimeLeft < currentDuration && (
                  <button
                    type="button"
                    onClick={completeAndSummarizeSession}
                    className="px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                    title="End focus session early and open Study Session Summary"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>

          {timerHasCompleted && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-[#F2C94C] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#795548] dark:text-[#F2C94C]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Pomodoro interval completed and logged! Take a short break.</span>
              </div>
              <button
                type="button"
                onClick={dismissTimerCompletion}
                className="text-[11px] font-bold text-[#B83232] hover:underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Target Resource & Subject Picker */}
          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="pomodoro-resource-select"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2] mb-1"
                >
                  Academic Resource Target
                </label>
                <select
                  id="pomodoro-resource-select"
                  value={activeStudyResource}
                  onChange={e => setActiveStudyResource(e.target.value as StudyResourceKey)}
                  className="w-full rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] px-2.5 py-1.5 text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] focus:outline-none focus:ring-1 focus:ring-[#B83232]"
                >
                  {ACADEMIC_RESOURCES.map(res => (
                    <option key={res.key} value={res.key}>
                      {res.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="pomodoro-subject-select"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2] mb-1"
                >
                  MCA Subject Focus
                </label>
                <select
                  id="pomodoro-subject-select"
                  value={activeStudySubject}
                  onChange={e => setActiveStudySubject(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] px-2.5 py-1.5 text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] focus:outline-none focus:ring-1 focus:ring-[#B83232]"
                >
                  <option value="ALL">All Semester 1 Subjects</option>
                  {SEMESTER_SUBJECTS.map(subj => (
                    <option key={subj.code} value={subj.code}>
                      {subj.code} · {subj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLaunchStudyResource}
              className="w-full py-2 px-3 rounded-lg bg-[#292929] hover:bg-[#1E1E1E] text-[#F2C94C] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#795548]/40 transition-colors"
            >
              <span>Start Focus & Open {activeResourceMeta.shortLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Active Learning Time Across Academic Resources */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]">
                Total Active Time
              </p>
              <p className="text-lg font-mono font-extrabold text-[#292929] dark:text-white mt-0.5">
                {formatDurationHuman(totalActiveSeconds)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]">
                Completed Rounds
              </p>
              <p className="text-lg font-mono font-extrabold text-[#B83232] dark:text-[#F2C94C] mt-0.5 flex items-center gap-1">
                <span>{completedFocusSessions}</span>
                <Coffee className="w-3.5 h-3.5" />
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#795548] dark:text-[#BDB7B2]">
                Active Target
              </p>
              <p className="text-xs font-extrabold text-[#292929] dark:text-white mt-1.5 truncate">
                {activeResourceMeta.shortLabel}
              </p>
            </div>
          </div>

          {/* Resource Distribution Breakdown */}
          <div className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#292929] dark:text-[#F7F5F2]">
                Active Learning Time by Academic Resource
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogs(prev => !prev)}
                  className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline"
                >
                  {showLogs ? 'Hide History' : `Session Log (${studySessionLogs.length})`}
                </button>
                {totalActiveSeconds > 0 && (
                  <button
                    type="button"
                    onClick={resetLearningTimeStats}
                    className="p-1 text-[#795548] hover:text-[#B83232] dark:text-[#BDB7B2] dark:hover:text-[#F2C94C] transition-colors"
                    title="Reset tracked study times"
                    aria-label="Reset tracked study times"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {!showLogs ? (
              <div className="space-y-2.5">
                {ACADEMIC_RESOURCES.map(res => {
                  const Icon = res.icon;
                  const secs = learningTimeByResource[res.key] || 0;
                  const sharePct =
                    totalActiveSeconds > 0 ? Math.round((secs / totalActiveSeconds) * 100) : 0;
                  const isActiveTarget = activeStudyResource === res.key;

                  return (
                    <div
                      key={res.key}
                      onClick={() => setActiveStudyResource(res.key)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isActiveTarget
                          ? 'bg-white dark:bg-[#292929] border-[#B83232]/60 shadow-xs'
                          : 'bg-white/70 dark:bg-[#292929]/60 border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActiveTarget
                                ? 'text-[#B83232] dark:text-[#F2C94C]'
                                : 'text-[#795548] dark:text-[#BDB7B2]'
                            }`}
                          />
                          <span className="font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                            {res.label}
                          </span>
                          {isActiveTarget && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C]">
                              Selected
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-[#292929] dark:text-[#F2C94C] shrink-0">
                          {formatDurationHuman(secs)}{' '}
                          <span className="text-[10px] text-[#795548] dark:text-[#BDB7B2]">
                            ({sharePct}%)
                          </span>
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#E5DFD9] dark:bg-[#1E1E1E] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${res.barColor}`}
                          style={{ width: `${Math.max(secs > 0 ? 4 : 0, sharePct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {studySessionLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                    <Clock className="w-5 h-5 mx-auto mb-1.5 text-[#795548] dark:text-[#F2C94C]" />
                    No completed focus segments logged yet. Start the timer or click Log after studying to record a session.
                  </div>
                ) : (
                  studySessionLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-[#292929] dark:text-[#F7F5F2] truncate">
                            {log.label}
                          </p>
                          <p className="text-[10px] text-[#795548] dark:text-[#BDB7B2]">
                            {log.subjectCode === 'ALL' ? 'All Subjects' : log.subjectCode} · {log.completedAt}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C] shrink-0">
                        {formatDurationHuman(log.durationSeconds)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
