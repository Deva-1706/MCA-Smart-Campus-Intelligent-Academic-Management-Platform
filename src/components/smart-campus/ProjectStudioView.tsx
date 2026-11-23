import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { SkillDNASkillKey, StudentProject } from '../../types';
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Award,
  Send
} from 'lucide-react';

interface ProjectStudioViewProps {
  mode?: 'student' | 'faculty' | 'admin';
}

export const ProjectStudioView: React.FC<ProjectStudioViewProps> = ({ mode = 'student' }) => {
  const {
    currentUser,
    allSubjects,
    projects,
    submitStudentProject,
    toggleProjectMilestone,
    reviewStudentProject,
    hasFacultyPermission,
  } = usePortal();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState(allSubjects[0]?.code || '435C1B');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('Python, Data Structures');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [contributions, setContributions] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});

  const canReview =
    (mode === 'faculty' && hasFacultyPermission('review_projects')) || mode === 'admin';

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const techList = technologies
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    submitStudentProject({
      studentId: currentUser?.studentId || 'MCA2401',
      studentName: currentUser?.name || 'Devanath N',
      subjectCode,
      title: title.trim(),
      description: description.trim(),
      objectives: [
        'Design modular architecture aligned with MCA coursework',
        'Verify algorithmic correctness with automated tests',
      ],
      technologies: techList.length > 0 ? techList : ['Python'],
      githubUrl: githubUrl.trim() || undefined,
      demoUrl: demoUrl.trim() || undefined,
      milestones: [
        { id: `ms-${Date.now()}-1`, title: 'Architecture & Core Implementation', completed: true, dueDate: '2026-11-24' },
        { id: `ms-${Date.now()}-2`, title: 'Testing & Faculty Submission', completed: false, dueDate: '2026-12-02' },
      ],
      contributions: contributions.trim() || 'Primary developer and test author.',
      status: 'Under Review',
      approvedForShowcase: false,
      skillsEvaluated: ['Python', 'Software Engineering'] as SkillDNASkillKey[],
    });

    setTitle('');
    setDescription('');
    setGithubUrl('');
    setDemoUrl('');
    setContributions('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
            <FolderKanban className="w-4 h-4" /> Academic Project Lifecycle
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight mt-0.5">
            Project Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            {mode === 'student'
              ? 'Build technical MCA projects, track milestones, attach GitHub repositories, and submit for Faculty evaluation.'
              : 'Evaluate student technical deliverables, leave structured feedback, and approve projects for campus showcase.'}
          </p>
        </div>

        {mode === 'student' && (
          <button
            onClick={() => setShowCreateForm(prev => !prev)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#B83232] hover:bg-[#9E2A2A] text-white flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{showCreateForm ? 'Close Form' : 'New Project Entry'}</span>
          </button>
        )}
      </div>

      {/* Purpose & How to Use Guide */}
      <div className="p-4 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs text-[#292929] dark:text-[#F7F5F2] space-y-1">
        <strong className="text-[#B83232] dark:text-[#F2C94C]">Purpose &amp; How to Use Project Studio:</strong>
        <p className="text-[#6E6863] dark:text-[#BDB7B2]">
          {mode === 'student'
            ? '1) Click "New Project Entry" and link it to an MCA subject. 2) Track milestones and attach your GitHub repository. 3) Submit for faculty review—approved projects appear in your Campus Showcase and Skill DNA.'
            : 'Review submitted student project milestones, enter structured feedback, and click "Verify & Showcase" to approve qualifying MCA projects.'}
        </p>
      </div>

      {projects.length === 0 && (
        <div className="p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-center space-y-2">
          <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">No MCA projects submitted yet.</p>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
            Use &ldquo;New Project Entry&rdquo; above to log your first subject-linked implementation and milestones.
          </p>
        </div>
      )}

      {showCreateForm && mode === 'student' && (
        <form
          onSubmit={handleCreateProject}
          className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#B83232]/40 shadow-sm space-y-4 text-xs"
        >
          <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
            Submit New MCA Project
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Project Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Transaction Deadlock Wait-For Graph Detector"
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Linked Subject</label>
              <select
                value={subjectCode}
                onChange={e => setSubjectCode(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                {allSubjects.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Description & Objectives</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the engineering problem, algorithms applied, and verification method..."
              className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Technologies (comma separated)</label>
              <input
                type="text"
                value={technologies}
                onChange={e => setTechnologies(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Demo Link (optional)</label>
              <input
                type="url"
                value={demoUrl}
                onChange={e => setDemoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Your Individual Contributions</label>
            <input
              type="text"
              value={contributions}
              onChange={e => setContributions(e.target.value)}
              placeholder="e.g. Authored cycle detector module and automated test suite"
              className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-lg text-[#795548] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Project for Faculty Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((proj: StudentProject) => {
          const completedMilestones = proj.milestones.filter(m => m.completed).length;
          return (
            <div
              key={proj.id}
              className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C]">
                      {proj.subjectCode}
                    </span>
                    <span className="text-[11px] text-[#795548] dark:text-[#BDB7B2] font-semibold">
                      {proj.studentName} ({proj.studentId})
                    </span>
                    {proj.approvedForShowcase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#F2C94C] text-[#292929]">
                        <Award className="w-3 h-3" /> Campus Showcase
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                    {proj.title}
                  </h2>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded border shrink-0 ${
                    proj.status === 'Verified'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : proj.status === 'Needs Revision'
                      ? 'bg-rose-50 text-[#B83232] border-rose-200'
                      : 'bg-amber-50 text-[#795548] border-amber-200 dark:bg-amber-950/30 dark:text-[#F2C94C]'
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                {proj.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {proj.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Milestones */}
              <div className="space-y-2 pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#795548] dark:text-[#BDB7B2]">
                  <span>Milestones ({completedMilestones}/{proj.milestones.length})</span>
                  <span>Due Schedule</span>
                </div>
                {proj.milestones.map(ms => (
                  <button
                    key={ms.id}
                    type="button"
                    onClick={() => toggleProjectMilestone(proj.id, ms.id)}
                    className="w-full p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between text-xs text-left hover:border-[#B83232]"
                  >
                    <span className="flex items-center gap-2 font-medium text-[#292929] dark:text-[#F7F5F2]">
                      {ms.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#795548] shrink-0" />
                      )}
                      <span className={ms.completed ? 'line-through opacity-75' : ''}>{ms.title}</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#795548] dark:text-[#BDB7B2]">
                      {ms.dueDate}
                    </span>
                  </button>
                ))}
              </div>

              {/* Links & Contributions */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-[#E5DFD9] dark:border-[#3D3835]">
                <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
                  Contribution: <strong className="text-[#292929] dark:text-[#F7F5F2]">{proj.contributions}</strong>
                </span>
                <div className="flex items-center gap-3">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#B83232] dark:text-[#F2C94C] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Repository</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {proj.facultyFeedback && (
                <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#795548]/30 text-xs">
                  <span className="font-bold text-[#B83232] dark:text-[#F2C94C] block text-[10px] uppercase">
                    Faculty Review ({proj.reviewedBy || 'HCASICAN'})
                  </span>
                  <p className="text-[#292929] dark:text-[#F7F5F2] mt-0.5">{proj.facultyFeedback}</p>
                </div>
              )}

              {canReview && (
                <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] space-y-2 text-xs">
                  <input
                    type="text"
                    value={feedbackDraft[proj.id] ?? proj.facultyFeedback ?? ''}
                    onChange={e =>
                      setFeedbackDraft(prev => ({ ...prev, [proj.id]: e.target.value }))
                    }
                    placeholder="Enter faculty evaluation feedback..."
                    className="w-full p-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        reviewStudentProject(
                          proj.id,
                          'Verified',
                          feedbackDraft[proj.id] || 'Verified by Faculty Coordinator HCASICAN.',
                          true
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                    >
                      Verify & Showcase
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        reviewStudentProject(
                          proj.id,
                          'Needs Revision',
                          feedbackDraft[proj.id] || 'Please add automated tests before final showcase verification.',
                          false
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold"
                    >
                      Request Revision
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
