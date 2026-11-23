import React, { useState, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import { authFetch } from '../../utils/authFetch';
import { ChallengeItem } from '../../types';
import {
  Swords,
  Play,
  CheckCircle2,
  XCircle,
  Timer,
  Plus,
  Trophy
} from 'lucide-react';

interface ChallengeArenaViewProps {
  mode?: 'student' | 'faculty' | 'admin';
}

export const ChallengeArenaView: React.FC<ChallengeArenaViewProps> = ({ mode = 'student' }) => {
  const {
    currentUser,
    challenges,
    challengeAttempts,
    recordChallengeAttempt,
    addChallengeItem,
    toggleChallengePublish,
    hasFacultyPermission,
  } = usePortal();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [activeChallengeId, setActiveChallengeId] = useState<string>(challenges[0]?.id || 'chl-py-01');
  const [codeDraft, setCodeDraft] = useState<string>(challenges[0]?.starterCode || '');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(
    (challenges[0]?.durationMinutes || 15) * 60
  );
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    passed: boolean;
    message: string;
    stdout?: string;
    stderr?: string;
  } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Faculty authoring state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ChallengeItem['category']>('Python');
  const [newPrompt, setNewPrompt] = useState('');
  const [newCode, setNewCode] = useState('print("Hello Challenge")');
  const [newExpected, setNewExpected] = useState('Hello Challenge');

  const visibleChallenges =
    mode === 'student' ? challenges.filter(c => c.isPublished) : challenges;

  const filteredChallenges =
    categoryFilter === 'All'
      ? visibleChallenges
      : visibleChallenges.filter(c => c.category === categoryFilter);

  const activeChallenge: ChallengeItem | undefined =
    challenges.find(c => c.id === activeChallengeId) || filteredChallenges[0];

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const handleSelectChallenge = (ch: ChallengeItem) => {
    setActiveChallengeId(ch.id);
    setCodeDraft(ch.starterCode || '');
    setSelectedOption(null);
    setSecondsLeft(ch.durationMinutes * 60);
    setTimerRunning(false);
    setEvalResult(null);
  };

  const handleSubmitChallenge = async () => {
    if (!activeChallenge) return;
    setIsEvaluating(true);
    setEvalResult(null);

    if (activeChallenge.mode === 'Timed Coding') {
      try {
        const res = await authFetch('/api/coding-lab/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeDraft,
            expectedStdout: activeChallenge.expectedStdout || '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        const passed = Boolean(res.ok && data.passed);
        setEvalResult({
          passed,
          stdout: data.stdout || '',
          stderr: data.stderr || data.error || '',
          message: passed
            ? `Passed! Output matched expected stdout (+${activeChallenge.points} pts).`
            : `Did not match expected stdout (${activeChallenge.expectedStdout || 'check stderr'}).`,
        });
        recordChallengeAttempt({
          challengeId: activeChallenge.id,
          challengeTitle: activeChallenge.title,
          category: activeChallenge.category,
          passed,
          score: passed ? activeChallenge.points : 0,
          maxScore: activeChallenge.points,
          durationSeconds: Math.max(1, activeChallenge.durationMinutes * 60 - secondsLeft),
          stdout: data.stdout || '',
        });
      } catch {
        setEvalResult({
          passed: false,
          message: 'Unable to reach /api/coding-lab/execute runner.',
        });
      } finally {
        setIsEvaluating(false);
      }
      return;
    }

    // Subject Quiz Mode
    if (selectedOption === null) {
      setEvalResult({ passed: false, message: 'Select an option before submitting.' });
      setIsEvaluating(false);
      return;
    }

    const passed = selectedOption === activeChallenge.correctOptionIndex;
    setEvalResult({
      passed,
      message: passed
        ? `Correct! (+${activeChallenge.points} pts) — ${activeChallenge.explanation}`
        : `Incorrect answer. ${activeChallenge.explanation}`,
    });
    recordChallengeAttempt({
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
      category: activeChallenge.category,
      passed,
      score: passed ? activeChallenge.points : 0,
      maxScore: activeChallenge.points,
      durationSeconds: Math.max(1, activeChallenge.durationMinutes * 60 - secondsLeft),
    });
    setIsEvaluating(false);
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;
    addChallengeItem({
      title: newTitle.trim(),
      category: newCategory,
      subjectCode: newCategory === 'Python' ? '435C1C' : newCategory.includes('Data Structures') ? '435C1B' : '435E1A',
      mode: 'Timed Coding',
      difficulty: 'Medium',
      durationMinutes: 15,
      points: 120,
      prompt: newPrompt.trim(),
      starterCode: newCode,
      expectedStdout: newExpected.trim(),
      explanation: 'Faculty-authored isolated coding challenge.',
      createdBy: currentUser?.name || 'HCASICAN',
      isPublished: true,
    });
    setNewTitle('');
    setNewPrompt('');
    setShowCreate(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const categories = [
    'All',
    'Python',
    'Data Structures & Algorithms',
    'Database Management',
    'Discrete Mathematics',
  ];

  const canCreate = (mode === 'faculty' && hasFacultyPermission('create_challenges')) || mode === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <Swords className="w-4 h-4" /> Subject &amp; Timed Python Practice
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            {mode === 'faculty' ? 'Practice Arena Authoring' : 'Practice Coding Arena'}
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            Practise timed Python algorithms executed via server-side isolated runner and domain drills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-[#292929] text-[#F2C94C] text-xs font-mono font-bold flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            <span>{challengeAttempts.filter(a => a.passed).length} Passed</span>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(prev => !prev)}
              className="px-4 py-2 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreate ? 'Close Creator' : 'New Practice Problem'}</span>
            </button>
          )}
        </div>
      </div>

      {showCreate && canCreate && (
        <form
          onSubmit={handleCreateChallenge}
          className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#B83232]/40 space-y-4 text-xs"
        >
          <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
            Author New Timed Coding Practice Problem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Problem title"
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as ChallengeItem['category'])}
              className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            >
              <option value="Python">Python</option>
              <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
              <option value="Database Management">Database Management</option>
              <option value="Discrete Mathematics">Discrete Mathematics</option>
              <option value="SQL">SQL</option>
            </select>
          </div>
          <textarea
            rows={2}
            required
            value={newPrompt}
            onChange={e => setNewPrompt(e.target.value)}
            placeholder="Problem specification..."
            className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              rows={3}
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="Starter Python code"
              className="p-2.5 rounded-lg font-mono bg-[#1E1E1E] text-white"
            />
            <textarea
              rows={3}
              value={newExpected}
              onChange={e => setNewExpected(e.target.value)}
              placeholder="Expected exact stdout"
              className="p-2.5 rounded-lg font-mono bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold"
          >
            Publish to Practice Arena
          </button>
        </form>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              categoryFilter === cat
                ? 'bg-[#B83232] text-white'
                : 'bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-[#795548] dark:text-[#BDB7B2]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Challenge Selector + Arena Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-3">
          {filteredChallenges.map(ch => {
            const isSelected = activeChallenge?.id === ch.id;
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-[#292929] border-[#B83232] shadow-sm'
                    : 'bg-white dark:bg-[#292929] border-[#E5DFD9] dark:border-[#3D3835]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectChallenge(ch)}
                  className="w-full text-left space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#B83232] dark:text-[#F2C94C]">
                      {ch.category}
                    </span>
                    <span className="text-[#795548] dark:text-[#BDB7B2]">
                      {ch.points} pts · {ch.durationMinutes}m
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">{ch.title}</p>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
                    {ch.mode} · {ch.difficulty}
                  </p>
                </button>
                {mode === 'admin' && (
                  <button
                    type="button"
                    onClick={() => toggleChallengePublish(ch.id)}
                    className="mt-2 text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] underline"
                  >
                    {ch.isPublished ? 'Unpublish Challenge' : 'Publish Challenge'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Challenge Workspace */}
        {activeChallenge && (
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5DFD9] dark:border-[#3D3835]">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C]">
                  {activeChallenge.subjectCode} · {activeChallenge.mode}
                </span>
                <h2 className="text-lg font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                  {activeChallenge.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTimerRunning(prev => !prev)}
                className="px-3 py-1.5 rounded-lg bg-[#292929] text-[#F2C94C] font-mono tabular-nums text-xs font-bold flex items-center gap-1.5"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsLeft)}</span>
                <span className="text-[10px] text-[#D7CCC8]">
                  ({timerRunning ? 'Pause' : 'Start Timer'})
                </span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#292929] dark:text-[#F7F5F2] leading-relaxed">
              {activeChallenge.prompt}
            </p>

            {activeChallenge.mode === 'Timed Coding' ? (
              <div className="space-y-3">
                <textarea
                  rows={10}
                  value={codeDraft}
                  onChange={e => setCodeDraft(e.target.value)}
                  spellCheck={false}
                  className="w-full p-4 rounded-xl bg-[#1E1E1E] text-[#F7F5F2] font-mono text-xs leading-relaxed"
                />
                {activeChallenge.expectedStdout && (
                  <p className="text-[11px] font-mono text-[#795548] dark:text-[#BDB7B2]">
                    Expected stdout: <code>{activeChallenge.expectedStdout.replace(/\n/g, ' \\n ')}</code>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(activeChallenge.options || []).map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      selectedOption === idx
                        ? 'bg-[#B83232]/10 border-[#B83232] text-[#B83232] dark:text-[#F2C94C]'
                        : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitChallenge}
                disabled={isEvaluating}
                className="px-5 py-2.5 rounded-xl bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isEvaluating ? 'Running Subprocess...' : 'Run & Evaluate Submission'}</span>
              </button>
            </div>

            {evalResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  evalResult.passed
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {evalResult.passed ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{evalResult.message}</span>
                </div>
                {evalResult.stdout && (
                  <pre className="p-2.5 rounded bg-[#1E1E1E] text-[#F7F5F2] font-mono text-[11px] overflow-x-auto">
                    {evalResult.stdout}
                  </pre>
                )}
                {evalResult.stderr && (
                  <pre className="p-2.5 rounded bg-[#1E1E1E] text-rose-300 font-mono text-[11px] overflow-x-auto">
                    {evalResult.stderr}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
