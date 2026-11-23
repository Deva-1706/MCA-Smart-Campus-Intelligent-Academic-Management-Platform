import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';

interface SmartStudyPlannerViewProps {
  mode?: 'student' | 'faculty';
}

export const SmartStudyPlannerView: React.FC<SmartStudyPlannerViewProps> = ({
  mode = 'student',
}) => {
  const {
    currentUser,
    allSubjects,
    studyTasks,
    addStudyTask,
    toggleStudyTask,
    deleteStudyTask,
    facultyRevisionRecs,
    addFacultyRevisionRec,
    calendarEvents,
    weeklyGoalHoursBySubject,
    weeklyStudySecondsBySubject,
  } = usePortal();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState(allSubjects[0]?.code || '435C1A');
  const [taskUnit, setTaskUnit] = useState<number>(1);
  const [taskDate, setTaskDate] = useState('2026-11-20');
  const [taskSlot, setTaskSlot] = useState('18:30 – 19:30');
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  const [recTitle, setRecTitle] = useState('');
  const [recGuidance, setRecGuidance] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addStudyTask({
      studentId: currentUser?.studentId || 'MCA2401',
      subjectCode: taskSubject,
      unit: taskUnit,
      title: taskTitle.trim(),
      scheduledDate: taskDate,
      slotLabel: taskSlot,
      priority: taskPriority,
      completed: false,
      source: 'Student',
    });
    setTaskTitle('');
  };

  const handleAddRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim() || !recGuidance.trim()) return;
    addFacultyRevisionRec({
      subjectCode: taskSubject,
      unit: taskUnit,
      title: recTitle.trim(),
      guidance: recGuidance.trim(),
      recommendedBy: currentUser?.name || 'HCASICAN',
    });
    setRecTitle('');
    setRecGuidance('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4" /> Academic Cadence & Study Blocks
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
          Smart Study Planner
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
          Organize weekly revision blocks aligned to your subject goals while viewing Admin-governed official institutional dates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Personal Study Tasks & Add Form */}
        <div className="lg:col-span-7 space-y-6">
          {mode === 'student' && (
            <form
              onSubmit={handleAddTask}
              className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3 text-xs"
            >
              <h2 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Schedule Personal Study Block
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={taskSubject}
                  onChange={e => setTaskSubject(e.target.value)}
                  className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                >
                  {allSubjects.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                />
                <input
                  type="text"
                  value={taskSlot}
                  onChange={e => setTaskSlot(e.target.value)}
                  placeholder="18:30 – 19:30"
                  className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="Study block focus (e.g. Solve Unit 3 Recurrence Tree proofs)"
                  className="flex-1 p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                />
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              </div>
            </form>
          )}

          {/* Task Schedule List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3">
            <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
              Active Study Blocks ({studyTasks.length})
            </h2>

            {studyTasks.map(task => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => toggleStudyTask(task.id)}
                  className="flex items-start gap-3 text-left flex-1 min-w-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#795548] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">
                        {task.subjectCode} · Unit {task.unit}
                      </span>
                      <span className="text-[#795548] dark:text-[#BDB7B2]">
                        {task.scheduledDate} ({task.slotLabel})
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]">
                        {task.priority}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-bold mt-1 text-[#292929] dark:text-[#F7F5F2] ${
                        task.completed ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                </button>

                {mode === 'student' && (
                  <button
                    type="button"
                    onClick={() => deleteStudyTask(task.id)}
                    className="p-1.5 rounded-lg text-[#795548] hover:text-[#B83232]"
                    aria-label={`Delete study block ${task.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Weekly Target Progress Summary */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
              Weekly Study Goal Alignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allSubjects.map(sub => {
                const hrs = (weeklyStudySecondsBySubject[sub.code] || 0) / 3600;
                const goal = Math.max(1, weeklyGoalHoursBySubject[sub.code] ?? 6);
                const pct = Math.min(100, Math.round((hrs / goal) * 100));
                return (
                  <div
                    key={sub.code}
                    className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1.5"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                        {sub.code}
                      </span>
                      <span className="font-mono tabular-nums text-[11px] font-bold">
                        {hrs.toFixed(1)}h / {goal}h
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white dark:bg-[#292929] rounded-full overflow-hidden">
                      <div className="h-full bg-[#B83232]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Faculty Recommendations & Read-Only Official Dates */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#795548] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Faculty Revision Recommendations
              </h2>
              <Sparkles className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
            </div>

            {mode === 'faculty' && (
              <form onSubmit={handleAddRec} className="space-y-2.5 p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={taskSubject}
                    onChange={e => setTaskSubject(e.target.value)}
                    className="p-2 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
                  >
                    {allSubjects.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                  <select
                    value={taskUnit}
                    onChange={e => setTaskUnit(Number(e.target.value))}
                    className="p-2 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
                  >
                    {[1, 2, 3, 4, 5].map(u => (
                      <option key={u} value={u}>
                        Unit {u}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={e => setRecTitle(e.target.value)}
                  placeholder="Revision recommendation title..."
                  className="w-full p-2 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
                />
                <textarea
                  rows={2}
                  required
                  value={recGuidance}
                  onChange={e => setRecGuidance(e.target.value)}
                  placeholder="Targeted study guidance..."
                  className="w-full p-2 rounded bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#B83232] text-white font-bold"
                >
                  Publish Faculty Recommendation
                </button>
              </form>
            )}

            <div className="space-y-2.5">
              {facultyRevisionRecs.map(rec => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {rec.subjectCode} · Unit {rec.unit}
                    </span>
                    <span className="text-[#795548] dark:text-[#BDB7B2]">
                      By {rec.recommendedBy}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2]">{rec.title}</p>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">{rec.guidance}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Read-Only Official Academic Calendar Dates */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Official Academic Dates
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#292929] text-[#F2C94C]">
                <Lock className="w-3 h-3" /> Read-Only
              </span>
            </div>
            <div className="space-y-2">
              {calendarEvents.slice(0, 5).map(ev => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#292929] dark:text-[#F7F5F2]">{ev.title}</p>
                    <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                      {ev.category} {ev.subjectCode ? `· ${ev.subjectCode}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] shrink-0">
                    {ev.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
