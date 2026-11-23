import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Volume2, VolumeX, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export const PomodoroTimerWidget: React.FC = () => {
  const {
    timerMode,
    timerDurations,
    timerTimeLeft,
    isTimerRunning,
    completedFocusSessions,
    timerSoundEnabled,
    timerHasCompleted,
    activeFocusLabel,
    toggleTimer,
    resetTimer,
    switchTimerMode,
    toggleTimerSound,
    dismissTimerCompletion,
    setCurrentPage
  } = usePortal();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDuration = timerDurations[timerMode] || 1;
  const progressPercent = Math.min(100, Math.max(0, ((currentDuration - timerTimeLeft) / currentDuration) * 100));

  const focusMins = Math.round(timerDurations.focus / 60);
  const shortBreakMins = Math.round(timerDurations.short_break / 60);
  const longBreakMins = Math.round(timerDurations.long_break / 60);

  return (
    <div className="rounded-xl border border-[#795548]/30 bg-[#292929] text-[#F7F5F2] p-3 shadow-md">
      {/* Header with expand/collapse */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isTimerRunning ? 'bg-[#F2C94C] animate-pulse' : 'bg-white/40'}`} />
          <span className="text-xs font-bold tracking-wider uppercase text-[#F2C94C] flex items-center gap-1 truncate">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Focus Timer</span>
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleTimerSound}
            className="p-1 text-white/50 hover:text-white transition-colors"
            title={timerSoundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {timerSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-white/50 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main compact digital display */}
      <div className="flex items-center justify-between bg-black/30 rounded-lg p-2.5 border border-white/5">
        <div className="min-w-0 pr-2">
          <div className="text-2xl font-mono font-bold tracking-tight text-white flex items-baseline gap-1.5">
            <span>{formatTime(timerTimeLeft)}</span>
            <span className="text-[10px] font-sans font-medium uppercase text-[#F2C94C]/90">
              {timerMode === 'focus' ? 'Focus' : timerMode === 'short_break' ? 'Break' : 'Long Break'}
            </span>
          </div>
          <div className="text-[11px] text-white/60 truncate" title={activeFocusLabel}>
            {activeFocusLabel && activeFocusLabel !== 'Study Focus' ? (
              <span className="text-stone-300">{activeFocusLabel}</span>
            ) : (
              <>
                Sessions: <span className="text-[#F2C94C] font-semibold">{completedFocusSessions}</span> completed
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleTimer}
            className={`p-2 rounded-lg font-bold transition-all shadow-sm ${
              isTimerRunning
                ? 'bg-[#B83232] hover:bg-[#a02b2b] text-white'
                : 'bg-[#F2C94C] text-[#292929] hover:bg-[#e0b73b]'
            }`}
            title={isTimerRunning ? 'Pause' : 'Start'}
          >
            {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#B83232] to-[#F2C94C] h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Completion alert banner */}
      {timerHasCompleted && (
        <div className="mt-2 text-[11px] bg-[#B83232]/20 border border-[#B83232]/40 text-[#F2C94C] p-1.5 rounded-md flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[#F2C94C] shrink-0" />
            <span className="truncate">Interval complete! Take a break.</span>
          </div>
          <button
            onClick={dismissTimerCompletion}
            className="text-white/60 hover:text-white shrink-0"
            aria-label="Dismiss alert"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Expanded Controls & Presets */}
      {isExpanded && (
        <div className="mt-3 pt-2 border-t border-white/10 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchTimerMode('focus')}
              className={`py-1 px-1.5 text-[11px] rounded font-medium transition-all ${
                timerMode === 'focus'
                  ? 'bg-[#B83232] text-white font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {focusMins}m Focus
            </button>
            <button
              onClick={() => switchTimerMode('short_break')}
              className={`py-1 px-1.5 text-[11px] rounded font-medium transition-all ${
                timerMode === 'short_break'
                  ? 'bg-[#795548] text-white font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {shortBreakMins}m Break
            </button>
            <button
              onClick={() => switchTimerMode('long_break')}
              className={`py-1 px-1.5 text-[11px] rounded font-medium transition-all ${
                timerMode === 'long_break'
                  ? 'bg-[#795548] text-white font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {longBreakMins}m Rest
            </button>
          </div>

          <div className="text-[10px] text-white/50 flex items-center justify-between pt-1">
            <button
              onClick={() => setCurrentPage('coding-lab')}
              className="hover:text-[#F2C94C] transition-colors underline underline-offset-2"
            >
              Customize in Python Lab
            </button>
            <span className="flex items-center gap-1">
              <Coffee className="w-3 h-3 text-[#F2C94C]" />
              {completedFocusSessions} rounds
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
