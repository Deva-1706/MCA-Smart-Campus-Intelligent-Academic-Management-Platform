import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Flame
} from 'lucide-react';
import { usePortal, TimerMode } from '../../context/PortalContext';

interface FocusTimerPanelProps {
  problemTitle: string;
}

const FOCUS_PRESETS = [15, 25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

export const FocusTimerPanel: React.FC<FocusTimerPanelProps> = ({ problemTitle }) => {
  const {
    timerMode,
    timerDurations,
    timerTimeLeft,
    isTimerRunning,
    completedFocusSessions,
    timerSoundEnabled,
    timerHasCompleted,
    setActiveFocusLabel,
    toggleTimer,
    resetTimer,
    switchTimerMode,
    setCustomIntervalMinutes,
    toggleTimerSound,
    dismissTimerCompletion
  } = usePortal();

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(
    String(Math.round(timerDurations[timerMode] / 60))
  );

  // Sync custom input box when mode or configured duration changes
  useEffect(() => {
    setCustomMinutesInput(String(Math.round(timerDurations[timerMode] / 60)));
  }, [timerMode, timerDurations]);

  // Keep sidebar context label synced with the active Python problem when practicing
  useEffect(() => {
    setActiveFocusLabel(`Lab: ${problemTitle}`);
  }, [problemTitle, setActiveFocusLabel]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDuration = timerDurations[timerMode] || 1;
  const progressPercent = Math.min(100, Math.max(0, ((currentDuration - timerTimeLeft) / currentDuration) * 100));

  const handleApplyCustomInterval = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customMinutesInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 180) {
      setCustomIntervalMinutes(timerMode, parsed, `Lab: ${problemTitle}`);
    }
  };

  const handlePresetClick = (minutes: number) => {
    setCustomMinutesInput(String(minutes));
    setCustomIntervalMinutes(timerMode, minutes, `Lab: ${problemTitle}`);
  };

  const cycleProgress = completedFocusSessions % 4;

  return (
    <div className="rounded-2xl bg-[#292929] text-[#F7F5F2] border border-[#795548]/40 shadow-sm overflow-hidden">
      {/* Compact Always-Visible Focus Bar */}
      <div className="p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Status & Timer Readout */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              timerMode === 'focus'
                ? 'bg-[#B83232]/20 border-[#B83232]/50 text-[#F2C94C]'
                : 'bg-[#795548]/30 border-[#795548]/60 text-[#F2C94C]'
            }`}
          >
            {timerMode === 'focus' ? <Timer className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2C94C]">
                Coding Focus Timer
              </span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isTimerRunning
                    ? 'bg-[#B83232] text-white'
                    : 'bg-white/10 text-stone-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? 'bg-[#F2C94C] animate-pulse' : 'bg-stone-400'}`} />
                {isTimerRunning ? 'Active · Synced to Sidebar' : 'Ready · Sidebar Synced'}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 mt-0.5">
              <span className="text-2xl font-mono font-bold tracking-tight text-white">
                {formatTime(timerTimeLeft)}
              </span>
              <span className="text-xs text-stone-300 font-medium">
                {timerMode === 'focus'
                  ? `Focus (${Math.round(timerDurations.focus / 60)}m)`
                  : timerMode === 'short_break'
                  ? `Short Break (${Math.round(timerDurations.short_break / 60)}m)`
                  : `Long Break (${Math.round(timerDurations.long_break / 60)}m)`}
              </span>
              <span className="hidden sm:inline text-[11px] text-stone-400 truncate max-w-[220px]">
                · {problemTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Controls & Interval Config Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 4-Pomodoro Cycle Dots */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 border border-white/5 mr-1"
            title={`${completedFocusSessions} total focus sessions completed`}
          >
            <Flame className="w-3.5 h-3.5 text-[#F2C94C]" />
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map(idx => {
                const filledDots = completedFocusSessions > 0 && cycleProgress === 0 ? 4 : cycleProgress;
                return (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx < filledDots ? 'bg-[#F2C94C]' : 'bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-mono text-stone-300 ml-0.5">{completedFocusSessions}</span>
          </div>

          <button
            onClick={toggleTimer}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              isTimerRunning
                ? 'bg-[#B83232] hover:bg-[#9E2A2A] text-white'
                : 'bg-[#F2C94C] hover:bg-[#e0b73b] text-[#292929]'
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
            onClick={resetTimer}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Reset Current Interval"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleTimerSound}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={timerSoundEnabled ? 'Mute Completion Chime' : 'Enable Completion Chime'}
          >
            {timerSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#F2C94C]" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
          </button>

          <button
            onClick={() => setIsConfigOpen(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              isConfigOpen
                ? 'bg-[#795548] border-[#795548] text-white'
                : 'bg-black/30 border-white/15 hover:border-[#F2C94C]/60 text-stone-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Set Interval</span>
            {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Live Progress Strip */}
      <div className="w-full h-1 bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-[#B83232] to-[#F2C94C] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Completion Alert */}
      {timerHasCompleted && (
        <div className="px-4 py-2 bg-[#B83232]/25 border-t border-[#B83232]/40 flex items-center justify-between gap-2 text-xs text-[#F2C94C]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Focus interval complete! Your session count has been updated in the sidebar.
            </span>
          </div>
          <button
            onClick={dismissTimerCompletion}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Expandable Interval Customization Panel */}
      {isConfigOpen && (
        <div className="p-4 bg-[#202020] border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Mode Switcher */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Timer Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'focus', label: 'Focus' },
                  { id: 'short_break', label: 'Short Break' },
                  { id: 'long_break', label: 'Long Break' }
                ] as { id: TimerMode; label: string }[]
              ).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTimerMode(item.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                    timerMode === item.id
                      ? item.id === 'focus'
                        ? 'bg-[#B83232] border-[#B83232] text-white'
                        : 'bg-[#795548] border-[#795548] text-white'
                      : 'bg-black/30 border-white/10 text-stone-300 hover:border-white/25'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Interval Presets */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Quick Study Presets ({timerMode === 'focus' ? 'Coding' : 'Rest'})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(timerMode === 'focus' ? FOCUS_PRESETS : BREAK_PRESETS).map(mins => {
                const isSelected = Math.round(timerDurations[timerMode] / 60) === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handlePresetClick(mins)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#F2C94C] border-[#F2C94C] text-[#292929]'
                        : 'bg-black/30 border-white/10 text-stone-200 hover:border-[#F2C94C]/50'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Minutes Input */}
          <form onSubmit={handleApplyCustomInterval} className="lg:col-span-4 space-y-1.5">
            <label
              htmlFor="custom-focus-minutes"
              className="text-[10px] font-bold uppercase tracking-wider text-stone-400"
            >
              Custom Interval (1–120 mins)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-focus-minutes"
                type="number"
                min={1}
                max={120}
                value={customMinutesInput}
                onChange={e => setCustomMinutesInput(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg bg-[#292929] border border-white/15 text-xs font-mono text-white focus:outline-hidden focus:border-[#F2C94C]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
