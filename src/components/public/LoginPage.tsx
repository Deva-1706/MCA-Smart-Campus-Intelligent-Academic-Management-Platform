import React, { useState, useEffect, useRef } from 'react';
import { usePortal } from '../../context/PortalContext';
import { UserRole } from '../../types';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  GraduationCap,
  Shield,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { PasswordRequirements } from '../common/PasswordRequirements';
import { authFetch } from '../../utils/authFetch';

interface DemoInfoResponse {
  demoMode: boolean;
  demoPortalAccess?: boolean;
}

interface LoginPageProps {
  portalRole?: UserRole;
}

const PORTAL_CARDS: ReadonlyArray<{
  role: UserRole;
  title: string;
  description: string;
  buttonLabel: string;
  accentClass: string;
  iconBgClass: string;
  icon: React.ElementType;
}> = [
  {
    role: 'student',
    title: 'Student Portal',
    description:
      'Access academic content, subject materials, reading resources, assessments and results.',
    buttonLabel: 'Enter Student Portal',
    accentClass: 'border-t-[#B83232]',
    iconBgClass: 'bg-[#B83232] text-white border-[#F2C94C]/30',
    icon: GraduationCap,
  },
  {
    role: 'faculty',
    title: 'Faculty Portal',
    description:
      'Manage assigned subjects, upload learning materials, create assessments and review student work.',
    buttonLabel: 'Enter Faculty Portal',
    accentClass: 'border-t-[#795548]',
    iconBgClass: 'bg-[#795548] text-[#F2C94C] border-[#F2C94C]/30',
    icon: UserCheck,
  },
  {
    role: 'admin',
    title: 'Admin Portal',
    description:
      'Manage users, academic structure, faculty allocations, permissions and institutional settings.',
    buttonLabel: 'Enter Admin Portal',
    accentClass: 'border-t-[#F2C94C]',
    iconBgClass: 'bg-[#1E1E1E] text-[#F2C94C] border-[#F2C94C]/40',
    icon: Shield,
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ portalRole }) => {
  const { currentPage, setCurrentPage, loginUser } = usePortal();

  const routeDerivedRole: UserRole | undefined =
    portalRole ||
    (currentPage === 'admin-login'
      ? 'admin'
      : currentPage === 'faculty-login'
      ? 'faculty'
      : currentPage === 'student-login'
      ? 'student'
      : undefined);

  const [demoPortalAccess, setDemoPortalAccess] = useState<boolean | null>(null);
  const [enteringRole, setEnteringRole] = useState<UserRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(routeDerivedRole || 'student');

  useEffect(() => {
    if (routeDerivedRole) {
      setSelectedRole(routeDerivedRole);
    }
  }, [routeDerivedRole]);

  const resolvedRole: UserRole = routeDerivedRole || selectedRole;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<{
    userName: string;
    mustChangePassword: boolean;
  } | null>(null);
  const [rememberedByRole, setRememberedByRole] = useState<Partial<Record<UserRole, string>>>({});
  const [rememberedNotice, setRememberedNotice] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  const hasTypedIdentifierRef = useRef(false);

  useEffect(() => {
    let active = true;
    authFetch('/api/auth/demo-info')
      .then(res => (res.ok ? res.json() : null))
      .then((data: DemoInfoResponse | null) => {
        if (!active) return;
        const enabled = Boolean(data?.demoPortalAccess);
        setDemoPortalAccess(enabled);

        if (!enabled) {
          authFetch('/api/auth/remembered-user')
            .then(res => (res.ok ? res.json() : null))
            .then((remData: { rememberedByRole?: Partial<Record<UserRole, string>> } | null) => {
              if (!active) return;
              if (remData?.rememberedByRole && typeof remData.rememberedByRole === 'object') {
                const next = remData.rememberedByRole;
                setRememberedByRole(prev => {
                  if (
                    prev.student === next.student &&
                    prev.faculty === next.faculty &&
                    prev.admin === next.admin
                  ) {
                    return prev;
                  }
                  return next;
                });
              }
            })
            .catch(() => {
              // Ignore network errors reading remembered cookie
            });
        }
      })
      .catch(() => {
        if (active) setDemoPortalAccess(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    hasTypedIdentifierRef.current = false;
    setErrorMessage('');
    setPassword('');
    setShowPassword(false);
    const savedUsername = rememberedByRole[resolvedRole];
    if (savedUsername && savedUsername.trim()) {
      setIdentifier(savedUsername.trim());
      setRememberMe(true);
      setRememberedNotice(true);
    } else {
      setIdentifier('');
      setRememberMe(false);
      setRememberedNotice(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRole]);

  useEffect(() => {
    const savedUsername = rememberedByRole[resolvedRole]?.trim();
    if (!savedUsername || hasTypedIdentifierRef.current) return;
    setIdentifier(savedUsername);
    setRememberMe(true);
    setRememberedNotice(true);
  }, [rememberedByRole, resolvedRole]);

  const handleDemoPortalEnter = async (role: UserRole) => {
    if (enteringRole) return;
    setErrorMessage('');
    setEnteringRole(role);

    try {
      const res = await authFetch('/api/auth/demo-enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.authenticated && data.user) {
        setEnteringRole(null);
        loginUser(data.user, false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setErrorMessage(data.error || 'Unable to enter portal. Please try again.');
      setEnteringRole(null);
    } catch {
      setErrorMessage('Unable to reach the campus portal service. Please try again.');
      setEnteringRole(null);
    }
  };

  // Loading state while verifying whether development DEMO_PORTAL_ACCESS is active
  if (demoPortalAccess === null) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#292929]/90 border border-white/15 text-xs font-semibold text-[#F7F5F2]">
          <Loader2 className="w-4 h-4 animate-spin text-[#F2C94C]" aria-hidden="true" />
          <span>Loading Campus Portal Selection...</span>
        </div>
      </div>
    );
  }

  // Development / Local Demonstration Mode: One-Click Role-Based Portal Selection (Zero Credential UI)
  if (demoPortalAccess) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center space-y-2.5 mb-8 sm:mb-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2C94C]">
            MCA SMART CAMPUS · PORTAL SELECTION
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose Your Campus Portal
          </h1>
          <p className="text-sm sm:text-base text-[#D7CCC8] max-w-2xl mx-auto leading-relaxed">
            Select Student, Faculty, or Admin to enter the corresponding dashboard directly in local development mode.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="max-w-2xl mx-auto mb-6 p-3.5 rounded-xl bg-rose-950/75 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-medium flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div
          data-testid="portal-selection-grid"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
        >
          {PORTAL_CARDS.map(card => {
            const CardIcon = card.icon;
            const isLoading = enteringRole === card.role;
            return (
              <section
                key={card.role}
                aria-labelledby={`portal-heading-${card.role}`}
                data-testid={`portal-card-${card.role}`}
                className={`flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#292929]/95 border border-white/15 border-t-4 ${card.accentClass} shadow-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F2C94C]/45`}
              >
                <div className="space-y-4">
                  <div
                    className={`w-13 h-13 rounded-xl border flex items-center justify-center shadow-xs ${card.iconBgClass}`}
                  >
                    <CardIcon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h2
                      id={`portal-heading-${card.role}`}
                      className="text-xl font-extrabold text-white tracking-tight"
                    >
                      {card.title}
                    </h2>
                    <p className="text-sm text-[#D7CCC8] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <button
                    type="button"
                    disabled={enteringRole !== null}
                    onClick={() => handleDemoPortalEnter(card.role)}
                    className="w-full h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C94C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#292929]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Opening Portal...</span>
                      </>
                    ) : (
                      <>
                        <span>{card.buttonLabel}</span>
                        <ArrowRight className="w-4 h-4 text-[#F2C94C]" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  // Production Mode: Secure Credential-Based Role Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || authSuccess) return;
    setErrorMessage('');

    const cleanUser = identifier.trim();
    if (!cleanUser) {
      setErrorMessage(
        resolvedRole === 'student'
          ? 'Please enter your Student ID, email, or username.'
          : resolvedRole === 'faculty'
          ? 'Please enter your Faculty ID, email, or username.'
          : 'Please enter your Admin ID, email, or username.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password,
          expectedRole: resolvedRole,
          rememberMe,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.authenticated && data.user) {
        const nextUser = data.mustChangePassword
          ? { ...data.user, mustChangePassword: true }
          : data.user;
        setIsSubmitting(false);
        setAuthSuccess({
          userName: nextUser.name || cleanUser,
          mustChangePassword: Boolean(data.mustChangePassword),
        });
        transitionTimerRef.current = window.setTimeout(() => {
          transitionTimerRef.current = null;
          loginUser(nextUser, rememberMe);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 480);
        return;
      }

      const fallbackMessage =
        res.status === 429
          ? 'Too many failed login attempts. Please wait before trying again.'
          : res.status === 403
          ? `Access denied: This login portal is restricted to ${resolvedRole} accounts.`
          : res.status === 401
          ? 'Invalid credentials or password. Please verify and try again.'
          : 'Authentication service returned an unexpected response. Please try again.';
      setErrorMessage(data.error || fallbackMessage);
      setIsSubmitting(false);
    } catch {
      setErrorMessage('Unable to verify credentials with authentication service.');
      setIsSubmitting(false);
    }
  };

  const roleMetadata = {
    student: {
      roleHeading: 'STUDENT PORTAL',
      title: 'Student Portal Sign In',
      subtitle: 'Access MCA coursework, Python Coding Lab, Skill DNA, Projects & Digital Passport',
      idLabel: 'Student ID, Email, or Username',
      idPlaceholder: 'Enter Student ID or username',
      rememberedLabel: 'Remembered Student username restored',
      submitLabel: 'Sign In to Student Portal',
      accentClass: 'border-t-[#B83232]',
      badgeClass: 'bg-[#B83232] text-white',
      icon: GraduationCap,
      helperText: 'Faculty Advisor: HCASICAN · Multi-Semester MCA',
    },
    faculty: {
      roleHeading: 'FACULTY PORTAL',
      title: 'Faculty Portal Sign In',
      subtitle: 'Manage assigned subjects, evaluation, materials, skill verification & project reviews',
      idLabel: 'Faculty ID, Email, or Username',
      idPlaceholder: 'Enter Faculty ID or username',
      rememberedLabel: 'Remembered Faculty username restored',
      submitLabel: 'Sign In to Faculty Portal',
      accentClass: 'border-t-[#795548]',
      badgeClass: 'bg-[#795548] text-[#F2C94C]',
      icon: UserCheck,
      helperText: 'Subject-Allocated & Permission-Governed Access',
    },
    admin: {
      roleHeading: 'ADMIN PORTAL',
      title: 'Admin Portal Sign In',
      subtitle: 'Institutional governance: programmes, allocations, permissions, certificates & audits',
      idLabel: 'Admin ID, Email, or Username',
      idPlaceholder: 'Enter Admin ID or username',
      rememberedLabel: 'Remembered Admin username restored',
      submitLabel: 'Sign In to Admin Portal',
      accentClass: 'border-t-[#292929] dark:border-t-[#F2C94C]',
      badgeClass: 'bg-[#292929] text-[#F2C94C]',
      icon: Shield,
      helperText: 'Strict Institutional Governance Mode',
    },
  }[resolvedRole];

  const RoleIcon = roleMetadata.icon;

  const handleRoleSelect = (role: UserRole, pageId: 'student-login' | 'faculty-login' | 'admin-login') => {
    if (currentPage === 'login' && !portalRole) {
      setSelectedRole(role);
    } else {
      setCurrentPage(pageId);
    }
  };

  return (
    <div className="w-full max-w-[544px] mx-auto px-4 py-6 sm:py-10">
      <div
        data-testid="login-card"
        className={`w-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 ${roleMetadata.accentClass} shadow-xl space-y-5`}
      >
        {/* Role Selection Tabs */}
        <div
          role="group"
          aria-label="Select Login Role"
          className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-[#EFEBE9] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
        >
          {([
            { id: 'student-login' as const, role: 'student' as UserRole, label: 'Student' },
            { id: 'faculty-login' as const, role: 'faculty' as UserRole, label: 'Faculty' },
            { id: 'admin-login' as const, role: 'admin' as UserRole, label: 'Admin' },
          ]).map(tab => {
            const active = resolvedRole === tab.role;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                disabled={isSubmitting || Boolean(authSuccess)}
                onClick={() => handleRoleSelect(tab.role, tab.id)}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                  active
                    ? 'bg-[#B83232] text-white shadow-xs'
                    : 'text-[#795548] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Role Icon, Portal Title & Short Description */}
        <div className="text-center space-y-2 pt-1">
          <div className={`w-12 h-12 rounded-xl ${roleMetadata.badgeClass} border border-[#795548]/40 flex items-center justify-center mx-auto shadow-xs`}>
            <RoleIcon className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#B83232] dark:text-[#F2C94C]">
            MCA SMART CAMPUS · {roleMetadata.roleHeading}
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight">
            {roleMetadata.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] max-w-md mx-auto leading-relaxed">
            {roleMetadata.subtitle}
          </p>
        </div>

        {authSuccess ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="login-success-state"
            className="animate-auth-success-in py-6 px-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-4 overflow-hidden relative"
          >
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-emerald-500/15 dark:bg-emerald-400/15 animate-ping"
              />
              <div className="animate-auth-check-ring relative w-14 h-14 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-7 h-7"
                  aria-hidden="true"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-auth-check-stroke"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Authentication Verified
              </p>
              <h2 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2]">
                Welcome, {authSuccess.userName}
              </h2>
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
                {authSuccess.mustChangePassword
                  ? 'Preparing first-login password setup...'
                  : `Loading ${
                      resolvedRole === 'admin'
                        ? 'Admin'
                        : resolvedRole === 'faculty'
                        ? 'Faculty'
                        : 'Student'
                    } Dashboard...`}
              </p>
            </div>

            <div className="h-1 w-full rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 overflow-hidden">
              <div className="h-full w-full bg-emerald-600 dark:bg-emerald-400 animate-auth-success-sweep" />
            </div>
          </div>
        ) : (
          <>
            {rememberedNotice && (
              <div className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#795548]/40 text-[#292929] dark:text-[#F7F5F2] text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#F2C94C] shrink-0" />
                  <span>{roleMetadata.rememberedLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRememberedNotice(false);
                    setIdentifier('');
                    setRememberMe(false);
                    setRememberedByRole(prev => {
                      const next = { ...prev };
                      delete next[resolvedRole];
                      return next;
                    });
                    authFetch(`/api/auth/remembered-user?role=${encodeURIComponent(resolvedRole)}`, {
                      method: 'DELETE',
                    }).catch(() => {});
                  }}
                  className="text-xs underline font-semibold text-[#B83232] dark:text-[#F2C94C] ml-2 shrink-0"
                >
                  Clear
                </button>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300 text-xs font-medium flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate autoComplete="off">
              {/* ID Field */}
              <div>
                <label htmlFor="login-identifier" className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5">
                  {roleMetadata.idLabel}
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={e => {
                    hasTypedIdentifierRef.current = true;
                    setIdentifier(e.target.value);
                  }}
                  placeholder={roleMetadata.idPlaceholder}
                  autoComplete="username"
                  disabled={isSubmitting}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2] placeholder:text-[#8D857E] dark:placeholder:text-[#7D756E] transition-colors disabled:opacity-60"
                />
              </div>

              {/* Password Field + Strength & Requirements */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="w-full h-11 px-4 pr-11 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2] placeholder:text-[#8D857E] dark:placeholder:text-[#7D756E] transition-colors disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-[#795548] hover:text-[#B83232] hover:bg-[#EFEBE9]/70 dark:text-[#BDB7B2] dark:hover:text-[#F2C94C] dark:hover:bg-[#292929] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E1E1E]/90 border border-[#E5DFD9] dark:border-[#3D3835]">
                  <PasswordStrengthMeter
                    password={password}
                    forbiddenTokens={[identifier]}
                    className="mt-0"
                  />
                  <PasswordRequirements password={password} />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[#292929] dark:text-[#F7F5F2] font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#795548] text-[#B83232] focus:ring-[#B83232]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('forgot-password');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#B83232] dark:text-[#F2C94C] hover:underline text-xs font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] pl-6 leading-tight">
                  {roleMetadata.helperText}
                </p>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>{isSubmitting ? 'Verifying Credentials...' : roleMetadata.submitLabel}</span>
              </button>
            </form>
          </>
        )}

        {/* Security Information */}
        <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] text-center text-[11px] text-[#795548] dark:text-[#BDB7B2] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
          <span>Role-Enforced Session Authentication · HttpOnly &amp; Rate-Limited</span>
        </div>
      </div>
    </div>
  );
};
