import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Shield,
  BookOpen,
  Bell
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { CalendarEventCategory, TimetableSlot } from '../../types';

const DAYS_OF_WEEK: TimetableSlot['dayOfWeek'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const AcademicCalendarView: React.FC = () => {
  const {
    currentUser,
    allSubjects,
    calendarEvents,
    timetableSlots,
    addCalendarEvent,
    deleteCalendarEvent,
    upsertTimetableSlot,
    deleteTimetableSlot
  } = usePortal();

  const [activeTab, setActiveTab] = useState<'calendar' | 'timetable'>('calendar');
  const [categoryFilter, setCategoryFilter] = useState<'All' | CalendarEventCategory>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [showManager, setShowManager] = useState<boolean>(false);

  // Add Event / Study Reminder form
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('2026-11-18');
  const [newCategory, setNewCategory] = useState<CalendarEventCategory>('Study Reminder');
  const [newSubjectCode, setNewSubjectCode] = useState<string>('');

  // Timetable Manager form
  const [ttDay, setTtDay] = useState<TimetableSlot['dayOfWeek']>('Monday');
  const [ttStart, setTtStart] = useState<string>('09:30');
  const [ttEnd, setTtEnd] = useState<string>('10:30');
  const [ttSubject, setTtSubject] = useState<string>(allSubjects[0]?.code || '435C1A');
  const [ttRoom, setTtRoom] = useState<string>('MCA Seminar Hall 1');

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(ev => {
      const catMatch = categoryFilter === 'All' || ev.category === categoryFilter;
      return catMatch;
    });
  }, [calendarEvents, categoryFilter]);

  const monthEvents = useMemo(() => {
    return filteredEvents.filter(ev => ev.date.startsWith(selectedMonth));
  }, [filteredEvents, selectedMonth]);

  // Build simple calendar days grid for selectedMonth (YYYY-MM)
  const calendarDays = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIdx)) return [];
    const firstDayWeekday = new Date(year, monthIdx, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDayWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [selectedMonth]);

  if (!currentUser) return null;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    addCalendarEvent({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Academic schedule entry',
      date: newDate,
      category: newCategory,
      subjectCode: newSubjectCode || undefined,
      isPublished: true,
      createdBy:
        newCategory === 'Study Reminder'
          ? currentUser.name
          : `Faculty Advisor (${currentUser.advisorName})`,
      sourceType: newCategory === 'Study Reminder' ? 'Student' : 'Faculty'
    });
    setNewTitle('');
    setNewDesc('');
  };

  const handleAddTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = allSubjects.find(s => s.code === ttSubject);
    upsertTimetableSlot({
      dayOfWeek: ttDay,
      startTime: ttStart,
      endTime: ttEnd,
      subjectCode: ttSubject,
      subjectName: subj?.name || ttSubject,
      roomOrLab: ttRoom.trim() || 'MCA Lecture Hall',
      instructor: subj?.instructor || 'Department Faculty'
    });
  };

  const categoryBadgeClass = (cat: CalendarEventCategory) => {
    switch (cat) {
      case 'Examination':
        return 'bg-[#B83232] text-white';
      case 'Assignment':
        return 'bg-[#F2C94C] text-[#292929]';
      case 'Academic Event':
        return 'bg-[#292929] text-[#F2C94C]';
      case 'General Notice':
        return 'bg-[#795548] text-white';
      case 'Study Reminder':
        return 'bg-stone-200 dark:bg-stone-700 text-[#292929] dark:text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Schedules, Deadlines &amp; Reminders
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Academic Calendar &amp; Timetable
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Published assignment deadlines, examination dates, institutional notices, and personal study reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'calendar'
                ? 'bg-[#B83232] text-white'
                : 'bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white'
            }`}
          >
            Monthly Calendar
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'timetable'
                ? 'bg-[#B83232] text-white'
                : 'bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white'
            }`}
          >
            Weekly Timetable
          </button>
          <button
            onClick={() => setShowManager(prev => !prev)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#292929] text-[#F2C94C] border border-[#795548]/40 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showManager ? 'Hide Editor' : 'Add Reminder / Manage'}</span>
          </button>
        </div>
      </div>

      {/* Add Study Reminder / Faculty Schedule Manager */}
      {showManager && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form
            onSubmit={handleAddEvent}
            className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3"
          >
            <h3 className="text-sm font-bold text-[#292929] dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
              Add Calendar Event / Study Reminder
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Event or study reminder title"
                className="px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                required
              />
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                required
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as CalendarEventCategory)}
                className="px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <option value="Study Reminder">Study Reminder (Personal)</option>
                <option value="Academic Event">Academic Event (Faculty)</option>
                <option value="General Notice">General Notice (Faculty)</option>
                <option value="Assignment">Assignment (Faculty)</option>
                <option value="Examination">Examination (Faculty)</option>
              </select>
              <select
                value={newSubjectCode}
                onChange={e => setNewSubjectCode(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                <option value="">General / All Subjects</option>
                {allSubjects.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Optional notes or syllabus unit details"
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold"
            >
              Save Calendar Entry
            </button>
          </form>

          <form
            onSubmit={handleAddTimetableSlot}
            className="p-5 rounded-2xl bg-[#292929] text-white border border-[#795548]/40 space-y-3"
          >
            <h3 className="text-sm font-bold text-[#F2C94C] flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Faculty / Admin Timetable Manager
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={ttDay}
                onChange={e => setTtDay(e.target.value as TimetableSlot['dayOfWeek'])}
                className="px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={ttSubject}
                onChange={e => setTtSubject(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15"
              >
                {allSubjects.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={ttStart}
                onChange={e => setTtStart(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15"
              />
              <input
                type="time"
                value={ttEnd}
                onChange={e => setTtEnd(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15"
              />
            </div>
            <input
              type="text"
              value={ttRoom}
              onChange={e => setTtRoom(e.target.value)}
              placeholder="Room or Lab Name"
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#F2C94C] hover:bg-[#e0b73b] text-[#292929] text-xs font-bold"
            >
              Publish Timetable Slot
            </button>
          </form>
        </div>
      )}

      {activeTab === 'calendar' ? (
        <div className="space-y-5">
          {/* Month & Category Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                ['All', 'Assignment', 'Examination', 'Academic Event', 'General Notice', 'Study Reminder'] as const
              ).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#B83232] border-[#B83232] text-white'
                      : 'bg-white dark:bg-[#292929] border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-stone-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-white self-start"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Monthly Calendar Grid */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#795548] dark:text-[#F2C94C] pb-2 border-b border-[#E5DFD9] dark:border-[#3D3835]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 pt-2">
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="h-16" />;
                  const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                  const dayEvents = monthEvents.filter(ev => ev.date === dateStr);
                  return (
                    <div
                      key={dateStr}
                      className={`h-16 p-1.5 rounded-lg border text-xs flex flex-col justify-between ${
                        dayEvents.length > 0
                          ? 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border-[#B83232]/50'
                          : 'bg-white dark:bg-[#202020] border-[#E5DFD9]/60 dark:border-[#3D3835]/60'
                      }`}
                    >
                      <span className="font-mono text-[11px] font-bold text-[#292929] dark:text-white">
                        {day}
                      </span>
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map(ev => (
                          <span
                            key={ev.id}
                            title={`${ev.category}: ${ev.title}`}
                            className={`w-2 h-2 rounded-full ${
                              ev.category === 'Examination'
                                ? 'bg-[#B83232]'
                                : ev.category === 'Assignment'
                                ? 'bg-[#F2C94C]'
                                : 'bg-[#795548]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chronological Events List */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#292929] dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
                <span>Published Deadlines &amp; Events ({filteredEvents.length})</span>
              </h3>

              {filteredEvents.length === 0 ? (
                <p className="text-xs text-[#795548] dark:text-stone-400">
                  No events match the selected category.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${categoryBadgeClass(ev.category)}`}>
                          {ev.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#795548] dark:text-[#F2C94C]">
                            {ev.date}
                          </span>
                          {(ev.sourceType === 'Student' || (showManager && ev.sourceType === 'Faculty')) && (
                            <button
                              onClick={() => deleteCalendarEvent(ev.id)}
                              className="text-stone-400 hover:text-[#B83232]"
                              title="Remove entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[#292929] dark:text-white">{ev.title}</h4>
                      <p className="text-[11px] text-[#795548] dark:text-stone-400">{ev.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Weekly Timetable Tab */
        <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-4">
          {timetableSlots.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-[#795548] dark:text-[#F2C94C] mx-auto" />
              <h3 className="text-base font-extrabold text-[#292929] dark:text-white">
                Official Class Timetable Has Not Been Published Yet
              </h3>
              <p className="text-xs text-[#795548] dark:text-stone-400 max-w-md mx-auto">
                Weekly lecture and practical lab slots appear here once published by your department coordinator. Use &quot;Add Reminder / Manage&quot; to publish timetable slots if authorized.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS_OF_WEEK.map(day => {
                const daySlots = timetableSlots
                  .filter(s => s.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                return (
                  <div
                    key={day}
                    className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2.5"
                  >
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] pb-2 border-b border-[#E5DFD9] dark:border-[#3D3835]">
                      {day}
                    </h4>
                    {daySlots.length === 0 ? (
                      <p className="text-[11px] text-stone-500">No scheduled classes.</p>
                    ) : (
                      daySlots.map(slot => (
                        <div
                          key={slot.id}
                          className="p-3 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <button
                              onClick={() => deleteTimetableSlot(slot.id)}
                              className="text-stone-400 hover:text-[#B83232]"
                              title="Remove slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-bold text-[#292929] dark:text-white">
                            {slot.subjectCode} · {slot.subjectName}
                          </p>
                          <p className="text-[11px] text-[#795548] dark:text-stone-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {slot.roomOrLab} · {slot.instructor}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
