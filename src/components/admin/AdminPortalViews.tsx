import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { ALL_FACULTY_PERMISSION_KEYS } from '../../data/smartCampusData';
import { FacultyPermissionKey, SubjectStatus, UserRole } from '../../types';
import {
  ShieldCheck,
  Users,
  BookOpen,
  UserCheck,
  FileSpreadsheet,
  Award,
  Plus,
  CheckCircle2,
  ClipboardList,
  Sliders,
  BadgeCheck,
  Settings
} from 'lucide-react';
import { KeyRound, AlertCircle } from 'lucide-react';
import { FacultyDocumentManagement } from '../portal/FacultyDocumentManagement';
import { ImportantNoticesSection } from '../portal/ImportantNoticesSection';
import { AcademicIntelligenceView } from '../smart-campus/AcademicIntelligenceView';

export const AdminPortalViews: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    userAccounts,
    toggleUserAccountActive,
    changeUserRoleAccount,
    initiateUserPasswordReset,
    createManagedAccount,
    programmes,
    academicYears,
    semesters,
    allSubjects,
    addSemesterSubject,
    facultyAllocations,
    saveFacultyAllocation,
    assignments,
    allExaminations,
    issuedCertificates,
    issueCertificate,
    revokeCertificate,
    auditLogs,
    platformConfig,
    updatePlatformConfig,
    projects,
    reviewStudentProject,
    updateSubjectStatus,
  } = usePortal();

  // Create Account State
  const [acctName, setAcctName] = useState('');
  const [acctRole, setAcctRole] = useState<UserRole>('student');
  const [acctUsername, setAcctUsername] = useState('');
  const [acctId, setAcctId] = useState('');
  const [acctEmail, setAcctEmail] = useState('');
  const [acctTempPass, setAcctTempPass] = useState('');
  const [userMgmtError, setUserMgmtError] = useState('');
  const [userMgmtSuccess, setUserMgmtSuccess] = useState('');
  const [issuedResetInfo, setIssuedResetInfo] = useState<{ studentId: string; resetPath: string } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Add Subject State
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSem, setNewSubSem] = useState<number>(2);
  const [newSubCredits] = useState<number>(4);
  const [subjectError, setSubjectError] = useState('');
  const [subjectSuccess, setSubjectSuccess] = useState('');

  // Issue Certificate State
  const [certStudentId, setCertStudentId] = useState('MCA2401');
  const [certTitle, setCertTitle] = useState('');
  const [certCategory, setCertCategory] = useState('Academic Excellence');
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  // Faculty Permission Matrix Draft (supports selecting any faculty account)
  const facultyUsers = userAccounts.filter(u => u.role === 'faculty');
  const defaultFacultyId = facultyAllocations[0]?.facultyId || facultyUsers[0]?.studentId || 'FAC001';
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(defaultFacultyId);
  const activeFacultyUser =
    facultyUsers.find(u => u.studentId === selectedFacultyId) || facultyUsers[0];
  const primaryAllocation =
    facultyAllocations.find(a => a.facultyId === selectedFacultyId) || facultyAllocations[0];
  const [permState, setPermState] = useState<FacultyPermissionKey[]>(
    primaryAllocation?.permissions || activeFacultyUser?.facultyPermissions || []
  );
  const [allocSubjects, setAllocSubjects] = useState<string[]>(
    primaryAllocation?.subjectCodes || activeFacultyUser?.assignedSubjectCodes || ['435C1A', '435C1B', '435E1A', '435C1C']
  );
  const [allocMessage, setAllocMessage] = useState('');

  const handleSelectFacultyAllocation = (facultyId: string) => {
    setSelectedFacultyId(facultyId);
    setAllocMessage('');
    const matchedAlloc = facultyAllocations.find(a => a.facultyId === facultyId);
    const matchedUser = facultyUsers.find(u => u.studentId === facultyId);
    setPermState(matchedAlloc?.permissions || matchedUser?.facultyPermissions || []);
    setAllocSubjects(matchedAlloc?.subjectCodes || matchedUser?.assignedSubjectCodes || []);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMgmtError('');
    setUserMgmtSuccess('');
    if (!acctName.trim() || !acctUsername.trim() || !acctId.trim() || !acctTempPass) {
      setUserMgmtError('Full name, Institutional ID, username, and temporary password are required.');
      return;
    }
    const result = await createManagedAccount({
      role: acctRole,
      isActive: true,
      mustChangePassword: true,
      studentId: acctId.trim().toUpperCase(),
      rollNumber: acctId.trim().toUpperCase(),
      username: acctUsername.trim().toLowerCase(),
      name: acctName.trim(),
      email: acctEmail.trim() || `${acctUsername.trim()}@mcasmartcampus.edu`,
      enrollmentYear: 2026,
      batch: 'MCA 2024–2026',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: acctRole === 'student' ? 8.5 : 0,
      targetSGPA: acctRole === 'student' ? 9.0 : 0,
      attendancePercentage: 100,
      completedCredits: 15,
      totalCredits: 19,
      advisorName: 'HCASICAN',
      temporaryPassword: acctTempPass,
    });
    if (!result.ok) {
      setUserMgmtError(result.error || 'Unable to create account.');
      return;
    }
    setUserMgmtSuccess(`Provisioned ${acctRole} account ${acctId.trim().toUpperCase()} with mandatory first-login password setup.`);
    setAcctName('');
    setAcctUsername('');
    setAcctId('');
    setAcctEmail('');
    setAcctTempPass('');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectError('');
    setSubjectSuccess('');
    const cleanCode = newSubCode.trim().toUpperCase();
    const cleanName = newSubName.trim();
    if (!/^[A-Z0-9-]{3,16}$/.test(cleanCode)) {
      setSubjectError('Course code must be 3–16 alphanumeric characters (e.g. 435C2A).');
      return;
    }
    if (cleanName.length < 3) {
      setSubjectError('Subject title must be at least 3 characters.');
      return;
    }
    if (allSubjects.some(s => s.code.toUpperCase() === cleanCode)) {
      setSubjectError(`Subject code ${cleanCode} already exists in the curriculum.`);
      return;
    }
    addSemesterSubject({
      code: cleanCode,
      name: cleanName,
      credits: newSubCredits,
      type: 'Core',
      status: 'Upcoming',
      isAvailable: true,
      semester: newSubSem,
      totalModules: 5,
      instructor: 'HCASICAN',
      iconName: 'BookOpen',
      description: `MCA Semester ${newSubSem} configured subject managed by Institutional Admin.`,
      units: [
        { unitNumber: 1, title: 'Unit 1 Foundations', topics: ['Core Syllabus Concepts'] },
      ],
      referenceBooks: ['Department Syllabus Guide'],
    });
    setSubjectSuccess(`Added Semester ${newSubSem} subject ${cleanCode} · ${cleanName}.`);
    setNewSubCode('');
    setNewSubName('');
  };

  const handleIssueCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim()) return;
    const stu = userAccounts.find(u => u.studentId === certStudentId) || userAccounts[0];
    issueCertificate({
      studentId: stu.studentId,
      studentName: stu.name,
      title: certTitle.trim(),
      category: certCategory,
      certificateCode: `SC-MCA-${Date.now().toString().slice(-5)}`,
      issuedBy: 'Academic Administrator',
    });
    setCertTitle('');
  };

  const savePermissions = () => {
    const matchedAlloc = facultyAllocations.find(a => a.facultyId === selectedFacultyId);
    const matchedUser = facultyUsers.find(u => u.studentId === selectedFacultyId);
    const targetId = matchedAlloc?.facultyId || matchedUser?.studentId || selectedFacultyId;
    if (!targetId) return;
    saveFacultyAllocation({
      id: matchedAlloc?.id || `alloc-${targetId.toLowerCase()}`,
      facultyId: targetId,
      facultyName: matchedAlloc?.facultyName || matchedUser?.name || targetId,
      facultyUsername: matchedAlloc?.facultyUsername || matchedUser?.username || targetId.toLowerCase(),
      studentGroupLabel: matchedAlloc?.studentGroupLabel || 'MCA 2024–2026 Cohort',
      subjectCodes: allocSubjects,
      permissions: permState,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    setAllocMessage(`Saved ${allocSubjects.length} subject(s) and ${permState.length} permission(s) for ${matchedUser?.name || matchedAlloc?.facultyName || targetId}.`);
  };

  if (currentPage === 'admin-overview') {
    const activeStudents = userAccounts.filter(u => u.role === 'student' && u.isActive).length;
    const activeFaculty = userAccounts.filter(u => u.role === 'faculty' && u.isActive).length;

    return (
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Institutional Governance Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight">
            Admin Command Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
            Control accounts, Semesters 1–4 subjects, faculty permission matrices, campus showcase approvals, and audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232]">
            <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">Active Students</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{activeStudents}</p>
            <button onClick={() => setCurrentPage('admin-users')} className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline">
              Manage Accounts →
            </button>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#795548]">
            <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">Faculty Coordinators</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{activeFaculty}</p>
            <button onClick={() => setCurrentPage('admin-allocations')} className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline">
              Permission Matrix →
            </button>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#F2C94C]">
            <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">Configured Subjects</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{allSubjects.length}</p>
            <button onClick={() => setCurrentPage('admin-academics')} className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline">
              Semesters 1–4 →
            </button>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#292929]">
            <span className="text-xs text-[#795548] dark:text-[#BDB7B2]">Audit Log Events</span>
            <p className="text-3xl font-extrabold font-mono tabular-nums mt-1">{auditLogs.length}</p>
            <button onClick={() => setCurrentPage('admin-audit-logs')} className="text-[11px] font-bold text-[#B83232] dark:text-[#F2C94C] mt-2 hover:underline">
              Inspect Trail →
            </button>
          </div>
        </div>

        <AcademicIntelligenceView mode="admin" />
      </div>
    );
  }

  if (currentPage === 'admin-users') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B83232]" />
            <span>User, Student & Faculty Account Management</span>
          </h1>
          <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
            Provision role accounts with temporary passwords, reassign roles, activate/deactivate access, and issue time-limited reset links.
          </p>
        </div>

        {userMgmtError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{userMgmtError}</span>
          </div>
        )}

        {userMgmtSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{userMgmtSuccess}</span>
          </div>
        )}

        {issuedResetInfo && (
          <div className="p-4 rounded-xl bg-[#F2C94C]/15 border border-[#F2C94C]/50 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#292929] dark:text-[#F2C94C]">
                Time-Limited Reset Link Issued for {issuedResetInfo.studentId} (15-min TTL)
              </span>
              <button
                type="button"
                onClick={() => setIssuedResetInfo(null)}
                className="text-[11px] font-bold underline text-[#B83232] dark:text-[#F2C94C]"
              >
                Dismiss
              </button>
            </div>
            <p className="font-mono text-[11px] break-all bg-white dark:bg-[#1E1E1E] p-2 rounded border border-[#E5DFD9] dark:border-[#3D3835]">
              {issuedResetInfo.resetPath}
            </p>
          </div>
        )}

        <form onSubmit={handleCreateAccount} className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
          <input type="text" required value={acctName} onChange={e => setAcctName(e.target.value)} placeholder="Full Name" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <input type="text" required value={acctId} onChange={e => setAcctId(e.target.value)} placeholder="ID (e.g. MCA2404)" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono" />
          <input type="text" required value={acctUsername} onChange={e => setAcctUsername(e.target.value)} placeholder="Username" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <input type="email" value={acctEmail} onChange={e => setAcctEmail(e.target.value)} placeholder="Email" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <input type="password" required minLength={8} value={acctTempPass} onChange={e => setAcctTempPass(e.target.value)} placeholder="Temporary Password" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <select value={acctRole} onChange={e => setAcctRole(e.target.value as UserRole)} className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Create User
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={userSearchQuery}
            onChange={e => setUserSearchQuery(e.target.value)}
            placeholder="Filter accounts by User ID, username, role, or name..."
            aria-label="Filter user accounts"
            className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] text-xs"
          />
          <span className="text-[11px] text-[#795548] dark:text-[#BDB7B2] font-mono">
            Showing{' '}
            {
              userAccounts.filter(a => {
                const q = userSearchQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                  a.studentId.toLowerCase().includes(q) ||
                  a.username.toLowerCase().includes(q) ||
                  a.name.toLowerCase().includes(q) ||
                  (a.role || 'student').toLowerCase().includes(q)
                );
              }).length
            }{' '}
            of {userAccounts.length} accounts (passwords hashed & never displayed)
          </span>
        </div>

        <div className="space-y-2.5">
          {userAccounts
            .filter(a => {
              const q = userSearchQuery.trim().toLowerCase();
              if (!q) return true;
              return (
                a.studentId.toLowerCase().includes(q) ||
                a.username.toLowerCase().includes(q) ||
                a.name.toLowerCase().includes(q) ||
                (a.role || 'student').toLowerCase().includes(q)
              );
            })
            .map(acct => {
            const isSelf = currentUser?.id === acct.id || currentUser?.studentId === acct.studentId;
            return (
              <div key={acct.id} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#292929] text-[#F2C94C]">
                      {(acct.role || 'student').toUpperCase()}
                    </span>
                    <span className="font-bold text-sm">{acct.name}</span>
                    <span className="font-mono text-[#795548] dark:text-[#BDB7B2]">({acct.studentId} · @{acct.username})</span>
                    {acct.mustChangePassword && (
                      <span className="px-2 py-0.5 rounded bg-[#F2C94C]/25 text-[#795548] dark:text-[#F2C94C] font-bold text-[10px]">
                        First-Login Setup Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">{acct.email} · {acct.batch}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Change role for ${acct.username}`}
                    value={acct.role || 'student'}
                    disabled={isSelf}
                    onChange={async e => {
                      setUserMgmtError('');
                      const res = await changeUserRoleAccount(acct.id, e.target.value as UserRole);
                      if (!res.ok) setUserMgmtError(res.error || 'Role update failed.');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-semibold disabled:opacity-50"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    type="button"
                    onClick={async () => {
                      setUserMgmtError('');
                      const res = await initiateUserPasswordReset(acct.id);
                      if (!res.ok) {
                        setUserMgmtError(res.error || 'Unable to generate reset link.');
                        return;
                      }
                      if (res.resetPath) {
                        setIssuedResetInfo({ studentId: acct.studentId, resetPath: res.resetPath });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg font-bold bg-[#292929] text-[#F2C94C] hover:bg-black flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Issue Reset Link</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSelf}
                    onClick={async () => {
                      setUserMgmtError('');
                      const res = await toggleUserAccountActive(acct.id);
                      if (!res.ok) setUserMgmtError(res.error || 'Unable to update status.');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 ${
                      acct.isActive ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                    }`}
                  >
                    {acct.isActive ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentPage === 'admin-academics') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#B83232]" />
            <span>MCA Programme, Academic Years & Semesters 1–4</span>
          </h1>
          <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
            Semester 1 preserves the 4 confirmed courses cleanly. Configure Semesters 2–4 subjects dynamically here.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {programmes.map(p => (
            <div key={p.id} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]">
              <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">{p.code}</span>
              <p className="font-bold text-sm mt-0.5">{p.name}</p>
              <p className="text-[#795548] dark:text-[#BDB7B2]">{p.durationSemesters} Semesters · {p.totalCredits} Credits · {p.status}</p>
            </div>
          ))}
          {academicYears.map(ay => (
            <div key={ay.id} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835]">
              <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">Academic Year {ay.label}</span>
              <p className="font-bold text-sm mt-0.5">{ay.programmeCode} Cohort</p>
              <p className="text-[#795548] dark:text-[#BDB7B2]">Status: {ay.status} {ay.isCurrent ? '(Current Term)' : ''}</p>
            </div>
          ))}
        </div>

        {subjectError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{subjectError}</span>
          </div>
        )}

        {subjectSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{subjectSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAddSubject} className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <select value={newSubSem} onChange={e => setNewSubSem(Number(e.target.value))} className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
            <option value={2}>Semester 2</option>
            <option value={3}>Semester 3</option>
            <option value={4}>Semester 4</option>
          </select>
          <input type="text" required value={newSubCode} onChange={e => setNewSubCode(e.target.value)} placeholder="Course Code (e.g. 435C2A)" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-mono" />
          <input type="text" required value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Subject Title" className="sm:col-span-2 p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold">Add Subject</button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {semesters.map(sem => (
            <div key={sem.id} className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold">{sem.title}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C]">{sem.status}</span>
              </div>
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">{sem.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allSubjects.filter(s => (s.semester ?? 1) === sem.number).map(s => (
                  <span key={s.code} className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
                    {s.code} · {s.name} ({s.status || 'Upcoming'})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Subject Status & Availability Governance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
              Subject Lifecycle Status &amp; Availability Governance
            </h2>
            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
              Control whether each course is Upcoming, Active, or Completed and toggle student availability.
            </p>
          </div>
          <div className="space-y-2.5 text-xs">
            {allSubjects.map(sub => (
              <div
                key={sub.code}
                className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">
                    {sub.code}
                  </span>
                  <span className="mx-2 font-bold text-[#292929] dark:text-[#F7F5F2]">{sub.name}</span>
                  <span className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                    Sem {sub.semester ?? 1} · {sub.isAvailable === false ? 'Locked' : 'Available to Students'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Status for ${sub.code}`}
                    value={sub.status || 'Upcoming'}
                    onChange={e =>
                      updateSubjectStatus(
                        sub.code,
                        e.target.value as SubjectStatus,
                        sub.isAvailable !== false
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] font-bold"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      updateSubjectStatus(
                        sub.code,
                        sub.status || 'Upcoming',
                        sub.isAvailable === false
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
                      sub.isAvailable === false
                        ? 'bg-rose-50 text-[#B83232] border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                    }`}
                  >
                    {sub.isAvailable === false ? 'Locked' : 'Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin-allocations') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#B83232]" />
            <span>Faculty Subject Allocations & Granular Permission Controls</span>
          </h1>
          <p className="text-xs text-[#795548] dark:text-[#BDB7B2] mt-1">
            Assign exact subject codes and toggle individual evaluation, material, challenge, and skill verification capabilities for faculty.
          </p>
        </div>

        {allocMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{allocMessage}</span>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DFD9] dark:border-[#3D3835] pb-3">
            <div className="space-y-1">
              <label htmlFor="faculty-allocation-select" className="block text-[11px] font-bold uppercase text-[#795548] dark:text-[#F2C94C]">
                Selected Faculty Coordinator
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="faculty-allocation-select"
                  value={selectedFacultyId}
                  onChange={e => handleSelectFacultyAllocation(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-bold"
                >
                  {facultyUsers.map(f => (
                    <option key={f.studentId} value={f.studentId}>
                      {f.name} ({f.studentId} · @{f.username})
                    </option>
                  ))}
                  {facultyUsers.length === 0 && primaryAllocation && (
                    <option value={primaryAllocation.facultyId}>
                      {primaryAllocation.facultyName} ({primaryAllocation.facultyId})
                    </option>
                  )}
                </select>
                <span className="text-[#795548] dark:text-[#BDB7B2]">
                  Cohort: {primaryAllocation?.studentGroupLabel || 'MCA 2024–2026 Cohort'}
                </span>
              </div>
            </div>
            <button type="button" onClick={savePermissions} className="px-4 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Save Allocation & Permissions
            </button>
          </div>

          <div>
            <h3 className="font-bold uppercase text-[11px] text-[#795548] dark:text-[#F2C94C] mb-2">Allocated Subject Codes</h3>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(sub => {
                const checked = allocSubjects.includes(sub.code);
                return (
                  <label key={sub.code} className="px-3 py-2 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e =>
                        setAllocSubjects(prev =>
                          e.target.checked ? [...prev, sub.code] : prev.filter(c => c !== sub.code)
                        )
                      }
                    />
                    <span className="font-mono font-bold">{sub.code}</span>
                    <span>{sub.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-[11px] text-[#795548] dark:text-[#F2C94C] mb-2">Granular Permission Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ALL_FACULTY_PERMISSION_KEYS.map(perm => {
                const enabled = permState.includes(perm.key);
                return (
                  <label key={perm.key} className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={e =>
                        setPermState(prev =>
                          e.target.checked ? [...prev, perm.key] : prev.filter(k => k !== perm.key)
                        )
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-[#292929] dark:text-[#F7F5F2]">{perm.label}</p>
                      <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">{perm.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin-assessments' || currentPage === 'admin-results') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#B83232]" />
          <span>{currentPage === 'admin-assessments' ? 'Institutional Assessments & Exams Control' : 'Evaluation & Results Governance'}</span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
            <h2 className="text-sm font-extrabold">Registered Assignments ({assignments.length})</h2>
            {assignments.map(a => (
              <div key={a.id} className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] flex justify-between">
                <span><strong>{a.subjectCode}</strong> · {a.title}</span>
                <span className="font-mono font-bold text-[#B83232] dark:text-[#F2C94C]">{a.status}</span>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
            <h2 className="text-sm font-extrabold">Scheduled Examinations ({allExaminations.length})</h2>
            {allExaminations.map(ex => (
              <div key={ex.id} className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] flex justify-between">
                <span><strong>{ex.subjectCode}</strong> · {ex.title}</span>
                <span className="font-mono font-bold text-[#795548] dark:text-[#F2C94C]">{ex.totalMarks} Marks</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin-materials') {
    return <FacultyDocumentManagement />;
  }

  if (currentPage === 'admin-notices') {
    return <ImportantNoticesSection allowManagement={true} />;
  }

  if (currentPage === 'admin-certificates') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-[#B83232]" />
          <span>Institutional Certificates</span>
        </h1>

        <form onSubmit={handleIssueCert} className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <select value={certStudentId} onChange={e => setCertStudentId(e.target.value)} className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
            {userAccounts.filter(u => u.role === 'student').map(s => (
              <option key={s.id} value={s.studentId}>{s.studentId} · {s.name}</option>
            ))}
          </select>
          <input type="text" required value={certTitle} onChange={e => setCertTitle(e.target.value)} placeholder="Certificate title" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <input type="text" value={certCategory} onChange={e => setCertCategory(e.target.value)} placeholder="Category" className="p-2.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]" />
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white font-bold">Issue Certificate</button>
        </form>

        <div className="space-y-2.5 text-xs">
          {issuedCertificates.map(cert => (
            <div key={cert.id} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">{cert.title}</p>
                <p className="text-[#795548] dark:text-[#BDB7B2] font-mono">{cert.studentName} ({cert.studentId}) · Code: {cert.certificateCode} · Status: {cert.status}</p>
              </div>
              {cert.status === 'Issued' && (
                confirmRevokeId === cert.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        revokeCertificate(cert.id);
                        setConfirmRevokeId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#B83232] text-white font-bold"
                    >
                      Confirm Revoke
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRevokeId(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRevokeId(cert.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold"
                  >
                    Revoke
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentPage === 'admin-analytics') {
    return <AcademicIntelligenceView mode="admin" />;
  }

  if (currentPage === 'admin-features' || currentPage === 'admin-settings') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          {currentPage === 'admin-features' ? <Sliders className="w-6 h-6 text-[#B83232]" /> : <Settings className="w-6 h-6 text-[#B83232]" />}
          <span>{currentPage === 'admin-features' ? 'MCA Smart Campus Module Governance' : 'Institutional System Settings'}</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {([
            { key: 'aiTutorEnabled', label: 'Grounded AI Subject Tutor & Study Packs' },
            { key: 'isolatedPythonRunnerEnabled', label: 'Isolated Server-Side Python 3 Coding Runner' },
            { key: 'projectShowcaseEnabled', label: 'Approved Campus Project Showcase' },
          ] as { key: keyof typeof platformConfig; label: string }[]).map(item => (
            <label key={item.key} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-between cursor-pointer">
              <span className="font-bold">{item.label}</span>
              <input
                type="checkbox"
                checked={Boolean(platformConfig[item.key])}
                onChange={e => updatePlatformConfig({ [item.key]: e.target.checked })}
              />
            </label>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3 text-xs">
          <h2 className="text-sm font-extrabold">Approved Campus Project Showcase Queue</h2>
          {projects.map(p => (
            <div key={p.id} className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] flex items-center justify-between gap-3">
              <span><strong>{p.title}</strong> ({p.studentName})</span>
              <button onClick={() => reviewStudentProject(p.id, 'Verified', p.facultyFeedback || 'Admin Showcase Approved', !p.approvedForShowcase)} className="px-3 py-1 rounded bg-[#292929] text-[#F2C94C] font-bold">
                {p.approvedForShowcase ? 'Showcase Active' : 'Approve Showcase'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-[#B83232]" />
        <span>Institutional Audit Logs ({auditLogs.length})</span>
      </h1>
      <div className="space-y-2.5 text-xs">
        {auditLogs.map(log => (
          <div key={log.id} className="p-4 rounded-xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-sm">{log.action}</p>
              <p className="text-[#795548] dark:text-[#BDB7B2]">{log.target} · By {log.actorName} ({log.actorRole})</p>
            </div>
            <span className="font-mono text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">{log.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
