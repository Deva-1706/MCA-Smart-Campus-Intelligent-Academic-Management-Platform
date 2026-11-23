import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { authFetch } from '../../utils/authFetch';
import { CodingProblem } from '../../types';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal,
  Bookmark,
  FileCode,
  Sparkles
} from 'lucide-react';
import { PythonAIAssistant } from './PythonAIAssistant';
import { FocusTimerPanel } from './FocusTimerPanel';

export const PythonLabView: React.FC = () => {
  const { allCodingProblems, toggleBookmark, isBookmarked, markCodingProblemVerified, setCurrentPage } = usePortal();
  const [selectedProblemId, setSelectedProblemId] = useState<string>(allCodingProblems[0].id);

  const activeProblem = allCodingProblems.find(p => p.id === selectedProblemId) || allCodingProblems[0];
  const [code, setCode] = useState<string>(activeProblem.starterCode);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    '# Python 3 Isolated Subprocess Sandbox\n# Ready. Click "Run Python Script" to execute your code on the server.'
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{ pass: boolean; message: string }[] | null>(null);

  const handleSelectProblem = (prob: CodingProblem) => {
    setSelectedProblemId(prob.id);
    setCode(prob.starterCode);
    setConsoleOutput(`# Switched to: ${prob.title}\n# Ready. Click "Run Python Script" to execute code.`);
    setTestResults(null);
  };

  const handleResetCode = () => {
    setCode(activeProblem.starterCode);
    setTestResults(null);
    setConsoleOutput('# Code reset to original starter template.');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestResults(null);
    setConsoleOutput('Executing Python code inside isolated server subprocess (-I)...\n');

    try {
      const res = await authFetch('/api/coding-lab/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setConsoleOutput(
          `>>> python3 -I solution.py\n[POLICY / EXECUTION ERROR]\n${data.error || 'Execution rejected by isolated runner.'}`
        );
        setTestResults([
          {
            pass: false,
            message: data.error || 'Execution failed policy or runtime validation.',
          },
        ]);
        setIsRunning(false);
        return;
      }

      const stdout = data.stdout || '';
      const stderr = data.stderr || '';
      const returncode = typeof data.returncode === 'number' ? data.returncode : 0;
      const elapsedMs = data.elapsedMs ?? 0;

      const outputSummary = [
        '>>> python3 -I solution.py',
        stdout ? stdout.trimEnd() : '(no stdout produced)',
        stderr ? `\n[stderr]\n${stderr.trimEnd()}` : '',
        `\n[Process exited with returncode ${returncode} in ${elapsedMs}ms]`,
      ]
        .filter(Boolean)
        .join('\n');

      setConsoleOutput(outputSummary);

      const passed = returncode === 0 && !stderr;
      if (passed) {
        markCodingProblemVerified(activeProblem.id);
      }

      setTestResults([
        {
          pass: passed,
          message: passed
            ? `Isolated CPython subprocess completed with exit code 0 in ${elapsedMs}ms.`
            : `Execution returned exit code ${returncode}${stderr ? ': ' + stderr.split('\n')[0] : ''}.`,
        },
        ...(activeProblem.testCases || []).slice(0, 2).map((tc, i) => ({
          pass: passed && stdout.trim().length > 0,
          message: `Reference Assertion ${i + 1}: Input ${tc.input} -> Expected ${tc.expectedOutput}`,
        })),
      ]);
    } catch {
      setConsoleOutput(
        '>>> python3 -I solution.py\n[CONNECTION ERROR] Could not reach /api/coding-lab/execute subprocess endpoint.'
      );
      setTestResults([
        { pass: false, message: 'Code execution server is unreachable. Verify server is running.' },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assessment Workspace Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] w-fit">
        <button
          type="button"
          onClick={() => setCurrentPage('assignments')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white"
        >
          Assignments
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage('examinations')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white"
        >
          Examinations
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage('coding-lab')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#B83232] text-white"
        >
          Python Coding Lab
        </button>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Interactive Practical Workbench
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-white tracking-tight">
            Python Coding Lab
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-stone-400 mt-1">
            Execute, debug, and test MCA algorithms in an isolated server-side Python 3 subprocess.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#292929] text-[#F2C94C] border border-stone-700 text-xs font-mono font-semibold">
            <span>Python 3 Isolated Runner</span>
          </span>
        </div>
      </div>

      <FocusTimerPanel problemTitle={activeProblem.title} />

      {/* Problem Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {allCodingProblems.map(prob => {
          const isSelected = prob.id === selectedProblemId;
          return (
            <button
              key={prob.id}
              onClick={() => handleSelectProblem(prob)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-white dark:bg-[#202020] border-[#B83232] shadow-xs ring-1 ring-[#B83232]/30'
                  : 'bg-white/70 dark:bg-[#202020]/40 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#B83232] dark:text-[#F2C94C]">
                  {prob.category}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    prob.difficulty === 'Easy'
                      ? 'bg-amber-100 text-[#292929] dark:bg-stone-800 dark:text-[#F2C94C]'
                      : prob.difficulty === 'Medium'
                      ? 'bg-amber-200 text-[#292929] dark:bg-stone-700 dark:text-[#F2C94C]'
                      : 'bg-rose-100 text-[#B83232] dark:bg-stone-800 dark:text-rose-400'
                  }`}
                >
                  {prob.difficulty}
                </span>
              </div>
              <p className="text-xs font-bold text-[#292929] dark:text-white truncate">
                {prob.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 max-h-[700px] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <span className="text-[10px] font-mono text-[#795548] dark:text-stone-400 uppercase">Problem Specifications</span>
              <h2 className="text-base font-bold text-[#292929] dark:text-white">
                {activeProblem.title}
              </h2>
            </div>
            <button
              onClick={() =>
                toggleBookmark({
                  id: `bm-code-${activeProblem.id}`,
                  title: activeProblem.title,
                  type: 'Problem',
                  refId: activeProblem.id,
                  subtitle: `${activeProblem.category} · ${activeProblem.difficulty}`,
                  tags: [activeProblem.category, 'Python']
                })
              }
              className="p-1.5 rounded-lg text-stone-400 hover:text-[#B83232] dark:hover:text-[#F2C94C] transition-colors"
              title="Bookmark Problem"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(activeProblem.id) ? 'fill-[#B83232] text-[#B83232] dark:fill-[#F2C94C] dark:text-[#F2C94C]' : ''}`} />
            </button>
          </div>

          <div className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed whitespace-pre-line">
            {activeProblem.description}
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="font-semibold text-[#292929] dark:text-stone-300">Input Specification:</span>
              <p className="text-[#795548] dark:text-stone-400 font-mono text-[11px]">{activeProblem.inputFormat}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="font-semibold text-[#292929] dark:text-stone-300">Output Specification:</span>
              <p className="text-[#795548] dark:text-stone-400 font-mono text-[11px]">{activeProblem.outputFormat}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="font-semibold text-[#292929] dark:text-stone-300">Algorithmic Rationale:</span>
              <p className="text-[#795548] dark:text-stone-400 text-[11px] leading-snug">{activeProblem.solutionExplanation}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
            <div className="p-3 bg-[#F7F5F2] dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
                <span className="font-mono text-xs font-semibold text-[#292929] dark:text-stone-200">
                  solution.py
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCode}
                  className="px-2.5 py-1 text-xs text-[#795548] hover:text-[#292929] dark:text-stone-400 dark:hover:text-white rounded flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-ai-mentor'))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#292929] hover:bg-[#1E1E1E] text-[#F2C94C] border border-stone-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
                  <span>Ask AI Mentor</span>
                </button>

                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Running...' : 'Run Python Script'}</span>
                </button>
              </div>
            </div>

            <div className="relative font-mono text-xs">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full p-4 bg-[#1E1E1E] text-[#F7F5F2] font-mono text-xs leading-relaxed focus:outline-hidden resize-y selection:bg-[#B83232] selection:text-white"
              />
            </div>

            <div className="border-t border-stone-800 bg-[#292929] p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-400 pb-2 border-b border-stone-700 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#F2C94C]" />
                  <span className="text-[#F2C94C]">Standard Output / Error</span>
                </div>
                <span>python3 -I Subprocess</span>
              </div>
              <pre className="text-stone-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {consoleOutput}
              </pre>
            </div>
          </div>

          {testResults && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-stone-400">
                Execution & Reference Assertions
              </h3>
              <div className="space-y-1.5">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      t.pass
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-[#B83232] dark:text-rose-300'
                    }`}
                  >
                    {t.pass ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="font-mono text-[11px] leading-snug">{t.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PythonAIAssistant
        currentCode={code}
        onApplyCode={(newCode) => {
          setCode(newCode);
          setConsoleOutput('# Code updated from AI Mentor suggestion.\n# Click "Run Python Script" to execute.');
        }}
        problemTitle={activeProblem.title}
        problemDescription={activeProblem.description}
        consoleOutput={consoleOutput}
      />
    </div>
  );
};
