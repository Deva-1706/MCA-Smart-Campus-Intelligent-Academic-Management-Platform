import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from '../App';
import { DEMO_STUDENTS } from '../data/academicData';

const DEMO_PASSWORD = ['McaDemo', '@2026!'].join('');

interface MockServerState {
  authenticated: boolean;
  password: string;
  resetCode: string | null;
  logoutCalls: number;
  demoPortalAccess?: boolean;
  rememberedByRole?: Partial<Record<'student' | 'faculty' | 'admin', string>>;
  lastLoginRememberMe?: boolean;
  pdfChatFail503?: boolean;
  pdfChatExpired401?: boolean;
  pdfChatCalls?: Array<{
    query: string;
    uploadedPdfFiles?: Array<{ fileName: string; mimeType: string }>;
    credentials?: RequestCredentials;
    csrfHeader?: string | null;
  }>;
}

function installMockBrowserFetch(state: MockServerState) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method || 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (url.endsWith('/api/auth/csrf')) {
      document.cookie = 'mca_csrf_token=mock_csrf_token_1234567890; path=/';
      return new Response(JSON.stringify({ csrfToken: 'mock_csrf_token_1234567890' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/api/auth/session')) {
      document.cookie = 'mca_csrf_token=mock_csrf_token_1234567890; path=/';
      return new Response(
        JSON.stringify(
          state.authenticated
            ? { authenticated: true, user: DEMO_STUDENTS[0], csrfToken: 'mock_csrf_token_1234567890' }
            : { authenticated: false, user: null, csrfToken: 'mock_csrf_token_1234567890' }
        ),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/auth/demo-info')) {
      return new Response(
        JSON.stringify({
          demoMode: Boolean(state.demoPortalAccess),
          demoPortalAccess: Boolean(state.demoPortalAccess),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/auth/demo-enter') && method === 'POST') {
      if (!state.demoPortalAccess) {
        return new Response(
          JSON.stringify({ error: 'Direct demo portal entry is disabled in production mode.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const role = String(body.role || '').toLowerCase();
      state.authenticated = true;
      if (role === 'student') {
        return new Response(
          JSON.stringify({
            authenticated: true,
            demoPortalAccess: true,
            user: {
              ...DEMO_STUDENTS[0],
              id: 'demo-std-01',
              isDemo: true,
              role: 'student',
              studentId: 'demo_student',
              rollNumber: 'DEMO-MCA-01',
              username: 'demo_student',
              name: 'Demo Student',
              email: 'demo_student@demo.mcasmartcampus.local',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (role === 'faculty') {
        return new Response(
          JSON.stringify({
            authenticated: true,
            demoPortalAccess: true,
            user: {
              ...DEMO_STUDENTS[0],
              id: 'demo-fac-01',
              isDemo: true,
              role: 'faculty',
              studentId: 'demo_faculty',
              rollNumber: 'DEMO-FAC-01',
              username: 'demo_faculty',
              name: 'Demo Faculty',
              email: 'demo_faculty@demo.mcasmartcampus.local',
              assignedSubjectCodes: ['435C1A', '435C1B', '435E1A', '435C1C'],
              facultyPermissions: ['create_assessments', 'manage_materials', 'verify_skills', 'review_projects'],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (role === 'admin') {
        return new Response(
          JSON.stringify({
            authenticated: true,
            demoPortalAccess: true,
            user: {
              ...DEMO_STUDENTS[0],
              id: 'demo-adm-01',
              isDemo: true,
              role: 'admin',
              studentId: 'demo_admin',
              rollNumber: 'DEMO-ADM-01',
              username: 'demo_admin',
              name: 'Demo Administrator',
              email: 'demo_admin@demo.mcasmartcampus.local',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/api/auth/remembered-user')) {
      if (method === 'DELETE') {
        const parsed = new URL(url, 'http://localhost');
        const role = parsed.searchParams.get('role') as 'student' | 'faculty' | 'admin' | null;
        if (role && state.rememberedByRole) {
          delete state.rememberedByRole[role];
        } else {
          state.rememberedByRole = {};
        }
        return new Response(JSON.stringify({ ok: true, rememberedByRole: state.rememberedByRole || {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ rememberedByRole: state.rememberedByRole || {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/api/auth/login') && method === 'POST') {
      state.lastLoginRememberMe = Boolean(body.rememberMe);
      const cleanUser = String(body.username || '').trim().toUpperCase();
      const expectedRole = body.expectedRole;
      const validStudent =
        cleanUser === 'MCA2401' || cleanUser === 'MCA_DEMO_STUDENT' || cleanUser === 'DEVANATH_N' || cleanUser === 'DEMO_STUDENT';
      const validFaculty =
        cleanUser === 'FAC001' || cleanUser === 'HCASICAN_FACULTY' || cleanUser === 'HCASICAN' || cleanUser === 'DEMO_FACULTY';
      const validAdmin =
        cleanUser === 'ADM001' || cleanUser === 'CAMPUS_ADMIN' || cleanUser === 'DEMO_ADMIN';

      if (validStudent) {
        if (expectedRole && expectedRole !== 'student') {
          return new Response(
            JSON.stringify({ error: `Access denied: This login portal is restricted to ${expectedRole} accounts.` }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const stuPassOk =
          cleanUser === 'DEMO_STUDENT' ? body.password === 'Student@123' : body.password === state.password;
        if (stuPassOk) {
          state.authenticated = true;
          state.rememberedByRole = state.rememberedByRole || {};
          if (body.rememberMe) {
            state.rememberedByRole.student = cleanUser === 'DEMO_STUDENT' ? 'demo_student' : 'mca_demo_student';
          } else {
            delete state.rememberedByRole.student;
          }
          return new Response(
            JSON.stringify({
              authenticated: true,
              user: cleanUser === 'DEMO_STUDENT'
                ? {
                    ...DEMO_STUDENTS[0],
                    id: 'demo-std-01',
                    isDemo: true,
                    studentId: 'demo_student',
                    rollNumber: 'DEMO-MCA-01',
                    username: 'demo_student',
                    name: 'Demo Student',
                    email: 'demo_student@demo.mcasmartcampus.local',
                  }
                : DEMO_STUDENTS[0],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else if (validFaculty) {
        if (expectedRole && expectedRole !== 'faculty') {
          return new Response(
            JSON.stringify({ error: `Access denied: This login portal is restricted to ${expectedRole} accounts.` }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const facPassOk =
          cleanUser === 'DEMO_FACULTY' ? body.password === 'Faculty@123' : body.password === 'Faculty@2026!';
        if (facPassOk) {
          state.authenticated = true;
          return new Response(
            JSON.stringify({
              authenticated: true,
              user: {
                ...DEMO_STUDENTS[0],
                id: cleanUser === 'DEMO_FACULTY' ? 'demo-fac-01' : 'fac-01',
                isDemo: cleanUser === 'DEMO_FACULTY',
                role: 'faculty',
                studentId: cleanUser === 'DEMO_FACULTY' ? 'demo_faculty' : 'FAC001',
                rollNumber: cleanUser === 'DEMO_FACULTY' ? 'DEMO-FAC-01' : 'FAC-HCASICAN',
                username: cleanUser === 'DEMO_FACULTY' ? 'demo_faculty' : 'hcasican_faculty',
                name: cleanUser === 'DEMO_FACULTY' ? 'Demo Faculty' : 'HCASICAN',
                assignedSubjectCodes: ['435C1A', '435C1B', '435E1A', '435C1C'],
                facultyPermissions: ['create_assessments', 'manage_materials', 'verify_skills', 'review_projects'],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else if (validAdmin) {
        if (expectedRole && expectedRole !== 'admin') {
          return new Response(
            JSON.stringify({ error: `Access denied: This login portal is restricted to ${expectedRole} accounts.` }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const admPassOk =
          cleanUser === 'DEMO_ADMIN' ? body.password === 'Admin@123' : body.password === 'Admin@2026!';
        if (admPassOk) {
          state.authenticated = true;
          return new Response(
            JSON.stringify({
              authenticated: true,
              user: {
                ...DEMO_STUDENTS[0],
                id: cleanUser === 'DEMO_ADMIN' ? 'demo-adm-01' : 'adm-01',
                isDemo: cleanUser === 'DEMO_ADMIN',
                role: 'admin',
                studentId: cleanUser === 'DEMO_ADMIN' ? 'demo_admin' : 'ADM001',
                rollNumber: cleanUser === 'DEMO_ADMIN' ? 'DEMO-ADM-01' : 'ADMIN-MCA',
                username: cleanUser === 'DEMO_ADMIN' ? 'demo_admin' : 'campus_admin',
                name: cleanUser === 'DEMO_ADMIN' ? 'Demo Administrator' : 'Academic Administrator',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else if (cleanUser === 'PRIYA_FACULTY' && body.password === 'TempInit#2026!') {
        if (expectedRole && expectedRole !== 'faculty') {
          return new Response(
            JSON.stringify({ error: `Access denied: This login portal is restricted to ${expectedRole} accounts.` }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        state.authenticated = true;
        return new Response(
          JSON.stringify({
            authenticated: true,
            mustChangePassword: true,
            user: {
              ...DEMO_STUDENTS[0],
              id: 'fac-02',
              role: 'faculty',
              studentId: 'FAC002',
              rollNumber: 'FAC002',
              username: 'priya_faculty',
              name: 'Dr. Priya Nair',
              mustChangePassword: true,
              assignedSubjectCodes: ['435C1A'],
              facultyPermissions: ['create_assessments'],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Invalid Student ID or password. Please verify and try again.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/auth/logout') && method === 'POST') {
      state.authenticated = false;
      state.logoutCalls += 1;
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/api/auth/request-password-reset') && method === 'POST') {
      const cleanId = String(body.identifier || '').trim().toUpperCase();
      if (cleanId === 'MCA2401' || cleanId === 'MCA_DEMO_STUDENT' || cleanId === 'DEVANATH016@GMAIL.COM') {
        state.resetCode = '482910';
        return new Response(
          JSON.stringify({
            ok: true,
            studentId: 'MCA2401',
            maskedEmail: 'dev***@gmail.com',
            expiresInMinutes: 15,
            expiresAt: Date.now() + 15 * 60 * 1000,
            deliveryMode: 'dev_inbox',
            devMessageId: 'msg-mock-482910',
            message: 'Verification email sent to dev***@gmail.com.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ error: 'No matching MCA student account found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/api/auth/verify-reset-token')) {
      const parsed = new URL(url, 'http://localhost');
      const token = parsed.searchParams.get('token');
      if (token === 'valid-email-reset-token.mock-hmac-sig') {
        return new Response(
          JSON.stringify({
            valid: true,
            maskedEmail: 'dev***@gmail.com',
            studentId: 'MCA2401',
            expiresAt: Date.now() + 15 * 60 * 1000,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ valid: false, error: 'This password reset link is invalid or has expired.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('/api/auth/dev-mail-preview')) {
      return new Response(
        JSON.stringify({
          mail: {
            messageId: 'msg-mock-482910',
            to: 'devanath016@gmail.com',
            subject: 'MCA Smart Campus — Password Reset Verification',
            text: 'Verification code: 482910',
            resetPath: '/accounts/password-reset-confirm/?token=valid-email-reset-token.mock-hmac-sig',
            resetLink: 'http://localhost/accounts/password-reset-confirm/?token=valid-email-reset-token.mock-hmac-sig',
            verificationCode: '482910',
            expiresAt: Date.now() + 15 * 60 * 1000,
            sentAt: new Date().toISOString(),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/auth/reset-password') && method === 'POST') {
      const tokenValid = body.resetToken === 'valid-email-reset-token.mock-hmac-sig';
      const codeValid = Boolean(state.resetCode && body.verificationCode === state.resetCode);
      if ((tokenValid || codeValid) && String(body.newPassword || '').length >= 8) {
        state.password = body.newPassword;
        state.resetCode = null;
        return new Response(
          JSON.stringify({ ok: true, message: 'Password updated successfully.' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ error: 'Invalid verification code.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.endsWith('/api/auth/change-password') && method === 'POST') {
      if (String(body.newPassword || '').length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      state.password = body.newPassword;
      return new Response(
        JSON.stringify({
          ok: true,
          user: {
            ...DEMO_STUDENTS[0],
            id: 'fac-02',
            role: 'faculty',
            studentId: 'FAC002',
            rollNumber: 'FAC002',
            username: 'priya_faculty',
            name: 'Dr. Priya Nair',
            mustChangePassword: false,
            assignedSubjectCodes: ['435C1A'],
            facultyPermissions: ['create_assessments'],
          },
          message: 'Your account password has been updated securely.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/admin/users') && method === 'POST') {
      return new Response(
        JSON.stringify({
          ok: true,
          user: {
            ...DEMO_STUDENTS[0],
            id: 'usr-999',
            role: body.role || 'student',
            isActive: true,
            mustChangePassword: true,
            studentId: String(body.studentId || 'MCA2499').toUpperCase(),
            rollNumber: String(body.studentId || 'MCA2499').toUpperCase(),
            username: String(body.username || 'new_user').toLowerCase(),
            name: body.name || 'New User',
            email: body.email || 'new@mcasmartcampus.edu',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('/api/admin/users/') && url.endsWith('/reset-password') && method === 'POST') {
      return new Response(
        JSON.stringify({
          ok: true,
          studentId: 'MCA2401',
          resetToken: 'mock-signed-token',
          resetPath: '/accounts/password-reset-confirm/?token=mock-signed-token',
          message: 'Time-limited reset link generated.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/contact') && method === 'POST') {
      return new Response(
        JSON.stringify({ ok: true, ticketId: 'TKT-900123', message: 'Inquiry logged.' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.endsWith('/api/pdf-learning/chat') && method === 'POST') {
      const reqHeaders = new Headers(init?.headers || undefined);
      state.pdfChatCalls = state.pdfChatCalls || [];
      state.pdfChatCalls.push({
        query: body.query,
        uploadedPdfFiles: body.uploadedPdfFiles,
        credentials: init?.credentials,
        csrfHeader: reqHeaders.get('X-CSRF-Token'),
      });
      if (state.pdfChatExpired401) {
        state.authenticated = false;
        return new Response(
          JSON.stringify({ error: 'Authentication required. Please sign in to continue.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (state.pdfChatFail503) {
        return new Response(
          JSON.stringify({ error: 'Gemini AI tutor is unavailable: GEMINI_API_KEY is not configured on the server.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          reply: 'Vector clocks establish causal ordering across distributed nodes.',
          grounded: true,
          modelUsed: 'gemini-4-hydrogen',
          citations: [
            {
              pdfTitle: body.uploadedPdfFiles?.[0]?.fileName || body.pdfContext?.[0]?.fileName || 'Distributed_Notes.pdf',
              pageNumber: 2,
              snippet: 'Causal event ordering via vector timestamps.',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function performDemoLogin(remember = false) {
  const userInput = await screen.findByPlaceholderText('Enter Student ID or username');
  const passInput = screen.getByPlaceholderText('Enter password');
  fireEvent.change(userInput, { target: { value: 'MCA2401' } });
  fireEvent.change(passInput, { target: { value: DEMO_PASSWORD } });
  if (remember) {
    const checkbox = screen.getByRole('checkbox');
    if (!(checkbox as HTMLInputElement).checked) {
      fireEvent.click(checkbox);
    }
  }
  const submitBtn = screen.getByRole('button', { name: /Sign In to Student Portal/i });
  fireEvent.click(submitBtn);
  await screen.findByLabelText('Student Portal Navigation');
}

describe('Mock Browser Audit — Authentication, Session Persistence & All Portal Routes', () => {
  let serverState: MockServerState;

  beforeEach(() => {
    serverState = {
      authenticated: false,
      password: DEMO_PASSWORD,
      resetCode: null,
      logoutCalls: 0,
    };
    installMockBrowserFetch(serverState);
  });

  it('redirects anonymous visitors from every protected student portal route to LoginPage without exposing StudentSidebar', async () => {
    const protectedPaths = [
      '/portal/dashboard/',
      '/portal/my-subjects/',
      '/portal/assignments/',
      '/portal/examinations/',
      '/portal/coding-lab/',
      '/portal/materials/',
      '/portal/ai-assistant/',
      '/portal/bookmarks/',
      '/portal/analytics/',
      '/portal/reports/',
      '/portal/achievements/',
      '/portal/practice-arena/',
      '/portal/flashcards/',
      '/portal/academic-calendar/',
      '/portal/profile/',
      '/portal/notifications/',
    ];

    for (const path of protectedPaths) {
      window.history.replaceState({}, '', path);
      const { unmount } = render(<App />);
      expect(await screen.findByPlaceholderText('Enter Student ID or username')).toBeInTheDocument();
      expect(screen.queryByLabelText('Student Portal Navigation')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('navigates all public pages cleanly with Public Navbar/Footer and zero StudentSidebar leakage', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByLabelText('Student Portal Navigation')).not.toBeInTheDocument();

    const publicNavLabels = ['About', 'Subjects', 'Features', 'How It Works', 'FAQ'];
    for (const label of publicNavLabels) {
      const navButtons = screen.getAllByRole('button', { name: new RegExp(`^${label}$`, 'i') });
      fireEvent.click(navButtons[0]);
      expect(screen.queryByLabelText('Student Portal Navigation')).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: /^Contact$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/support@mca-smartcampus\.edu/i)).not.toBeInTheDocument();
  });

  it('rejects invalid login, verifies valid login, persists user session in localStorage across refresh, and clears on logout', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    const firstMount = render(<App />);

    // 1. Invalid password shows error and stays unauthenticated
    fireEvent.change(await screen.findByPlaceholderText('Enter Student ID or username'), {
      target: { value: 'MCA2401' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'WrongPassword!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Student Portal/i }));
    expect(await screen.findByText(/Invalid Student ID or password/i)).toBeInTheDocument();
    expect(localStorage.getItem('mca_portal_session_v1')).toBeNull();

    // 2. Valid login WITHOUT checking Remember Me still persists session in localStorage
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: DEMO_PASSWORD },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Student Portal/i }));

    // Subtle green checkmark confirmation appears immediately before dashboard load
    const successState = await screen.findByTestId('login-success-state');
    expect(successState).toHaveAttribute('role', 'status');
    expect(within(successState).getByText(/Authentication Verified/i)).toBeInTheDocument();
    expect(within(successState).getByText(/Loading Student Dashboard\.\.\./i)).toBeInTheDocument();

    await screen.findByLabelText('Student Portal Navigation');
    expect(window.location.pathname).toBe('/portal/dashboard/');
    expect(localStorage.getItem('mca_authenticated_student_id')).toBe('MCA2401');
    const unifiedSession = JSON.parse(localStorage.getItem('mca_portal_session_v1') || '{}');
    expect(unifiedSession.studentId).toBe('MCA2401');
    expect(unifiedSession.user?.name).toBe('Devanath N');

    // Public navigation links must never appear inside Student Portal
    expect(screen.queryByRole('button', { name: /^How It Works$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^FAQ$/i })).not.toBeInTheDocument();

    // 3. Simulate full page refresh on a portal subroute (/portal/analytics/)
    firstMount.unmount();
    serverState.authenticated = false; // Prove localStorage alone keeps user logged in across refresh!
    window.history.replaceState({}, '', '/portal/analytics/');

    const refreshedMount = render(<App />);
    const sidebar = await screen.findByLabelText('Student Portal Navigation');
    expect(sidebar).toBeInTheDocument();
    expect(screen.getByText(/Performance Analytics/i, { selector: 'h1' })).toBeInTheDocument();

    // 4. Logout clears localStorage session completely and returns to Public Home
    const logoutBtn = within(sidebar).getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('mca_portal_session_v1')).toBeNull();
      expect(localStorage.getItem('mca_authenticated_student_id')).toBeNull();
      expect(localStorage.getItem('mca_session_token')).toBeNull();
    });
    expect(serverState.logoutCalls).toBe(1);
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByLabelText('Student Portal Navigation')).not.toBeInTheDocument();

    // 5. Refreshing a protected route after logout redirects to login
    refreshedMount.unmount();
    window.history.replaceState({}, '', '/portal/dashboard/');
    render(<App />);
    expect(await screen.findByPlaceholderText('Enter Student ID or username')).toBeInTheDocument();
  });

  it('supports the complete 3-step Password Reset flow from the Login page', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    render(<App />);

    const forgotBtn = await screen.findByRole('button', { name: /Forgot password\?/i });
    fireEvent.click(forgotBtn);

    expect(window.location.pathname).toBe('/accounts/password-reset/');
    const idInput = await screen.findByPlaceholderText(/MCA2401/i);
    fireEvent.change(idInput, { target: { value: 'MCA2401' } });
    fireEvent.click(screen.getByRole('button', { name: /Request Reset Verification Code/i }));

    const codeInput = await screen.findByPlaceholderText(/6-digit/i);
    fireEvent.change(codeInput, { target: { value: '482910' } });
    fireEvent.change(screen.getByPlaceholderText('Enter new password'), {
      target: { value: 'UpdatedPass!9' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'UpdatedPass!9' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Set New Password/i }));

    expect(
      await screen.findByRole('heading', { name: /Password Updated Successfully/i })
    ).toBeInTheDocument();
  });

  it('verifies all 15 authenticated Student Portal routes, layout separation, removed features, and Weekly Study Goals', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    render(<App />);
    await performDemoLogin(true);

    const sidebar = screen.getByLabelText('Student Portal Navigation');

    // Confirm Faculty Communication and Attendance Tracker remain completely absent
    expect(within(sidebar).queryByText(/Faculty Communication/i)).not.toBeInTheDocument();
    expect(within(sidebar).queryByText(/Attendance Tracker/i)).not.toBeInTheDocument();

    // Verify Weekly Study Goals widget renders on Dashboard and supports logging +30m
    const goalsSection = await screen.findByRole('region', { name: 'Weekly Subject Study Goals' });
    expect(goalsSection).toBeInTheDocument();
    const quickLogBtns = within(goalsSection).getAllByRole('button', { name: /^30m$/i });
    expect(quickLogBtns.length).toBeGreaterThanOrEqual(4);
    fireEvent.click(quickLogBtns[0]);
    await waitFor(() => {
      const savedSecsKey = Object.keys(localStorage).find(k => k.startsWith('mca_weekly_study_secs_MCA2401_'));
      expect(savedSecsKey).toBeTruthy();
      const parsed = JSON.parse(localStorage.getItem(savedSecsKey!) || '{}');
      expect(parsed['435C1A']).toBeGreaterThanOrEqual(1800);
    });

    // Traverse all 15 student sidebar routes and confirm clean rendering + URL updates + zero public nav leakage
    const expectedRoutes: Array<{ label: string; path: string }> = [
      { label: 'My Subjects', path: '/portal/my-subjects/' },
      { label: 'Assignments', path: '/portal/assignments/' },
      { label: 'Examinations', path: '/portal/examinations/' },
      { label: 'Python Coding Lab', path: '/portal/coding-lab/' },
      { label: 'Learning Materials', path: '/portal/materials/' },
      { label: 'AI PDF Chat', path: '/portal/ai-assistant/' },
      { label: 'Bookmarks', path: '/portal/bookmarks/' },
      { label: 'Performance Analytics', path: '/portal/analytics/' },
      { label: 'Academic Reports', path: '/portal/reports/' },
      { label: 'Achievements & Certificates', path: '/portal/achievements/' },
      { label: 'Practice Arena', path: '/portal/practice-arena/' },
      { label: 'AI Flashcards & Revision', path: '/portal/flashcards/' },
      { label: 'Academic Calendar & Timetable', path: '/portal/academic-calendar/' },
      { label: 'Student Profile', path: '/portal/profile/' },
      { label: 'Notifications', path: '/portal/notifications/' },
      { label: 'Dashboard', path: '/portal/dashboard/' },
    ];

    for (const route of expectedRoutes) {
      const btn = within(sidebar).getByRole('button', { name: new RegExp(route.label, 'i') });
      fireEvent.click(btn);
      expect(window.location.pathname).toBe(route.path);
      expect(screen.queryByRole('button', { name: /^How It Works$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^FAQ$/i })).not.toBeInTheDocument();
    }
  });

  it('enforces 3-role login separation and dedicated Faculty & Admin workspaces without cross-role leakage', async () => {
    window.history.replaceState({}, '', '/');
    const homeRender = render(<App />);
    expect(screen.getAllByText(/MCA SMART CAMPUS/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Django Files/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bBlueprint\b/i)).not.toBeInTheDocument();
    homeRender.unmount();

    // Attempt student login inside Admin portal -> rejected with 403 error message
    window.history.replaceState({}, '', '/admin-login/');
    const adminRender = render(<App />);
    const adminIdInput = await screen.findByPlaceholderText(/Enter Admin ID or username/i);
    const adminPassInput = screen.getByPlaceholderText(/Enter password/i);
    fireEvent.change(adminIdInput, { target: { value: 'MCA2401' } });
    fireEvent.change(adminPassInput, { target: { value: DEMO_PASSWORD } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Admin Portal/i }));
    expect(await screen.findByText(/restricted to admin accounts/i)).toBeInTheDocument();

    // Valid Admin sign-in enters Admin Governance Workspace
    fireEvent.change(adminIdInput, { target: { value: 'ADM001' } });
    fireEvent.change(adminPassInput, { target: { value: 'Admin@2026!' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Admin Portal/i }));
    const adminSidebar = await screen.findByLabelText('Admin Portal Navigation');
    expect(adminSidebar).toBeInTheDocument();
    expect(screen.queryByLabelText('Student Portal Navigation')).not.toBeInTheDocument();

    // Real Admin logout clears session and returns to public view
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    await waitFor(() => {
      expect(localStorage.getItem('mca_portal_session_v1')).toBeNull();
    });
    adminRender.unmount();

    // Sign in as Faculty (FAC001) on isolated Faculty Login portal
    serverState.authenticated = false;
    window.history.replaceState({}, '', '/faculty-login/');
    render(<App />);
    const facIdInput = await screen.findByPlaceholderText(/Enter Faculty ID or username/i);
    const facPassInput = screen.getByPlaceholderText(/Enter password/i);
    fireEvent.change(facIdInput, { target: { value: 'FAC001' } });
    fireEvent.change(facPassInput, { target: { value: 'Faculty@2026!' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Faculty Portal/i }));
    const facultySidebar = await screen.findByLabelText('Faculty Portal Navigation');
    expect(facultySidebar).toBeInTheDocument();
    expect(screen.queryByLabelText('Admin Portal Navigation')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Student Portal Navigation')).not.toBeInTheDocument();
    expect(screen.queryByText(/Attendance Tracker/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Faculty Communication/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Django Files/i)).not.toBeInTheDocument();

    // Navigate Faculty modules & verify real workflows
    fireEvent.click(within(facultySidebar).getByRole('button', { name: /Assigned Subjects/i }));
    expect(await screen.findByRole('heading', { name: /Assigned MCA Subjects/i })).toBeInTheDocument();

    fireEvent.click(within(facultySidebar).getByRole('button', { name: /Student Cohorts/i }));
    expect(await screen.findByRole('heading', { name: /Assigned Student Cohorts/i })).toBeInTheDocument();

    fireEvent.click(within(facultySidebar).getByRole('button', { name: /Question Bank/i }));
    fireEvent.change(screen.getByPlaceholderText(/Topic \(e\.g\. AVL Balance Factor\)/i), {
      target: { value: 'Dijkstra Min-Heap Invariant' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Question prompt/i), {
      target: { value: 'Prove greedy edge relaxation correctness for non-negative weights.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Question to Bank/i }));
    expect(await screen.findByText(/Dijkstra Min-Heap Invariant: Prove greedy edge relaxation/i)).toBeInTheDocument();

    fireEvent.click(within(facultySidebar).getByRole('button', { name: /Submission Evaluation/i }));
    const saveGradeBtns = await screen.findAllByRole('button', { name: /Save Grade/i });
    expect(saveGradeBtns.length).toBeGreaterThan(0);
    fireEvent.click(saveGradeBtns[0]);
    expect(await screen.findByText(/Grade saved/i)).toBeInTheDocument();

    fireEvent.click(within(facultySidebar).getByRole('button', { name: /Gradebook & Marks/i }));
    expect(await screen.findByRole('heading', { name: /Subject Gradebook & Examination Marks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Gradebook CSV/i })).toBeInTheDocument();
  });

  it('navigates all 6 Smart Campus growth modules and verifies PDF Reading Progress & Student boundary exclusions', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    render(<App />);
    await performDemoLogin(false);

    const sidebar = screen.getByLabelText('Student Portal Navigation');
    expect(within(sidebar).queryByRole('button', { name: /Challenge Arena/i })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole('button', { name: /Digital Academic Passport/i })).not.toBeInTheDocument();

    const smartCampusRoutes = [
      { label: 'Academic Intelligence', path: '/portal/intelligence/' },
      { label: 'Skill DNA', path: '/portal/skill-dna/' },
      { label: 'Project Studio', path: '/portal/project-studio/' },
      { label: 'Career Readiness Lab', path: '/portal/career-lab/' },
      { label: 'Smart Study Planner', path: '/portal/study-planner/' },
      { label: 'Knowledge Graph', path: '/portal/knowledge-graph/' },
    ];

    for (const mod of smartCampusRoutes) {
      const btn = within(sidebar).getByRole('button', { name: new RegExp(mod.label, 'i') });
      fireEvent.click(btn);
      expect(window.location.pathname).toBe(mod.path);
    }

    // Verify Learning Materials has live Reading Progress bar & zero Admin Document Mgmt tab
    const materialsBtn = within(sidebar).getByRole('button', { name: /Learning Materials/i });
    fireEvent.click(materialsBtn);
    const progressBar = await screen.findByRole('progressbar', { name: /Study Material Reading Scroll Progress/i });
    expect(progressBar).toBeInTheDocument();
    expect(screen.queryByText(/Faculty Document Management/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Django Files/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Attendance Tracker/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Faculty Communication/i)).not.toBeInTheDocument();
  });

  it('hides hardcoded demo credentials on LoginPage, enforces first-login password setup, and supports Admin user governance UI', async () => {
    // 1. Login page never leaks sample passwords
    window.history.replaceState({}, '', '/student-login/');
    const first = render(<App />);
    await screen.findByPlaceholderText('Enter Student ID or username');
    expect(screen.queryByText(DEMO_PASSWORD)).not.toBeInTheDocument();
    expect(screen.queryByText(/Use Local/i)).not.toBeInTheDocument();
    first.unmount();

    // 2. Temporary password triggers mandatory ChangePasswordPage before Faculty Portal
    window.history.replaceState({}, '', '/faculty-login/');
    const facMount = render(<App />);
    fireEvent.change(await screen.findByPlaceholderText(/Enter Faculty ID or username/i), {
      target: { value: 'priya_faculty' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), {
      target: { value: 'TempInit#2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Faculty Portal/i }));

    expect(await screen.findByRole('heading', { name: /First-Login Password Setup/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Faculty Portal Navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^How It Works$/i })).not.toBeInTheDocument();

    const cpStrengthBar = screen.getByRole('progressbar', { name: /Password strength/i });
    const cpReqRegion = screen.getByRole('region', { name: /Password requirements/i });
    expect(cpStrengthBar).toHaveAttribute('aria-valuenow', '0');
    expect(within(cpReqRegion).getByText('0/4 met')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), { target: { value: 'TempInit#2026!' } });
    fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'Ab1' } });
    expect(cpStrengthBar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(within(cpReqRegion).getByText('2/4 met')).toBeInTheDocument();
    expect(within(cpReqRegion).getByText(/Minimum 8 characters/i).closest('li')).toHaveAttribute('data-met', 'false');
    expect(within(cpReqRegion).getByText(/Uppercase letter/i).closest('li')).toHaveAttribute('data-met', 'true');
    expect(within(cpReqRegion).getByText(/Number/i).closest('li')).toHaveAttribute('data-met', 'true');
    expect(within(cpReqRegion).getByText(/Special character/i).closest('li')).toHaveAttribute('data-met', 'false');

    fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'CampusMentor#2026!' } });
    expect(cpStrengthBar).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(within(cpReqRegion).getByText('4/4 met')).toBeInTheDocument();
    expect(within(cpReqRegion).getByText(/Minimum 8 characters/i).closest('li')).toHaveAttribute('data-met', 'true');
    expect(within(cpReqRegion).getByText(/Uppercase letter/i).closest('li')).toHaveAttribute('data-met', 'true');
    expect(within(cpReqRegion).getByText(/Number/i).closest('li')).toHaveAttribute('data-met', 'true');
    expect(within(cpReqRegion).getByText(/Special character/i).closest('li')).toHaveAttribute('data-met', 'true');

    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'CampusMentor#2026!' } });
    fireEvent.click(screen.getByRole('button', { name: /Save New Password/i }));

    expect(await screen.findByLabelText('Faculty Portal Navigation')).toBeInTheDocument();
    facMount.unmount();

    // 3. Admin User Management creates user with temporary password & issues reset link without exposing passwords
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'mca_session_token=; max-age=0; path=/';
    serverState.authenticated = false;
    window.history.replaceState({}, '', '/admin-login/');
    render(<App />);
    fireEvent.change(await screen.findByPlaceholderText(/Enter Admin ID or username/i), { target: { value: 'ADM001' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), { target: { value: 'Admin@2026!' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Admin Portal/i }));

    const adminSidebar = await screen.findByLabelText('Admin Portal Navigation');
    fireEvent.click(within(adminSidebar).getByRole('button', { name: /User & Account Manager/i }));

    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Kiran Rao' } });
    fireEvent.change(screen.getByPlaceholderText(/ID \(e\.g\. MCA2404\)/i), { target: { value: 'MCA2499' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'kiran_rao' } });
    fireEvent.change(screen.getByPlaceholderText('Temporary Password'), { target: { value: 'TempStudent#2026!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create User/i }));

    expect(await screen.findByText(/Provisioned student account MCA2499/i)).toBeInTheDocument();
    expect(screen.queryByText('TempStudent#2026!')).not.toBeInTheDocument();

    const resetBtns = screen.getAllByRole('button', { name: /Issue Reset Link/i });
    fireEvent.click(resetBtns[0]);
    expect(await screen.findByText(/mock-signed-token/i)).toBeInTheDocument();
  });

  it('implements complete 11-step one-click development/demo portal selection without credential inputs, and isolates real academic records', async () => {
    serverState.demoPortalAccess = true;
    window.history.replaceState({}, '', '/');
    render(<App />);

    // 1. Open public homepage -> single red Login button (no dropdown)
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('button', { name: /Login Portals/i })).not.toBeInTheDocument();
    expect(within(header).queryByRole('button', { name: /Student Portal/i })).not.toBeInTheDocument();
    const loginBtn = within(header).getByRole('button', { name: /^Login$/i });
    expect(loginBtn).not.toHaveAttribute('aria-haspopup');
    expect(loginBtn.querySelector('.lucide-chevron-down')).toBeNull();

    // 2. Click Login -> opens central portal selection page inside AuthLayout
    fireEvent.click(loginBtn);
    expect(window.location.pathname).toBe('/accounts/login/');
    expect(document.querySelector('img[src*="academic_portal_hero"]')).toBeInTheDocument();

    // 3. Verify three large portal options with exact descriptions and buttons
    const grid = await screen.findByTestId('portal-selection-grid');
    expect(within(grid).getByRole('heading', { name: /Student Portal/i })).toBeInTheDocument();
    expect(
      within(grid).getByText(/Access academic content, subject materials, reading resources, assessments and results\./i)
    ).toBeInTheDocument();
    expect(within(grid).getByRole('heading', { name: /Faculty Portal/i })).toBeInTheDocument();
    expect(
      within(grid).getByText(/Manage assigned subjects, upload learning materials, create assessments and review student work\./i)
    ).toBeInTheDocument();
    expect(within(grid).getByRole('heading', { name: /Admin Portal/i })).toBeInTheDocument();
    expect(
      within(grid).getByText(/Manage users, academic structure, faculty allocations, permissions and institutional settings\./i)
    ).toBeInTheDocument();

    // Strictly verify ZERO credential / demo-credential UI elements exist in the DOM
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(document.querySelector('input[type="text"]')).toBeNull();
    expect(screen.queryByText(/Demo Credentials/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy ID/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy Password/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Autofill Demo Credentials/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Forgot password\?/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Remember me/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: /Password strength/i })).not.toBeInTheDocument();

    // 4-5. Click Student -> Student Dashboard opens directly
    fireEvent.click(within(grid).getByRole('button', { name: /Enter Student Portal/i }));
    expect(await screen.findByLabelText('Student Portal Navigation')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/portal/dashboard/');

    // 6. Return to portal selection via Switch Portal
    fireEvent.click(screen.getByRole('button', { name: /Switch Portal/i }));
    const grid2 = await screen.findByTestId('portal-selection-grid');
    expect(window.location.pathname).toBe('/accounts/login/');

    // 7-8. Click Faculty -> Faculty Dashboard opens directly
    fireEvent.click(within(grid2).getByRole('button', { name: /Enter Faculty Portal/i }));
    expect(await screen.findByLabelText('Faculty Portal Navigation')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/faculty/overview/');

    // 9. Return to portal selection via Switch Portal
    fireEvent.click(screen.getByRole('button', { name: /Switch Portal/i }));
    const grid3 = await screen.findByTestId('portal-selection-grid');
    expect(window.location.pathname).toBe('/accounts/login/');

    // 10-11. Click Admin -> Admin Dashboard opens directly & never exposes Devanath N
    fireEvent.click(within(grid3).getByRole('button', { name: /Enter Admin Portal/i }));
    expect(await screen.findByLabelText('Admin Portal Navigation')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/overview/');
    expect(screen.queryByText('Devanath N')).not.toBeInTheDocument();
  });

  it('protects /admin-login/, /faculty-login/, and /student-login/ when currentUser is already authenticated and verifies all homepage sections', async () => {
    // 1. Verify streamlined homepage sections, subtle animated bg, removed hero showcase img & removed Contact/login-portals
    window.history.replaceState({}, '', '/');
    const homeMount = render(<App />);
    const requiredSections = [
      'home',
      'about',
      'subjects',
      'features',
      'important-notices',
      'how-it-works',
      'faq',
    ];
    for (const secId of requiredSections) {
      const secEl = document.getElementById(secId);
      expect(secEl).toBeInTheDocument();
      expect(secEl).toHaveClass('public-section');
      expect(secEl?.querySelector('.public-container')).toBeInTheDocument();
    }
    expect(document.getElementById('login-portals')).not.toBeInTheDocument();
    expect(document.getElementById('contact')).not.toBeInTheDocument();
    expect(document.querySelector('.mca-public-animated-bg')).toBeInTheDocument();
    expect(screen.queryByAltText(/MCA SMART CAMPUS Digital Learning/i)).not.toBeInTheDocument();

    const faqInput = screen.getByPlaceholderText(/Search FAQ keywords/i);
    fireEvent.change(faqInput, { target: { value: 'Python' } });
    expect(screen.getByText(/Can I execute and test Python code directly in the browser/i)).toBeInTheDocument();
    homeMount.unmount();

    // 2. Log in as Student, then attempt visiting /admin-login/ and /faculty-login/ -> must stay in Student Portal
    serverState.authenticated = true;
    localStorage.setItem(
      'mca_portal_session_v1',
      JSON.stringify({ studentId: 'MCA2401', user: DEMO_STUDENTS[0] })
    );

    for (const loginPath of ['/admin-login/', '/faculty-login/', '/student-login/']) {
      window.history.replaceState({}, '', loginPath);
      const { unmount } = render(<App />);
      expect(await screen.findByLabelText('Student Portal Navigation')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter Admin ID or username/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter Faculty ID or username/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter Student ID or username/i)).not.toBeInTheDocument();
      await waitFor(() => expect(window.location.pathname).toBe('/portal/dashboard/'));
      unmount();
    }
  });

  it('opens AI PDF Chat from StudentSidebar, uploads a PDF, queries Gemini with page citations, and surfaces server errors', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    render(<App />);
    await performDemoLogin(false);

    const sidebar = screen.getByLabelText('Student Portal Navigation');
    fireEvent.click(within(sidebar).getByRole('button', { name: /AI PDF Chat/i }));

    expect(window.location.pathname).toBe('/portal/ai-assistant/');
    expect(await screen.findByRole('heading', { name: /AI PDF Learning Assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Uploaded PDF Knowledge Base' })).toBeInTheDocument();

    // Upload a local PDF learning material
    const pdfInput = screen.getByLabelText(/Upload PDF study material/i) as HTMLInputElement;
    const samplePdf = new File(
      ['%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj'],
      'Distributed_Notes.pdf',
      { type: 'application/pdf' }
    );
    fireEvent.change(pdfInput, { target: { files: [samplePdf] } });
    expect(await screen.findByText(/Added "Distributed_Notes\.pdf"/i)).toBeInTheDocument();

    // Ask a question grounded in the selected + uploaded PDFs
    const composer = screen.getByLabelText(/Ask a question based on uploaded PDF learning materials/i);
    fireEvent.change(composer, { target: { value: 'How do vector clocks track causal ordering?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Gemini/i }));

    expect(await screen.findByText(/Vector clocks establish causal ordering across distributed nodes\./i)).toBeInTheDocument();
    expect(screen.getByText(/Grounded in Uploaded PDFs/i)).toBeInTheDocument();
    expect(screen.getByText(/Distributed_Notes\.pdf · Page 2/i)).toBeInTheDocument();
    expect(serverState.pdfChatCalls?.[0]?.uploadedPdfFiles?.[0]?.fileName).toBe('Distributed_Notes.pdf');
    expect(serverState.pdfChatCalls?.[0]?.credentials).toBe('same-origin');
    expect(serverState.pdfChatCalls?.[0]?.csrfHeader).toBe('mock_csrf_token_1234567890');
    // Client never pollutes document.cookie with fake mca_tok_ session cookies
    expect(document.cookie).not.toContain('mca_tok_');

    // Verify genuine 401 session expiration preserves user's question & uploaded PDFs, shows inline re-auth, and retries cleanly
    serverState.pdfChatExpired401 = true;
    fireEvent.change(composer, { target: { value: 'Explain Lamport logical clocks from this PDF' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Gemini/i }));

    expect(await screen.findByText(/Your session has expired/i)).toBeInTheDocument();
    expect((composer as HTMLTextAreaElement).value).toBe('Explain Lamport logical clocks from this PDF');
    const reauthPanel = screen.getByTestId('pdf-chat-reauth-panel');
    expect(reauthPanel).toBeInTheDocument();

    serverState.pdfChatExpired401 = false;
    fireEvent.change(within(reauthPanel).getByLabelText(/Re-enter password/i), {
      target: { value: DEMO_PASSWORD },
    });
    fireEvent.click(within(reauthPanel).getByRole('button', { name: /Sign In & Continue/i }));

    await waitFor(() => {
      expect(screen.queryByTestId('pdf-chat-reauth-panel')).not.toBeInTheDocument();
      expect(serverState.pdfChatCalls?.length).toBeGreaterThanOrEqual(3);
    });
    expect(screen.getAllByText(/Distributed_Notes\.pdf/i).length).toBeGreaterThan(0);

    // Verify 503 error propagation (never faking a heuristic answer)
    serverState.pdfChatFail503 = true;
    fireEvent.change(composer, { target: { value: 'Summarize Lamport timestamps' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Gemini/i }));

    expect(await screen.findByText(/GEMINI_API_KEY is not configured on the server/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Question/i })).toBeInTheDocument();
  });

  it('persists remembered username via server encrypted cookie across logout without plaintext localStorage/cookie leakage', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    const firstRender = render(<App />);

    // Log in with Remember Me checked
    await performDemoLogin(true);
    expect(serverState.lastLoginRememberMe).toBe(true);
    expect(serverState.rememberedByRole?.student).toBe('mca_demo_student');
    // Plaintext username must never be stored in document.cookie or localStorage
    expect(document.cookie).not.toContain('mca_demo_student');
    expect(localStorage.getItem('mca_remembered_student')).toBeNull();

    // Logout and return to central login page
    const sidebar = screen.getByLabelText('Student Portal Navigation');
    fireEvent.click(within(sidebar).getByRole('button', { name: /Logout/i }));
    await waitFor(() => expect(serverState.logoutCalls).toBe(1));
    firstRender.unmount();

    // Subsequent login session restores remembered username from encrypted server endpoint
    window.history.replaceState({}, '', '/accounts/login/');
    render(<App />);
    const idInput = (await screen.findByPlaceholderText('Enter Student ID or username')) as HTMLInputElement;
    await waitFor(() => {
      expect(idInput.value).toBe('mca_demo_student');
    });
    expect(screen.getByText(/Remembered Student username restored/i)).toBeInTheDocument();
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);

    // Clicking Clear removes remembered username and unchecks Remember Me
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/i }));
    await waitFor(() => {
      expect(idInput.value).toBe('');
      expect(serverState.rememberedByRole?.student).toBeUndefined();
    });
  });

  it('verifies Forgot Password email link tokens on mount and rejects expired reset links cleanly', async () => {
    // 1. Expired / invalid token shows alert and returns user to request step
    window.history.replaceState({}, '', '/accounts/password-reset-confirm/?token=expired-invalid-token');
    const expiredMount = render(<App />);
    expect(
      await screen.findByText(/This password reset link is invalid or has expired\./i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., MCA2401/i)).toBeInTheDocument();
    expiredMount.unmount();

    // 2. Valid email verification link confirms token and completes password update
    window.history.replaceState({}, '', '/accounts/password-reset-confirm/?token=valid-email-reset-token.mock-hmac-sig');
    render(<App />);
    expect(await screen.findByText(/Email Verification Token Confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/dev\*\*\*@gmail\.com/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter new password'), {
      target: { value: 'VerifiedLink#2026!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'VerifiedLink#2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Set New Password/i }));

    expect(
      await screen.findByRole('heading', { name: /Password Updated Successfully/i })
    ).toBeInTheDocument();
  });

  it('initializes Sem 1 subjects as Upcoming with 0% progress and enforces Faculty Draft vs Publish PDF visibility', async () => {
    window.history.replaceState({}, '', '/accounts/login/');
    const loginMount = render(<App />);
    expect(document.querySelector('img[src*="academic_portal_hero"]')).toBeInTheDocument();

    const idInput = (await screen.findByPlaceholderText('Enter Student ID or username')) as HTMLInputElement;
    const passInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement;

    // Sign in as real student and confirm Upcoming status + 0% initial Sem 1 progress + Pending assessments
    fireEvent.change(idInput, { target: { value: 'MCA2401' } });
    fireEvent.change(passInput, { target: { value: DEMO_PASSWORD } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Student Portal/i }));
    const studentSidebar = await screen.findByLabelText('Student Portal Navigation');
    expect(screen.getAllByText('Upcoming').length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/Academic Workflow/i)).toBeInTheDocument();

    fireEvent.click(within(studentSidebar).getByRole('button', { name: /Academic Reports/i }));
    expect(await screen.findByText(/Evaluated Courses:/i)).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(3);

    fireEvent.click(within(studentSidebar).getByRole('button', { name: /My Subjects/i }));
    expect(await screen.findByRole('heading', { name: /My Academic Subjects/i })).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(3);

    fireEvent.click(within(studentSidebar).getByRole('button', { name: /Logout/i }));
    await waitFor(() => expect(serverState.logoutCalls).toBe(1));

    // 2. Faculty saves a new PDF as Draft -> hidden from Students until Faculty toggles Publish
    serverState.authenticated = false;
    fireEvent.click(await within(screen.getByRole('banner')).findByRole('button', { name: /^Login$/i }));
    const roleGroup1 = await screen.findByRole('group', { name: /Select Login Role/i });
    fireEvent.click(within(roleGroup1).getByRole('button', { name: /^Faculty$/i }));
    fireEvent.change(await screen.findByPlaceholderText(/Enter Faculty ID or username/i), {
      target: { value: 'FAC001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), {
      target: { value: 'Faculty@2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Faculty Portal/i }));
    const facSidebar = await screen.findByLabelText('Faculty Portal Navigation');

    fireEvent.click(within(facSidebar).getByRole('button', { name: /Document & Material Mgr/i }));
    const titleInput = await screen.findByPlaceholderText(/Unit 1 Lecture Notes & Solved Proofs/i);
    fireEvent.change(titleInput, { target: { value: 'Unit 1 Faculty Draft Logic Guide' } });
    fireEvent.click(screen.getByRole('button', { name: /Save as Draft/i }));

    expect(
      await screen.findByText(/Saved as Draft \(hidden from students\): "Unit 1 Faculty Draft Logic Guide"/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft (Hidden from Students)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    await waitFor(() => expect(serverState.logoutCalls).toBe(2));

    // Student logs in and checks Learning Materials -> Draft PDF is strictly excluded
    serverState.authenticated = false;
    fireEvent.click(await within(screen.getByRole('banner')).findByRole('button', { name: /^Login$/i }));
    await performDemoLogin(false);
    const stuNav = screen.getByLabelText('Student Portal Navigation');
    fireEvent.click(within(stuNav).getByRole('button', { name: /Learning Materials/i }));
    await screen.findByRole('heading', { name: /Learning Materials & AI Study Packs/i });
    expect(screen.queryByText('Unit 1 Faculty Draft Logic Guide')).not.toBeInTheDocument();

    fireEvent.click(within(stuNav).getByRole('button', { name: /Logout/i }));
    await waitFor(() => expect(serverState.logoutCalls).toBe(3));

    // Faculty publishes the Draft PDF -> now visible in Student Learning Materials
    serverState.authenticated = false;
    fireEvent.click(await within(screen.getByRole('banner')).findByRole('button', { name: /^Login$/i }));
    const roleGroup2 = await screen.findByRole('group', { name: /Select Login Role/i });
    fireEvent.click(within(roleGroup2).getByRole('button', { name: /^Faculty$/i }));
    fireEvent.change(await screen.findByPlaceholderText(/Enter Faculty ID or username/i), {
      target: { value: 'FAC001' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), {
      target: { value: 'Faculty@2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Faculty Portal/i }));
    const facNav2 = await screen.findByLabelText('Faculty Portal Navigation');
    fireEvent.click(within(facNav2).getByRole('button', { name: /Document & Material Mgr/i }));
    const publishRowBtn = await screen.findByRole('button', { name: /^Publish$/i });
    fireEvent.click(publishRowBtn);
    expect(screen.queryByText('Draft (Hidden from Students)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    await waitFor(() => expect(serverState.logoutCalls).toBe(4));

    serverState.authenticated = false;
    fireEvent.click(await within(screen.getByRole('banner')).findByRole('button', { name: /^Login$/i }));
    await performDemoLogin(false);
    const stuNav2 = screen.getByLabelText('Student Portal Navigation');
    fireEvent.click(within(stuNav2).getByRole('button', { name: /Learning Materials/i }));
    expect(await screen.findByText('Unit 1 Faculty Draft Logic Guide')).toBeInTheDocument();
    loginMount.unmount();
  });

  it('renders production credential login card cleanly without demo credentials panel and protects /admin-portal/overview/ behind Admin authentication', async () => {
    serverState.demoPortalAccess = false;
    window.history.replaceState({}, '', '/admin-portal/overview/');
    const mounted = render(<App />);

    // Unauthenticated access to /admin-portal/overview/ in production mode requires credential login
    const card = await screen.findByTestId('login-card');
    expect(card.parentElement?.className).toContain('max-w-[544px]');
    expect(screen.queryByTestId('portal-selection-grid')).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo Credentials/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Admin Portal Navigation')).not.toBeInTheDocument();

    const adminIdInput = screen.getByPlaceholderText(/Enter Admin ID or username/i) as HTMLInputElement;
    const adminPassInput = screen.getByPlaceholderText(/Enter password/i) as HTMLInputElement;
    expect(adminIdInput.className).toContain('w-full');
    expect(adminPassInput.className).toContain('w-full');

    // Verify PasswordStrengthMeter + live Password Requirements on production credential screen
    const reqRegion = screen.getByRole('region', { name: /Password requirements/i });
    const strengthBar = screen.getByRole('progressbar', { name: /Password strength/i });
    fireEvent.change(adminPassInput, { target: { value: 'CampusStrong#2026!' } });
    expect(strengthBar).toHaveAttribute('aria-valuenow', '100');
    expect(within(reqRegion).getByText(/Minimum 8 characters/i).closest('li')).toHaveAttribute('data-met', 'true');

    fireEvent.change(adminIdInput, { target: { value: 'ADM001' } });
    fireEvent.change(adminPassInput, { target: { value: 'Admin@2026!' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Admin Portal/i }));

    expect(await screen.findByLabelText('Admin Portal Navigation')).toBeInTheDocument();
    mounted.unmount();
  });
});




