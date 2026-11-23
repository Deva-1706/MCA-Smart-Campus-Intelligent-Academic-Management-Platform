// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import { app, resetAuthStateForTests, ensureDemoAccountsInDev, hashPassword, verifyPassword, validatePasswordStrength } from '../../server';

const DEMO_STUDENT_PASS = ['McaDemo', '@2026!'].join('');
const DEMO_FACULTY_PASS = ['Faculty', '@2026!'].join('');
const DEMO_ADMIN_PASS = ['Admin', '@2026!'].join('');

function extractCookiePair(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const first = setCookieHeader.split(';')[0]?.trim();
  if (!first || first.endsWith('=')) return null;
  return first;
}

describe('Backend Authentication, RBAC & Identity Security Audit (Real Express HTTP)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>(resolve => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    resetAuthStateForTests();
  });

  it('hashes passwords with salted scrypt, validates strength, and never exposes passwords in API responses', async () => {
    const hashed = hashPassword('StrongCampus#2026');
    expect(hashed.startsWith('scrypt$')).toBe(true);
    expect(hashed).not.toContain('StrongCampus#2026');
    expect(verifyPassword('StrongCampus#2026', hashed)).toBe(true);
    expect(verifyPassword('WrongPass#2026', hashed)).toBe(false);

    expect(validatePasswordStrength('short')).toContain('at least 8 characters');
    expect(validatePasswordStrength('12345678')).toContain('numeric');
    expect(validatePasswordStrength('password')).toContain('common');
    expect(
      validatePasswordStrength('mca_demo_student123', {
        username: 'mca_demo_student',
        email: 'devanath016@gmail.com',
        studentId: 'MCA2401',
        name: 'Devanath N',
      })
    ).toContain('cannot contain');
    expect(validatePasswordStrength('CampusValid#2026')).toBeNull();

    const demoInfoRes = await fetch(`${baseUrl}/api/auth/demo-info`);
    const demoInfoText = await demoInfoRes.text();
    expect(demoInfoText).not.toContain(DEMO_STUDENT_PASS);
    expect(demoInfoText).not.toContain(DEMO_FACULTY_PASS);
    expect(demoInfoText).not.toContain(DEMO_ADMIN_PASS);
    expect(demoInfoText).not.toContain('passwordHint');
  });

  it('authenticates Student, Faculty, and Admin via email/ID/username, sets HttpOnly cookies, and blocks wrong-role portals', async () => {
    // Student email login
    const stuRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'devanath016@gmail.com', password: DEMO_STUDENT_PASS, expectedRole: 'student' }),
    });
    expect(stuRes.status).toBe(200);
    const stuCookieHeader = stuRes.headers.get('set-cookie') || '';
    expect(stuCookieHeader).toContain('HttpOnly');
    expect(stuCookieHeader).toContain('SameSite=Lax');
    const stuBody = await stuRes.json();
    expect(stuBody.user.role).toBe('student');
    expect(stuBody.user.passwordHash).toBeUndefined();

    // Student cannot sign in via Admin or Faculty login portals
    const wrongAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'admin' }),
    });
    expect(wrongAdmin.status).toBe(403);

    // Faculty email login
    const facRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'hcasican@mcasmartcampus.edu', password: DEMO_FACULTY_PASS, expectedRole: 'faculty' }),
    });
    expect(facRes.status).toBe(200);
    const facBody = await facRes.json();
    expect(facBody.user.role).toBe('faculty');

    // Admin email login
    const admRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin@mcasmartcampus.edu', password: DEMO_ADMIN_PASS, expectedRole: 'admin' }),
    });
    expect(admRes.status).toBe(200);
    const admBody = await admRes.json();
    expect(admBody.user.role).toBe('admin');
  });

  it('enforces unauthenticated blocking, cross-role route 403s, and real session revocation on logout', async () => {
    // Unauthenticated hits return 401
    expect((await fetch(`${baseUrl}/api/admin/users`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/student/records`)).status).toBe(401);
    expect(
      (
        await fetch(`${baseUrl}/api/faculty/question-bank`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjectCode: '435C1A', prompt: 'x', answer: 'y' }),
        })
      ).status
    ).toBe(401);

    // Forged legacy mca_tok_ cookie must be rejected
    const forgedSession = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Cookie: 'mca_session_token=mca_tok_mca2401_forged' },
    });
    expect((await forgedSession.json()).authenticated).toBe(false);

    // Log in as student and verify cookie works on student endpoint, blocked on admin/faculty endpoints
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student' }),
    });
    const cookie = extractCookiePair(loginRes.headers.get('set-cookie'))!;
    expect(cookie).toBeTruthy();

    expect((await fetch(`${baseUrl}/api/student/records`, { headers: { Cookie: cookie } })).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: cookie } })).status).toBe(403);

    // Student cannot access another student's records
    expect(
      (await fetch(`${baseUrl}/api/student/records?studentId=MCA2402`, { headers: { Cookie: cookie } })).status
    ).toBe(403);

    // Logout immediately invalidates server session
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    expect(logoutRes.status).toBe(200);
    const afterLogout = await fetch(`${baseUrl}/api/student/records`, { headers: { Cookie: cookie } });
    expect(afterLogout.status).toBe(401);
  });

  it('locks out login attempts with HTTP 429 after 5 failed passwords', async () => {
    for (let i = 0; i < 4; i++) {
      const r = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'MCA2401', password: 'WrongPassword!1', expectedRole: 'student' }),
      });
      expect(r.status).toBe(401);
    }
    const fifth = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: 'WrongPassword!1', expectedRole: 'student' }),
    });
    expect(fifth.status).toBe(429);

    // Even valid password is locked out cleanly while lockout window is active
    const duringLockout = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student' }),
    });
    expect(duringLockout.status).toBe(429);
  });

  it('supports Admin account provisioning, forced first-login password setup, inactive account blocking, and tokenized password reset', async () => {
    const admLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ADM001', password: DEMO_ADMIN_PASS, expectedRole: 'admin' }),
    });
    const adminCookie = extractCookiePair(admLogin.headers.get('set-cookie'))!;

    // Admin creates a new faculty account with temporary password -> mustChangePassword=true
    const createRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Dr. Priya Nair',
        studentId: 'FAC002',
        username: 'priya_faculty',
        email: 'priya.nair@mcasmartcampus.edu',
        role: 'faculty',
        temporaryPassword: 'TempFaculty#2026!',
      }),
    });
    expect(createRes.status).toBe(201);
    const createdText = await createRes.text();
    expect(createdText).not.toContain('TempFaculty#2026!');
    expect(createdText).not.toContain('passwordHash');
    const createdJson = JSON.parse(createdText);
    expect(createdJson.user.mustChangePassword).toBe(true);

    // Log in as new faculty -> receives mustChangePassword=true and is blocked from faculty actions until setup completes
    const facFirstLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'priya_faculty', password: 'TempFaculty#2026!', expectedRole: 'faculty' }),
    });
    expect(facFirstLogin.status).toBe(200);
    expect((await facFirstLogin.json()).mustChangePassword).toBe(true);
    let facCookie = extractCookiePair(facFirstLogin.headers.get('set-cookie'))!;

    const blockedBeforeSetup = await fetch(`${baseUrl}/api/faculty/question-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ subjectCode: '435C1A', prompt: 'Should wait', answer: 'Yes' }),
    });
    expect(blockedBeforeSetup.status).toBe(403);
    expect((await blockedBeforeSetup.json()).code).toBe('MUST_CHANGE_PASSWORD');

    // Weak password rejected on change-password
    const weakChange = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ currentPassword: 'TempFaculty#2026!', newPassword: 'password', confirmPassword: 'password' }),
    });
    expect(weakChange.status).toBe(400);

    // Strong password completes setup & rotates session cookie
    const goodChange = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({
        currentPassword: 'TempFaculty#2026!',
        newPassword: 'CampusMentor#2026!',
        confirmPassword: 'CampusMentor#2026!',
      }),
    });
    expect(goodChange.status).toBe(200);
    facCookie = extractCookiePair(goodChange.headers.get('set-cookie'))!;

    // Now faculty endpoint works cleanly for allocated subject 435C1A
    const unlockedWrite = await fetch(`${baseUrl}/api/faculty/question-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ subjectCode: '435C1A', prompt: 'Graph isomorphism invariant?', answer: 'Degree sequence.' }),
    });
    expect(unlockedWrite.status).toBe(201);

    // Admin deactivates FAC002 -> existing session invalidated & new login returns 403
    const toggleRes = await fetch(`${baseUrl}/api/admin/users/FAC002/toggle-active`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
    });
    expect(toggleRes.status).toBe(200);
    expect((await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: facCookie } }).then(r => r.json())).authenticated).toBe(false);

    const disabledLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'FAC002', password: 'CampusMentor#2026!', expectedRole: 'faculty' }),
    });
    expect(disabledLogin.status).toBe(403);

    // Admin issues time-limited reset token for MCA2401 without exposing any password
    const resetInit = await fetch(`${baseUrl}/api/admin/users/MCA2401/reset-password`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    expect(resetInit.status).toBe(200);
    const { resetToken } = await resetInit.json();
    expect(resetToken).toBeTruthy();

    const resetDone = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken,
        newPassword: 'ResetCampus#2026!',
        confirmPassword: 'ResetCampus#2026!',
      }),
    });
    expect(resetDone.status).toBe(200);

    // Token is single-use: second reuse fails
    const resetReuse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken,
        newPassword: 'AnotherPass#2026!',
        confirmPassword: 'AnotherPass#2026!',
      }),
    });
    expect(resetReuse.status).toBe(400);

    // Audit logs are accessible to Admin and contain auth trail without passwords
    const logsRes = await fetch(`${baseUrl}/api/admin/audit-logs`, { headers: { Cookie: adminCookie } });
    expect(logsRes.status).toBe(200);
    const logsText = await logsRes.text();
    expect(logsText).toContain('Created FACULTY Account');
    expect(logsText).not.toContain('PriyaStrong#2026!');
    expect(logsText).not.toContain('ResetCampus#2026!');
  });

  it('enforces Faculty subject allocations and individual permissions on every protected backend call', async () => {
    const admLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ADM001', password: DEMO_ADMIN_PASS, expectedRole: 'admin' }),
    });
    const adminCookie = extractCookiePair(admLogin.headers.get('set-cookie'))!;

    // Restrict FAC001 to 435C1A only, with 'create_assessments' only (remove evaluate_submissions)
    const allocRes = await fetch(`${baseUrl}/api/admin/allocations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        facultyId: 'FAC001',
        subjectCodes: ['435C1A'],
        permissions: ['create_assessments'],
      }),
    });
    expect(allocRes.status).toBe(200);

    const facLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'FAC001', password: DEMO_FACULTY_PASS, expectedRole: 'faculty' }),
    });
    const facCookie = extractCookiePair(facLogin.headers.get('set-cookie'))!;

    // Unallocated subject 435C1B -> 403
    const unallocWrite = await fetch(`${baseUrl}/api/faculty/question-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ subjectCode: '435C1B', prompt: 'AVL balance?', answer: '[-1, 0, 1]' }),
    });
    expect(unallocWrite.status).toBe(403);

    // Allocated subject 435C1A with create_assessments -> 201
    const allocWrite = await fetch(`${baseUrl}/api/faculty/question-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ subjectCode: '435C1A', prompt: 'Eulerian circuit condition?', answer: 'Even degree.' }),
    });
    expect(allocWrite.status).toBe(201);

    // Revoked permission evaluate_submissions -> 403 even on allocated subject
    const evalForbidden = await fetch(`${baseUrl}/api/faculty/evaluations/asg-435c1a-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ subjectCode: '435C1A', marks: 29, feedback: 'Good' }),
    });
    expect(evalForbidden.status).toBe(403);
  });

  it('sets defense-in-depth HTTP security headers and no-store cache control on auth endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/auth/session`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('referrer-policy')).toBe('same-origin');
    expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin');
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('gates AI and Coding Lab routes behind authentication and blocks AST sandbox bypasses', async () => {
    const unauthExec = await fetch(`${baseUrl}/api/coding-lab/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'print(42)' }),
    });
    expect(unauthExec.status).toBe(401);

    const unauthChat = await fetch(`${baseUrl}/api/gemini/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Explain AVL trees' }),
    });
    expect(unauthChat.status).toBe(401);

    const stuLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student' }),
    });
    const stuCookie = extractCookiePair(stuLogin.headers.get('set-cookie'))!;

    const safeRun = await fetch(`${baseUrl}/api/coding-lab/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: stuCookie },
      body: JSON.stringify({ code: 'import math\nprint(math.factorial(5))', expectedStdout: '120' }),
    });
    expect(safeRun.status).toBe(200);
    const safeJson = await safeRun.json();
    expect(safeJson.passed).toBe(true);
    expect(safeJson.stdout.trim()).toBe('120');

    const bypassPayloads = [
      'import sys\nprint(sys.version)',
      'import importlib\nprint(importlib)',
      'print(getattr(__builtins__, "open"))',
      'print((1).__class__.__base__.__subclasses__())',
    ];
    for (const payload of bypassPayloads) {
      const blocked = await fetch(`${baseUrl}/api/coding-lab/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: stuCookie },
        body: JSON.stringify({ code: payload }),
      });
      expect(blocked.status).toBe(403);
      const blockedJson = await blocked.json();
      expect(blockedJson.passed).toBe(false);
    }
  });

  it('validates contact inquiry payloads and clamps faculty evaluation marks between 0 and 100', async () => {
    const badContact = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'not-an-email', message: 'short' }),
    });
    expect(badContact.status).toBe(400);

    const goodContact = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Devanath N',
        email: 'devanath016@gmail.com',
        subject: 'Semester 1 Timetable Query',
        message: 'Please confirm lab batch timings for Python Programming.',
      }),
    });
    expect(goodContact.status).toBe(201);
    const goodContactJson = await goodContact.json();
    expect(goodContactJson.ok).toBe(true);
    expect(goodContactJson.ticketId).toMatch(/^TKT-/);

    const facLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'FAC001', password: DEMO_FACULTY_PASS, expectedRole: 'faculty' }),
    });
    const facCookie = extractCookiePair(facLogin.headers.get('set-cookie'))!;

    for (const badMarks of [-5, 150]) {
      const badEval = await fetch(`${baseUrl}/api/faculty/evaluations/asg-435c1a-01`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: facCookie },
        body: JSON.stringify({ subjectCode: '435C1A', marks: badMarks, feedback: 'Out of bounds' }),
      });
      expect(badEval.status).toBe(400);
    }

    const okEval = await fetch(`${baseUrl}/api/faculty/evaluations/asg-435c1a-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: facCookie },
      body: JSON.stringify({ subjectCode: '435C1A', marks: 92, feedback: 'Well structured solution.' }),
    });
    expect(okEval.status).toBe(200);
  });

  it('requires authentication and validates PDF attachments on /api/pdf-learning/chat', async () => {
    const unauthPdfChat = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Explain BCNF', pdfContext: [] }),
    });
    expect(unauthPdfChat.status).toBe(401);

    const stuLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student' }),
    });
    const stuCookie = extractCookiePair(stuLogin.headers.get('set-cookie'))!;

    const emptyQueryRes = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: stuCookie },
      body: JSON.stringify({ query: '   ', pdfContext: [] }),
    });
    expect(emptyQueryRes.status).toBe(400);

    const invalidAttachmentRes = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: stuCookie },
      body: JSON.stringify({
        query: 'Explain this file',
        uploadedPdfFiles: [{ fileName: 'script.sh', mimeType: 'text/plain', base64Data: 'ZWNobyBoaQ==' }],
      }),
    });
    expect(invalidAttachmentRes.status).toBe(400);

    const chatRes = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: stuCookie },
      body: JSON.stringify({
        subjectCode: '435C1A',
        subjectName: 'Discrete Mathematics',
        query: 'What is a Hasse diagram?',
        pdfContext: [
          {
            fileName: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
            pageReferences: [{ pageNumber: 12, heading: 'Hasse Diagrams', snippet: 'Minimal graphical representation of a finite poset.' }],
          },
        ],
      }),
    });
    if (!process.env.GEMINI_API_KEY) {
      expect(chatRes.status).toBe(503);
      const errBody = await chatRes.json();
      expect(errBody.error).toMatch(/GEMINI_API_KEY/i);
    } else {
      expect(chatRes.status).toBe(200);
      const okBody = await chatRes.json();
      expect(typeof okBody.reply).toBe('string');
      expect(Array.isArray(okBody.citations)).toBe(true);
    }
  });

  it('provisions isolated dev demo accounts (demo_student, demo_faculty, demo_admin), isolates real user data, and disables demo mode in production', async () => {
    // Idempotency: does not duplicate or overwrite existing demo accounts
    expect(ensureDemoAccountsInDev()).toBe(0);

    // 1. /api/auth/demo-info reports dev demoPortalAccess without leaking plaintext passwords
    const infoRes = await fetch(`${baseUrl}/api/auth/demo-info`);
    expect(infoRes.status).toBe(200);
    const infoJson = await infoRes.json();
    expect(infoJson).toEqual({ demoMode: true, demoPortalAccess: true });
    expect(infoJson.portals).toBeUndefined();

    // 2. Demo Student login, cross-role blocking, real-student data isolation, and logout
    const demoStuLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'demo_student', password: 'Student@123', expectedRole: 'student' }),
    });
    expect(demoStuLogin.status).toBe(200);
    const demoStuBody = await demoStuLogin.json();
    expect(demoStuBody.user.role).toBe('student');
    expect(demoStuBody.user.isDemo).toBe(true);
    const demoStuCookie = extractCookiePair(demoStuLogin.headers.get('set-cookie'))!;

    const stuReadRealRes = await fetch(`${baseUrl}/api/student/records?studentId=MCA2401`, {
      headers: { Cookie: demoStuCookie },
    });
    expect(stuReadRealRes.status).toBe(403);

    const wrongPortalDemoStu = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'demo_student', password: 'Student@123', expectedRole: 'admin' }),
    });
    expect(wrongPortalDemoStu.status).toBe(403);

    await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: demoStuCookie } });

    // 3. Demo Faculty login & role verification
    const demoFacLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'demo_faculty', password: 'Faculty@123', expectedRole: 'faculty' }),
    });
    expect(demoFacLogin.status).toBe(200);
    const demoFacBody = await demoFacLogin.json();
    expect(demoFacBody.user.role).toBe('faculty');
    expect(demoFacBody.user.isDemo).toBe(true);
    const demoFacCookie = extractCookiePair(demoFacLogin.headers.get('set-cookie'))!;
    expect((await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: demoFacCookie } })).status).toBe(403);

    // 4. Demo Admin login & real-user isolation
    const demoAdmLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'demo_admin', password: 'Admin@123', expectedRole: 'admin' }),
    });
    expect(demoAdmLogin.status).toBe(200);
    const demoAdmCookie = extractCookiePair(demoAdmLogin.headers.get('set-cookie'))!;

    const demoAdmUsersRes = await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: demoAdmCookie } });
    expect(demoAdmUsersRes.status).toBe(200);
    const demoAdmUsersJson = await demoAdmUsersRes.json();
    expect(demoAdmUsersJson.users.every((u: any) => u.isDemo === true)).toBe(true);
    expect(demoAdmUsersJson.users.some((u: any) => u.studentId === 'MCA2401' || u.studentId === 'ADM001')).toBe(false);

    // Demo Admin cannot modify real accounts or lock out built-in demo accounts
    const mutateRealRes = await fetch(`${baseUrl}/api/admin/users/MCA2401/toggle-active`, {
      method: 'PATCH',
      headers: { Cookie: demoAdmCookie },
    });
    expect(mutateRealRes.status).toBe(403);

    const disableBuiltInDemo = await fetch(`${baseUrl}/api/admin/users/demo-std-01/toggle-active`, {
      method: 'PATCH',
      headers: { Cookie: demoAdmCookie },
    });
    expect(disableBuiltInDemo.status).toBe(400);

    const stripDemoRole = await fetch(`${baseUrl}/api/admin/users/demo-fac-01/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: demoAdmCookie },
      body: JSON.stringify({ role: 'student' }),
    });
    expect(stripDemoRole.status).toBe(400);

    // 5. Production safeguard: NODE_ENV=production hides demo info, disables demo-enter (403), and disables demo logins/seeding
    const prevNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      expect(ensureDemoAccountsInDev()).toBe(0);

      const prodInfoRes = await fetch(`${baseUrl}/api/auth/demo-info`);
      const prodInfoJson = await prodInfoRes.json();
      expect(prodInfoJson).toEqual({ demoMode: false, demoPortalAccess: false });

      const prodDemoEnter = await fetch(`${baseUrl}/api/auth/demo-enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      expect(prodDemoEnter.status).toBe(403);

      const prodDemoAdminAttempt = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo_admin', password: 'Admin@123', expectedRole: 'admin' }),
      });
      expect(prodDemoAdminAttempt.status).toBe(401);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it('enforces CSRF double-submit tokens, HTTPS SameSite=None cookies, multi-cookie session resilience, and role/subject authorization on /api/pdf-learning/chat', async () => {
    // 1. Fetch CSRF token endpoint
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    expect(csrfRes.status).toBe(200);
    const csrfBody = await csrfRes.json();
    expect(typeof csrfBody.csrfToken).toBe('string');
    const csrfCookiePair = `mca_csrf_token=${encodeURIComponent(csrfBody.csrfToken)}`;

    // 2. HTTPS reverse proxy (e.g., AI Studio iframe) receives SameSite=None; Secure cookies
    const httpsLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Proto': 'https',
        Cookie: csrfCookiePair,
        'X-CSRF-Token': csrfBody.csrfToken,
      },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student' }),
    });
    expect(httpsLogin.status).toBe(200);
    const httpsSetCookie = httpsLogin.headers.get('set-cookie') || '';
    expect(httpsSetCookie).toContain('SameSite=None');
    expect(httpsSetCookie).toContain('Secure');
    const stuCookie = extractCookiePair(httpsSetCookie)!;

    // 3. Multi-cookie resilience: legacy/forged mca_tok_ cookie BEFORE valid HttpOnly token still authenticates cleanly
    const combinedCookie = `mca_session_token=mca_tok_legacy_stale; ${stuCookie}; ${csrfCookiePair}`;
    const sessCheck = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: combinedCookie } });
    expect((await sessCheck.json()).authenticated).toBe(true);

    // 4. CSRF mismatch or missing X-CSRF-Token when CSRF cookie is present returns 403 CSRF_INVALID
    const missingCsrf = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: combinedCookie,
      },
      body: JSON.stringify({
        subjectCode: '435C1A',
        query: 'Explain propositional tautology',
        pdfContext: [{ fileName: 'notes.pdf', subjectCode: '435C1A' }],
      }),
    });
    expect(missingCsrf.status).toBe(403);
    expect((await missingCsrf.json()).code).toBe('CSRF_INVALID');

    // 5. Student querying unauthorized subject scope returns 403
    const stuForbiddenSubj = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: combinedCookie,
        'X-CSRF-Token': csrfBody.csrfToken,
      },
      body: JSON.stringify({
        subjectCode: 'UNAUTH99',
        query: 'Explain restricted material',
        pdfContext: [{ fileName: 'secret.pdf', subjectCode: 'UNAUTH99' }],
      }),
    });
    expect(stuForbiddenSubj.status).toBe(403);

    // 6. Student querying authorized subject with valid CSRF + multi-cookie is authenticated (never 401/403)
    const stuAllowedChat = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: combinedCookie,
        'X-CSRF-Token': csrfBody.csrfToken,
      },
      body: JSON.stringify({
        subjectCode: '435C1A',
        subjectName: 'Discrete Mathematics',
        query: 'Explain propositional equivalence',
        pdfContext: [{ fileName: 'MCA-435C1A.pdf', subjectCode: '435C1A' }],
      }),
    });
    expect([200, 503]).toContain(stuAllowedChat.status);

    // 7. Faculty authorization: FAC001 restricted to 435C1A cannot query unallocated 435C1B, but can query 435C1A
    const admLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ADM001', password: DEMO_ADMIN_PASS, expectedRole: 'admin' }),
    });
    const adminCookie = extractCookiePair(admLogin.headers.get('set-cookie'))!;
    await fetch(`${baseUrl}/api/admin/allocations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ facultyId: 'FAC001', subjectCodes: ['435C1A'], permissions: ['manage_materials'] }),
    });

    const facLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'FAC001', password: DEMO_FACULTY_PASS, expectedRole: 'faculty' }),
    });
    const facCookie = extractCookiePair(facLogin.headers.get('set-cookie'))!;

    const facUnallocChat = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `${facCookie}; ${csrfCookiePair}`, 'X-CSRF-Token': csrfBody.csrfToken },
      body: JSON.stringify({
        subjectCode: '435C1B',
        query: 'Explain AVL trees',
        pdfContext: [{ fileName: 'DSA.pdf', subjectCode: '435C1B' }],
      }),
    });
    expect(facUnallocChat.status).toBe(403);

    const facAllocChat = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `${facCookie}; ${csrfCookiePair}`, 'X-CSRF-Token': csrfBody.csrfToken },
      body: JSON.stringify({
        subjectCode: '435C1A',
        query: 'Explain Hasse diagrams',
        pdfContext: [{ fileName: 'DM.pdf', subjectCode: '435C1A' }],
      }),
    });
    expect([200, 503]).toContain(facAllocChat.status);

    // 8. Admin can query any institutional subject cleanly
    const admChat = await fetch(`${baseUrl}/api/pdf-learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `${adminCookie}; ${csrfCookiePair}`, 'X-CSRF-Token': csrfBody.csrfToken },
      body: JSON.stringify({
        subjectCode: '435C1B',
        query: 'Audit course syllabus coverage',
        pdfContext: [{ fileName: 'DSA.pdf', subjectCode: '435C1B' }],
      }),
    });
    expect([200, 503]).toContain(admChat.status);
  });

  it('extends session expiry and stores username in an AES-256-GCM encrypted HttpOnly cookie when Remember Me is enabled', async () => {
    const parseSetCookies = (res: Response): string[] => {
      const getSetCookie = (res.headers as any).getSetCookie;
      if (typeof getSetCookie === 'function') {
        return getSetCookie.call(res.headers);
      }
      const raw = res.headers.get('set-cookie');
      return raw ? [raw] : [];
    };
    const extractNamedCookie = (cookies: string[], name: string): string | null => {
      for (const c of cookies) {
        const pair = c.split(';')[0]?.trim();
        if (pair?.startsWith(`${name}=`)) return pair;
      }
      return null;
    };

    // 1. Standard login (rememberMe: false) -> browser-session cookie (no Max-Age), 12h server TTL, no remembered-user cookie
    const stdLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student', rememberMe: false }),
    });
    expect(stdLogin.status).toBe(200);
    const stdCookies = parseSetCookies(stdLogin);
    const stdSessHeader = stdCookies.find(c => c.startsWith('mca_session_token=')) || '';
    expect(stdSessHeader).toContain('HttpOnly');
    expect(stdSessHeader).not.toContain('Max-Age=');
    expect(extractNamedCookie(stdCookies, 'mca_remembered_user')).toBeNull();
    const stdBody = await stdLogin.json();
    expect(stdBody.rememberMe).toBe(false);
    expect(stdBody.sessionMaxAgeSeconds).toBe(12 * 3600);

    // 2. Remember Me login (rememberMe: true) -> 30-day Max-Age session + encrypted HttpOnly mca_remembered_user cookie
    const remStuLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MCA2401', password: DEMO_STUDENT_PASS, expectedRole: 'student', rememberMe: true }),
    });
    expect(remStuLogin.status).toBe(200);
    const remStuCookies = parseSetCookies(remStuLogin);
    const remSessHeader = remStuCookies.find(c => c.startsWith('mca_session_token=')) || '';
    const remUserHeader = remStuCookies.find(c => c.startsWith('mca_remembered_user=')) || '';
    expect(remSessHeader).toContain('HttpOnly');
    expect(remSessHeader).toContain('Max-Age=2592000');
    expect(remUserHeader).toContain('HttpOnly');
    expect(remUserHeader).toContain('Max-Age=2592000');
    // Plaintext username/ID must NEVER appear inside the encrypted cookie value
    expect(remUserHeader).not.toContain('mca_demo_student');
    expect(remUserHeader).not.toContain('MCA2401');
    const remStuBody = await remStuLogin.json();
    expect(remStuBody.rememberMe).toBe(true);
    expect(remStuBody.sessionMaxAgeSeconds).toBe(30 * 24 * 3600);

    const stuSessPair = extractNamedCookie(remStuCookies, 'mca_session_token')!;
    let remUserPair = extractNamedCookie(remStuCookies, 'mca_remembered_user')!;
    expect(remUserPair).toBeTruthy();

    // Session endpoint reports extended rememberMe session
    const sessCheck = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: stuSessPair } });
    const sessJson = await sessCheck.json();
    expect(sessJson.authenticated).toBe(true);
    expect(sessJson.rememberMe).toBe(true);

    // 3. Logout revokes active session, while encrypted mca_remembered_user persists for next login screen
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: stuSessPair } });
    expect(logoutRes.status).toBe(200);
    const rememberedFetch = await fetch(`${baseUrl}/api/auth/remembered-user`, { headers: { Cookie: remUserPair } });
    expect(rememberedFetch.status).toBe(200);
    expect(await rememberedFetch.json()).toMatchObject({
      rememberedByRole: { student: 'mca_demo_student' },
    });

    // 4. Tampering with encrypted cookie fails AES-GCM tag verification and clears cookie
    const tamperedPair = `${remUserPair.slice(0, -4)}AAAA`;
    const tamperedRes = await fetch(`${baseUrl}/api/auth/remembered-user`, { headers: { Cookie: tamperedPair } });
    expect(tamperedRes.status).toBe(200);
    expect(await tamperedRes.json()).toMatchObject({ rememberedByRole: {} });
    expect(tamperedRes.headers.get('set-cookie') || '').toContain('Max-Age=0');

    // 5. Multi-role encrypted remembering & selective clearing
    const remFacLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: remUserPair },
      body: JSON.stringify({ username: 'FAC001', password: DEMO_FACULTY_PASS, expectedRole: 'faculty', rememberMe: true }),
    });
    const remFacCookies = parseSetCookies(remFacLogin);
    remUserPair = extractNamedCookie(remFacCookies, 'mca_remembered_user')!;
    expect(remUserPair).not.toContain('hcasican_faculty');

    const bothRes = await fetch(`${baseUrl}/api/auth/remembered-user`, { headers: { Cookie: remUserPair } });
    expect(await bothRes.json()).toMatchObject({
      rememberedByRole: { student: 'mca_demo_student', faculty: 'hcasican_faculty' },
    });

    const delStuRes = await fetch(`${baseUrl}/api/auth/remembered-user?role=student`, {
      method: 'DELETE',
      headers: { Cookie: remUserPair },
    });
    expect(await delStuRes.json()).toMatchObject({
      ok: true,
      rememberedByRole: { faculty: 'hcasican_faculty' },
    });
  });

  it('sends unique, time-limited Forgot Password verification tokens to registered email, validates via verify-reset-token, and blocks brute-force & replay attacks', async () => {
    // 1. Initiate reset via registered email address
    const req1 = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'priya.patel@mca.edu.in' }),
    });
    expect(req1.status).toBe(200);
    const req1Body = await req1.json();
    expect(req1Body.ok).toBe(true);
    expect(req1Body.maskedEmail).toBe('pri***@mca.edu.in');
    expect(req1Body.expiresInMinutes).toBe(15);
    expect(req1Body.deliveryMode).toBe('dev_inbox');
    // Unauthenticated response must NEVER leak secret token or verification code directly
    expect(req1Body.resetToken).toBeUndefined();
    expect(req1Body.verificationCode).toBeUndefined();
    expect(req1Body.devMessageId).toBeTruthy();

    // 2. Inspect dispatched email in dev sandbox outbox
    const mail1Res = await fetch(
      `${baseUrl}/api/auth/dev-mail-preview?messageId=${encodeURIComponent(req1Body.devMessageId)}`
    );
    expect(mail1Res.status).toBe(200);
    const { mail: mail1 } = await mail1Res.json();
    expect(mail1.to).toBe('priya.patel@mca.edu.in');
    expect(mail1.subject).toMatch(/Password Reset Verification/i);
    expect(mail1.verificationCode).toMatch(/^\d{6}$/);
    const token1Match = mail1.resetPath.match(/[?&]token=([^&]+)/);
    const token1 = token1Match ? decodeURIComponent(token1Match[1]) : '';
    expect(token1.length).toBeGreaterThan(30);

    // 3. Requesting a second reset produces a DIFFERENT unique token and supersedes the first
    const req2 = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'MCA2402' }),
    });
    expect(req2.status).toBe(200);
    const req2Body = await req2.json();
    const { mail: mail2 } = await (
      await fetch(`${baseUrl}/api/auth/dev-mail-preview?messageId=${encodeURIComponent(req2Body.devMessageId)}`)
    ).json();
    const token2 = decodeURIComponent(mail2.resetPath.match(/[?&]token=([^&]+)/)![1]);
    expect(token2).not.toBe(token1);

    // Superseded token1 fails verification
    const verifyOld = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=${encodeURIComponent(token1)}`);
    expect(verifyOld.status).toBe(400);
    expect((await verifyOld.json()).valid).toBe(false);

    // Active token2 passes verification & tampered token fails
    const verifyGood = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=${encodeURIComponent(token2)}`);
    expect(verifyGood.status).toBe(200);
    expect(await verifyGood.json()).toMatchObject({
      valid: true,
      maskedEmail: 'pri***@mca.edu.in',
      studentId: 'MCA2402',
    });

    const verifyTampered = await fetch(
      `${baseUrl}/api/auth/verify-reset-token?token=${encodeURIComponent(`${token2.slice(0, -3)}XYZ`)}`
    );
    expect(verifyTampered.status).toBe(400);

    // 4. Five invalid verification codes invalidate the active reset token (anti-brute-force)
    for (let i = 0; i < 4; i++) {
      const badCode = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'MCA2402',
          verificationCode: '000000',
          newPassword: 'ScholarPass#2026!',
          confirmPassword: 'ScholarPass#2026!',
        }),
      });
      expect(badCode.status).toBe(400);
    }
    const fifthBadCode = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'MCA2402',
        verificationCode: '000000',
        newPassword: 'ScholarPass#2026!',
        confirmPassword: 'ScholarPass#2026!',
      }),
    });
    expect(fifthBadCode.status).toBe(429);

    // Token2 is now invalidated after brute-force lockout
    const verifyAfterLock = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=${encodeURIComponent(token2)}`);
    expect(verifyAfterLock.status).toBe(400);

    // 5. Request fresh email token, verify it completes password reset, revokes replay, and authenticates with new password
    const req3 = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'priya.patel@mca.edu.in' }),
    });
    expect(req3.status).toBe(200);
    const req3Body = await req3.json();
    const { mail: mail3 } = await (
      await fetch(`${baseUrl}/api/auth/dev-mail-preview?messageId=${encodeURIComponent(req3Body.devMessageId)}`)
    ).json();
    const token3 = decodeURIComponent(mail3.resetPath.match(/[?&]token=([^&]+)/)![1]);

    const resetOk = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken: token3,
        newPassword: 'ScholarVerified#2026!',
        confirmPassword: 'ScholarVerified#2026!',
      }),
    });
    expect(resetOk.status).toBe(200);

    // Single-use token replay is rejected
    const replayRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetToken: token3,
        newPassword: 'ScholarReplay#2026!',
        confirmPassword: 'ScholarReplay#2026!',
      }),
    });
    expect(replayRes.status).toBe(400);

    // Login succeeds with updated password
    const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'priya.patel@mca.edu.in', password: 'ScholarVerified#2026!', expectedRole: 'student' }),
    });
    expect(newLogin.status).toBe(200);

    // 6. Production safeguard: dev-mail-preview returns 404 and unconfigured SMTP returns 503
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const prodMailPreview = await fetch(
        `${baseUrl}/api/auth/dev-mail-preview?messageId=${encodeURIComponent(req3Body.devMessageId)}`
      );
      expect(prodMailPreview.status).toBe(404);

      const prodResetReq = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'rohan.verma@mca.edu.in' }),
      });
      expect(prodResetReq.status).toBe(503);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('supports one-click /api/auth/demo-enter for Student, Faculty & Admin in local dev, blocks when DEMO_PORTAL_ACCESS=false or production, and preserves strict credential RBAC', async () => {
    // 1. Demo info reports demoPortalAccess=true in local dev without exposing passwords
    const demoInfoRes = await fetch(`${baseUrl}/api/auth/demo-info`);
    expect(demoInfoRes.status).toBe(200);
    const demoInfo = await demoInfoRes.json();
    expect(demoInfo).toEqual({ demoMode: true, demoPortalAccess: true });

    // 2. One-click demo-enter works for student, faculty, and admin using isolated sandbox accounts
    for (const role of ['student', 'faculty', 'admin'] as const) {
      const enterRes = await fetch(`${baseUrl}/api/auth/demo-enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      expect(enterRes.status).toBe(200);
      const enterJson = await enterRes.json();
      expect(enterJson.authenticated).toBe(true);
      expect(enterJson.demoPortalAccess).toBe(true);
      expect(enterJson.user.role).toBe(role);
      expect(enterJson.user.isDemo).toBe(true);
      const cookie = extractCookiePair(enterRes.headers.get('set-cookie'))!;
      expect(cookie).toContain('mca_session_token=');

      // Verify strict RBAC isolation even on demo sessions
      if (role === 'student') {
        expect((await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: cookie } })).status).toBe(403);
        expect((await fetch(`${baseUrl}/api/student/records?studentId=MCA2401`, { headers: { Cookie: cookie } })).status).toBe(403);
      } else if (role === 'faculty') {
        expect((await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: cookie } })).status).toBe(403);
      } else {
        const usersRes = await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: cookie } });
        expect(usersRes.status).toBe(200);
        const usersJson = await usersRes.json();
        expect(usersJson.users.every((u: any) => u.isDemo === true)).toBe(true);
        expect(usersJson.users.some((u: any) => u.studentId === 'MCA2401')).toBe(false);
      }
      await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
      expect((await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: cookie } })).status).toBe(401);
    }

    // 3. Disabling DEMO_PORTAL_ACCESS blocks direct entry with 403 immediately
    const prevDemoPortal = process.env.DEMO_PORTAL_ACCESS;
    try {
      process.env.DEMO_PORTAL_ACCESS = 'false';
      const disabledInfo = await (await fetch(`${baseUrl}/api/auth/demo-info`)).json();
      expect(disabledInfo.demoPortalAccess).toBe(false);

      const blockedEnter = await fetch(`${baseUrl}/api/auth/demo-enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      expect(blockedEnter.status).toBe(403);
    } finally {
      if (prevDemoPortal === undefined) delete process.env.DEMO_PORTAL_ACCESS;
      else process.env.DEMO_PORTAL_ACCESS = prevDemoPortal;
    }

    // 4. Production credential login still enforces strict role checks, password checks, inactive lockout, and logout revocation
    const portals = [
      { role: 'student', userId: 'demo_student', password: 'Student@123', wrongRole: 'admin' },
      { role: 'faculty', userId: 'demo_faculty', password: 'Faculty@123', wrongRole: 'admin' },
      { role: 'admin', userId: 'demo_admin', password: 'Admin@123', wrongRole: 'faculty' },
    ];

    let demoAdminCookie = '';
    for (const p of portals) {
      const wrongRoleRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: p.userId, password: p.password, expectedRole: p.wrongRole }),
      });
      expect(wrongRoleRes.status).toBe(403);
      expect((await wrongRoleRes.json()).error).toMatch(new RegExp(`restricted to ${p.wrongRole} accounts`, 'i'));

      const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: p.userId, password: 'WrongPass#999!', expectedRole: p.role }),
      });
      expect(wrongPassRes.status).toBe(401);

      const okRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: p.userId, password: p.password, expectedRole: p.role }),
      });
      expect(okRes.status).toBe(200);
      const okJson = await okRes.json();
      expect(okJson.authenticated).toBe(true);
      expect(okJson.user.role).toBe(p.role);
      if (p.role === 'admin') {
        demoAdminCookie = extractCookiePair(okRes.headers.get('set-cookie'))!;
      }
    }

    // 3. Demo Admin accesses Admin governance endpoint; logout revokes session cookie cleanly
    const adminUsersRes = await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: demoAdminCookie } });
    expect(adminUsersRes.status).toBe(200);
    await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: demoAdminCookie } });
    const afterLogoutRes = await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: demoAdminCookie } });
    expect(afterLogoutRes.status).toBe(401);

    // 4. Institutional Admin ADM001 accesses admin portal & blocks inactive user login
    const admRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ADM001', password: DEMO_ADMIN_PASS, expectedRole: 'admin' }),
    });
    expect(admRes.status).toBe(200);
    const admCookie = extractCookiePair(admRes.headers.get('set-cookie'))!;

    const createRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admCookie },
      body: JSON.stringify({
        name: 'Ritu Menon',
        studentId: 'MCA2496',
        username: 'ritu_menon',
        email: 'ritu.menon@mcasmartcampus.edu',
        role: 'student',
        temporaryPassword: 'ZebraStrong#9081!',
      }),
    });
    expect(createRes.status).toBe(201);
    const createdUser = (await createRes.json()).user;

    const toggleRes = await fetch(
      `${baseUrl}/api/admin/users/${encodeURIComponent(createdUser.studentId)}/toggle-active`,
      {
        method: 'PATCH',
        headers: { Cookie: admCookie },
      }
    );
    expect(toggleRes.status).toBe(200);

    const inactiveLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ritu_menon', password: 'ZebraStrong#9081!', expectedRole: 'student' }),
    });
    expect(inactiveLoginRes.status).toBe(403);
    expect((await inactiveLoginRes.json()).error).toMatch(/inactive or disabled/i);
  });
});


