import React, { useState, useEffect } from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  ArrowLeft,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Inbox,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { PasswordRequirements } from '../common/PasswordRequirements';
import { authFetch } from '../../utils/authFetch';

interface DevMailPreview {
  messageId: string;
  to: string;
  subject: string;
  text: string;
  resetPath: string;
  resetLink: string;
  verificationCode: string;
  expiresAt: number;
  sentAt: string;
}

export const PasswordResetPage: React.FC = () => {
  const { setCurrentPage } = usePortal();

  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [identifier, setIdentifier] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [devMessageId, setDevMessageId] = useState<string | null>(null);
  const [devMail, setDevMail] = useState<DevMailPreview | null>(null);
  const [isLoadingDevMail, setIsLoadingDevMail] = useState(false);

  const verifyEmailTokenWithServer = async (token: string) => {
    setIsVerifyingToken(true);
    setError('');
    try {
      const res = await authFetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.valid) {
        setResetToken('');
        setStep('request');
        setError(data.error || 'This password reset verification link is invalid or has expired. Please request a new one.');
        return false;
      }
      setResetToken(token);
      setMaskedEmail(data.maskedEmail || 'registered email');
      setExpiresAt(typeof data.expiresAt === 'number' ? data.expiresAt : null);
      setStatusMessage(
        `Email token verified for ${data.maskedEmail || 'your registered email'}. Enter your new strong password below.`
      );
      setStep('confirm');
      return true;
    } catch {
      setResetToken('');
      setStep('request');
      setError('Unable to verify your reset token right now. Please request a new verification email.');
      return false;
    } finally {
      setIsVerifyingToken(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam && tokenParam.trim()) {
      void verifyEmailTokenWithServer(tokenParam.trim());
    }
  }, []);

  const dispatchResetEmail = async (targetIdentifier: string) => {
    setError('');
    setStatusMessage('');
    setDevMail(null);
    setDevMessageId(null);

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetIdentifier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Unable to verify account identifier.');
        return;
      }

      setMaskedEmail(data.maskedEmail || 'registered institutional email');
      setExpiresAt(typeof data.expiresAt === 'number' ? data.expiresAt : null);
      if (data.deliveryMode === 'dev_inbox' && typeof data.devMessageId === 'string') {
        setDevMessageId(data.devMessageId);
      }
      setStatusMessage(
        data.message ||
          `A unique, time-limited verification link and 6-digit code have been sent to ${data.maskedEmail || 'your registered email'}.`
      );
      setStep('confirm');
    } catch {
      setError('Unable to contact email verification service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your registered email address, Institutional ID (e.g., MCA2401), or username.');
      return;
    }
    await dispatchResetEmail(cleanId);
  };

  const handleLoadDevMail = async () => {
    if (!devMessageId || isLoadingDevMail) return;
    setIsLoadingDevMail(true);
    try {
      const res = await authFetch(`/api/auth/dev-mail-preview?messageId=${encodeURIComponent(devMessageId)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.mail) {
        setDevMail(data.mail);
      }
    } catch {
      // Ignore dev mailbox errors
    } finally {
      setIsLoadingDevMail(false);
    }
  };

  const handleOpenDevResetLink = async () => {
    if (!devMail?.resetPath) return;
    const tokenMatch = devMail.resetPath.match(/[?&]token=([^&]+)/);
    const extractedToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : '';
    if (!extractedToken) return;
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', devMail.resetPath);
    }
    setDevMail(null);
    setDevMessageId(null);
    await verifyEmailTokenWithServer(extractedToken);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedInput = verificationCode.trim();
    const looksLikeSignedToken =
      trimmedInput.length > 20 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(trimmedInput);

    const effectiveToken = resetToken.trim() || (looksLikeSignedToken ? trimmedInput : '');
    const effectiveCode = !effectiveToken ? trimmedInput : '';

    if (!effectiveToken && !effectiveCode) {
      setError('Please enter the 6-digit verification code or signed token from your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[\d\W_]/.test(newPassword)) {
      setError('Password must combine letters with at least one number or special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim() || undefined,
          verificationCode: effectiveCode || undefined,
          resetToken: effectiveToken || undefined,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Password reset failed. Please verify your email token or code.');
        return;
      }

      if (typeof window !== 'undefined' && window.location.search.includes('token=')) {
        window.history.replaceState({}, '', '/accounts/password-reset/');
      }
      setStatusMessage(data.message || 'Password updated successfully.');
      setStep('done');
    } catch {
      setError('Unable to reach password reset service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiryFormatted = expiresAt
    ? new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="w-full max-w-[544px] mx-auto px-4 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => {
          setCurrentPage('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D7CCC8] hover:text-[#F2C94C] transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Sign In</span>
      </button>

      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#292929] text-[#F2C94C] dark:bg-[#1E1E1E] border border-[#795548]/40 flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#B83232] dark:text-[#F2C94C]">
            MCA SMART CAMPUS
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#292929] dark:text-[#F7F5F2]">
            Institutional Password Reset
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2]">
            Email verification with unique, time-limited tokens for Student, Faculty &amp; Admin accounts
          </p>
        </div>

        {isVerifyingToken && (
          <div
            role="status"
            className="p-4 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-center gap-2.5 text-xs font-semibold text-[#292929] dark:text-[#F7F5F2]"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[#B83232]" />
            <span>Verifying your email reset token...</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300 text-xs font-medium flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isVerifyingToken && step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="reset-identifier"
                className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5"
              >
                Registered Email Address, Institutional ID, or Username
              </label>
              <input
                id="reset-identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g., MCA2401, FAC001, or email"
                className="w-full h-11 px-4 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
              />
              <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] mt-1.5">
                We will email a unique, single-use verification link and 6-digit code to your registered email address (valid for 15 minutes).
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>{isSubmitting ? 'Sending Verification Email...' : 'Request Reset Verification Code'}</span>
            </button>
          </form>
        )}

        {!isVerifyingToken && step === 'confirm' && (
          <form onSubmit={handleConfirmReset} className="space-y-4" noValidate>
            <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{resetToken ? 'Email Verification Token Confirmed' : `Verification Email Sent to ${maskedEmail}`}</span>
                </p>
                {expiryFormatted && (
                  <span className="text-[10px] font-bold text-[#795548] dark:text-[#F2C94C] shrink-0">
                    Expires {expiryFormatted}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2]">{statusMessage}</p>
              {!resetToken && identifier.trim() && (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void dispatchResetEmail(identifier.trim())}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B83232] dark:text-[#F2C94C] hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend verification email</span>
                  </button>
                  {devMessageId && !devMail && (
                    <button
                      type="button"
                      disabled={isLoadingDevMail}
                      onClick={() => void handleLoadDevMail()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#795548] dark:text-[#D7CCC8] hover:text-[#B83232] dark:hover:text-[#F2C94C] underline disabled:opacity-50"
                    >
                      <Inbox className="w-3 h-3" />
                      <span>{isLoadingDevMail ? 'Loading Dev Inbox...' : 'Open Dev Email Inbox'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {devMail && (
              <div
                data-testid="dev-mail-preview"
                className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E1E1E] border border-[#795548]/35 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C] flex items-center gap-1">
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Dev Sandbox Email Preview</span>
                  </span>
                  <span className="text-[10px] text-[#6E6863] dark:text-[#BDB7B2]">To: {devMail.to}</span>
                </div>
                <p className="font-semibold text-[#292929] dark:text-[#F7F5F2]">{devMail.subject}</p>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] px-2.5 py-1.5">
                  <span className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">Email Verification Code:</span>
                  <code className="font-mono text-xs font-extrabold tracking-widest text-[#292929] dark:text-[#F7F5F2]">
                    {devMail.verificationCode}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => void handleOpenDevResetLink()}
                  className="w-full h-10 px-3 rounded-lg text-xs font-bold text-white bg-[#292929] hover:bg-[#1E1E1E] dark:bg-[#795548] dark:hover:bg-[#6A4A3E] transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Verification Link from Email</span>
                </button>
              </div>
            )}

            {!resetToken && (
              <div>
                <label
                  htmlFor="reset-code"
                  className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5"
                >
                  6-Digit Email Code or Reset Token
                </label>
                <input
                  id="reset-code"
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code or paste email reset token"
                  className="w-full h-11 px-4 rounded-xl text-sm font-mono bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
                />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5"
                >
                  New Password (minimum 8 characters)
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-11 px-4 pr-11 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-[#795548] hover:text-[#B83232] dark:text-[#BDB7B2] dark:hover:text-[#F2C94C] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E1E1E]/90 border border-[#E5DFD9] dark:border-[#3D3835]">
                <PasswordStrengthMeter
                  password={newPassword}
                  forbiddenTokens={[identifier]}
                  className="mt-0"
                />
                <PasswordRequirements password={newPassword} />
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 px-4 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setResetToken('');
                  setDevMail(null);
                  setDevMessageId(null);
                  setError('');
                  if (typeof window !== 'undefined' && window.location.search.includes('token=')) {
                    window.history.replaceState({}, '', '/accounts/password-reset/');
                  }
                }}
                className="h-11 px-4 rounded-xl text-xs font-semibold text-[#795548] dark:text-[#BDB7B2] bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Updating Password...' : 'Set New Password'}</span>
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                Password Updated Successfully
              </h2>
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                {statusMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentPage('login');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors"
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-center gap-1.5 text-[11px] text-[#795548] dark:text-[#BDB7B2]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
          <span>Protected by MCA SMART CAMPUS Identity Verification</span>
        </div>
      </div>
    </div>
  );
};
