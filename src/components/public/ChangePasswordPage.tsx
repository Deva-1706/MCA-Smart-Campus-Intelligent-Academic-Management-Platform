import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { PageId } from '../../types';
import {
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';
import { PasswordRequirements } from '../common/PasswordRequirements';
import { authFetch } from '../../utils/authFetch';

export const ChangePasswordPage: React.FC = () => {
  const { currentUser, setCurrentPage, completePasswordChange } = usePortal();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const isForcedSetup = Boolean(currentUser.mustChangePassword);
  const roleDefaultPage: PageId =
    currentUser.role === 'admin'
      ? 'admin-overview'
      : currentUser.role === 'faculty'
      ? 'faculty-overview'
      : 'dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!currentPassword) {
      setError('Please enter your current password.');
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
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Unable to update password. Please verify your current password.');
        setIsSubmitting(false);
        return;
      }

      const updatedUser = data.user || {
        ...currentUser,
        mustChangePassword: false,
        passwordUpdatedAt: new Date().toISOString(),
      };
      setSuccessMessage(data.message || 'Your password has been updated securely.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
      completePasswordChange(updatedUser);
    } catch {
      setError('Unable to reach the authentication service. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[544px] mx-auto px-4 py-8 sm:py-10">
      {!isForcedSetup && (
        <button
          type="button"
          onClick={() => {
            setCurrentPage(roleDefaultPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D7CCC8] hover:text-[#F2C94C] transition-colors mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Workspace</span>
        </button>
      )}

      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#292929] text-[#F2C94C] border border-[#795548]/40 flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#B83232] dark:text-[#F2C94C]">
            MCA SMART CAMPUS · ACCOUNT SECURITY
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#292929] dark:text-[#F7F5F2]">
            {isForcedSetup ? 'First-Login Password Setup' : 'Change Account Password'}
          </h1>
          <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2]">
            Signed in as <span className="font-mono font-bold">{currentUser.studentId}</span> ({currentUser.role || 'student'})
          </p>
        </div>

        {isForcedSetup && (
          <div className="p-3.5 rounded-xl bg-[#F2C94C]/15 border border-[#F2C94C]/50 text-[#292929] dark:text-[#F2C94C] text-xs flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#B83232] dark:text-[#F2C94C]" />
            <span>
              Your account was provisioned with a temporary password. Set a personal strong password before entering your workspace.
            </span>
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

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="cp-current" className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5">
              Current Password
            </label>
            <input
              id="cp-current"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full h-11 px-4 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="cp-new" className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5">
                New Password (minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  id="cp-new"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter strong new password"
                  className="w-full h-11 px-4 pr-11 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => !p)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-[#795548] hover:text-[#B83232] dark:text-[#BDB7B2] dark:hover:text-[#F2C94C] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E1E1E]/90 border border-[#E5DFD9] dark:border-[#3D3835]">
              <PasswordStrengthMeter
                password={newPassword}
                forbiddenTokens={[
                  currentUser.studentId,
                  currentUser.username,
                  currentUser.name,
                  currentUser.email,
                ]}
                className="mt-0"
              />
              <PasswordRequirements password={newPassword} />
            </div>
          </div>

          <div>
            <label htmlFor="cp-confirm" className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1.5">
              Confirm New Password
            </label>
            <input
              id="cp-confirm"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full h-11 px-4 rounded-xl text-sm bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20 focus:outline-none text-[#292929] dark:text-[#F7F5F2]"
            />
          </div>

          <p className="text-[11px] text-[#795548] dark:text-[#BDB7B2] leading-relaxed">
            Use at least 8 characters combining letters with numbers or symbols, distinct from your ID and username.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 px-4 rounded-xl text-sm font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

        <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] flex items-center justify-center gap-1.5 text-[11px] text-[#795548] dark:text-[#BDB7B2]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
          <span>Password protected with salted scrypt hashing</span>
        </div>
      </div>
    </div>
  );
};
