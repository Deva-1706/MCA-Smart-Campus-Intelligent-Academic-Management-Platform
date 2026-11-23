import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { PasswordRequirements, evaluatePasswordRequirements } from './PasswordRequirements';

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'welcome123',
  'letmein123',
  'mcacampus',
  'changeme',
]);

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  percent: number;
  label: 'Not entered' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  barColor: string;
  textColor: string;
  guidance: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    letterAndNumberOrSymbol: boolean;
    notCommonOrNumeric: boolean;
    mixedCaseAndSymbol: boolean;
  };
}

export function evaluatePasswordStrength(
  password: string,
  forbiddenTokens: string[] = []
): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      percent: 0,
      label: 'Not entered',
      barColor: 'bg-[#E5DFD9] dark:bg-[#3D3835]',
      textColor: 'text-[#6E6863] dark:text-[#BDB7B2]',
      guidance: 'Use 8+ characters combining uppercase letters, numbers, and special characters.',
      checks: {
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        letterAndNumberOrSymbol: false,
        notCommonOrNumeric: false,
        mixedCaseAndSymbol: false,
      },
    };
  }

  const lower = password.toLowerCase();
  const reqChecks = evaluatePasswordRequirements(password, 8);
  const { minLength, hasUppercase, hasNumber, hasSpecialChar } = reqChecks;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasUpperAndLower = hasUppercase && /[a-z]/.test(password);
  const letterAndNumberOrSymbol = hasLetter && (hasNumber || hasSpecialChar);
  const isNumericOnly = /^\d+$/.test(password);
  const isCommon = COMMON_WEAK_PASSWORDS.has(lower);
  const containsForbidden = forbiddenTokens.some(
    tok => tok && tok.trim().length >= 3 && lower.includes(tok.trim().toLowerCase())
  );
  const notCommonOrNumeric = !isNumericOnly && !isCommon && !containsForbidden;
  const mixedCaseAndSymbol = hasUpperAndLower && hasNumber && hasSpecialChar;
  const checks = {
    minLength,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
    letterAndNumberOrSymbol,
    notCommonOrNumeric,
    mixedCaseAndSymbol,
  };

  if (!notCommonOrNumeric) {
    return {
      score: 1,
      percent: 25,
      label: 'Weak',
      barColor: 'bg-[#B83232]',
      textColor: 'text-[#B83232] dark:text-rose-400',
      guidance: containsForbidden
        ? 'Avoid using your User ID, username, or email inside your password.'
        : 'Avoid numeric-only or commonly guessed passwords.',
      checks,
    };
  }

  let points = 0;
  if (minLength) points += 1;
  if (letterAndNumberOrSymbol) points += 1;
  if (hasUpperAndLower || password.length >= 10) points += 1;
  if ((password.length >= 12 && (hasNumber || hasSpecialChar)) || mixedCaseAndSymbol) points += 1;

  const score = Math.min(4, Math.max(1, points)) as 1 | 2 | 3 | 4;

  if (score === 1) {
    return {
      score: 1,
      percent: 25,
      label: 'Weak',
      barColor: 'bg-[#B83232]',
      textColor: 'text-[#B83232] dark:text-rose-400',
      guidance: !minLength
        ? 'Enter at least 8 characters.'
        : 'Combine letters with a number or special symbol.',
      checks,
    };
  }

  if (score === 2) {
    return {
      score: 2,
      percent: 50,
      label: 'Fair',
      barColor: 'bg-[#D97706]',
      textColor: 'text-[#9A5B13] dark:text-amber-400',
      guidance: !minLength
        ? 'Reach 8+ characters to strengthen this password.'
        : !letterAndNumberOrSymbol
        ? 'Add a number or symbol (e.g. @, #, !) to improve strength.'
        : 'Add uppercase + lowercase letters or 10+ characters.',
      checks,
    };
  }

  if (score === 3) {
    return {
      score: 3,
      percent: 75,
      label: 'Good',
      barColor: 'bg-[#E2A919]',
      textColor: 'text-[#795548] dark:text-[#F2C94C]',
      guidance: 'Good strength — add a special character or 12+ length for maximum security.',
      checks,
    };
  }

  return {
    score: 4,
    percent: 100,
    label: 'Strong',
    barColor: 'bg-emerald-600 dark:bg-emerald-500',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    guidance: 'Strong institutional password meets all security recommendations.',
    checks,
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  forbiddenTokens?: string[];
  showChecklist?: boolean;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  forbiddenTokens = [],
  showChecklist = false,
  className = 'mt-2',
}) => {
  const result = evaluatePasswordStrength(password, forbiddenTokens);

  return (
    <div className={`${className} space-y-1.5`.trim()} aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-[#6E6863] dark:text-[#BDB7B2]">
          Password Strength
        </span>
        <span className={`inline-flex items-center gap-1 font-bold ${result.textColor}`}>
          {result.score >= 3 ? (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : result.score > 0 ? (
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : null}
          <span>{result.label}</span>
        </span>
      </div>

      {/* Visual Progress Bar */}
      <div
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={result.percent}
        aria-valuetext={result.label}
        className="w-full h-2 rounded-full bg-[#EFEBE9] dark:bg-[#1E1E1E] overflow-hidden border border-[#E5DFD9] dark:border-[#3D3835]"
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${result.barColor}`}
          style={{ width: `${result.percent}%` }}
        />
      </div>

      <p className="text-[11px] text-[#6E6863] dark:text-[#BDB7B2] leading-snug">
        {result.guidance}
      </p>

      {showChecklist && <PasswordRequirements password={password} />}
    </div>
  );
};
