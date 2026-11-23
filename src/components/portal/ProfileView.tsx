import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { authFetch } from '../../utils/authFetch';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, completePasswordChange } = usePortal();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!currentUser) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!oldPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[\d\W_]/.test(newPassword)) {
      setPasswordError('Password must combine letters with at least one number or special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password. Please verify your current password.');
        setIsUpdating(false);
        return;
      }

      if (data.user) {
        completePasswordChange(data.user);
      }
      setPasswordSuccess(true);
      setIsUpdating(false);
      setTimeout(() => {
        setPasswordSuccess(false);
        setPasswordModalOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
      }, 1400);
    } catch {
      setPasswordError('Unable to verify current password with authentication server.');
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Student Identity & Records
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#795548] dark:text-[#BDB7B2] mt-1">
          Registered academic credentials, enrollment records, and server-verified account security.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] border-t-4 border-t-[#B83232] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DFD9] dark:border-[#3D3835]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#B83232] text-[#F2C94C] flex items-center justify-center font-extrabold text-2xl shadow-sm border-2 border-[#795548]/40">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#292929] dark:text-[#F7F5F2]">
                  {currentUser.name}
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#EFEBE9] text-[#795548] dark:bg-[#1E1E1E] dark:text-[#F2C94C] border border-[#795548]/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#795548] dark:text-[#BDB7B2] font-mono mt-0.5">
                {currentUser.studentId} · {currentUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-[#795548] text-[#292929] dark:text-[#F7F5F2] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Key className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
            <span>Update Password</span>
          </button>
        </div>

        {/* Academic Records Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1">
            <span className="text-[#795548] dark:text-[#BDB7B2] block text-[10px] uppercase font-bold">Enrolled Program</span>
            <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">{currentUser.program}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1">
            <span className="text-[#795548] dark:text-[#BDB7B2] block text-[10px] uppercase font-bold">Academic Batch</span>
            <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">{currentUser.batch}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1">
            <span className="text-[#795548] dark:text-[#BDB7B2] block text-[10px] uppercase font-bold">Current Semester</span>
            <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">Semester {currentUser.semester}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1 border-t-2 border-t-[#B83232]">
            <span className="text-[#795548] dark:text-[#BDB7B2] block text-[10px] uppercase font-bold">Faculty Advisor</span>
            <span className="font-extrabold text-[#B83232] dark:text-[#F2C94C]">{currentUser.advisorName || 'HCASICAN'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1">
            <span className="text-[#795548] dark:text-[#BDB7B2] block text-[10px] uppercase font-bold">Credit Progress</span>
            <span className="font-bold font-mono tabular-nums text-[#292929] dark:text-[#F7F5F2]">
              {currentUser.completedCredits} / {currentUser.totalCredits} Credits
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-1">
            <span className="text-[#795548] dark:text-[#BDB7B2] block text-[10px] uppercase font-bold">Current SGPA</span>
            <span className="font-extrabold font-mono text-[#B83232] dark:text-[#F2C94C]">{currentUser.currentSGPA.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Account Security & Identity Controls */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
              <span>Account Security & Session Verification</span>
            </h3>
            <p className="text-xs text-[#795548] dark:text-[#BDB7B2]">
              Role-isolated session bound to <span className="font-mono font-bold">@{currentUser.username}</span> ({currentUser.role || 'student'}). Student records are strictly isolated to your authenticated ID.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#292929] text-[#F2C94C] hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#292929]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#292929] border-2 border-[#795548] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#292929] dark:text-[#F7F5F2]">
              Change Account Password
            </h3>
            {passwordSuccess ? (
              <div className="p-3 rounded-lg bg-[#EFEBE9] dark:bg-[#1E1E1E] text-[#B83232] dark:text-[#F2C94C] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />
                <span>Password updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3" noValidate>
                {passwordError && (
                  <div role="alert" className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-[#292929] dark:text-[#F7F5F2]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPasswordError('');
                    }}
                    className="px-3 py-1.5 text-xs text-[#6E6863] dark:text-[#BDB7B2] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
