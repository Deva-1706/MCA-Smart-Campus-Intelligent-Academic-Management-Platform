import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface PasswordRequirementChecks {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  allMet: boolean;
}

export function evaluatePasswordRequirements(
  password: string,
  minLength = 8
): PasswordRequirementChecks {
  const lengthOk = password.length >= minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return {
    minLength: lengthOk,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
    allMet: lengthOk && hasUppercase && hasNumber && hasSpecialChar,
  };
}

interface PasswordRequirementsProps {
  password: string;
  minLength?: number;
  className?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  minLength = 8,
  className = '',
}) => {
  const checks = evaluatePasswordRequirements(password, minLength);

  const items = [
    { met: checks.minLength, label: `Minimum ${minLength} characters` },
    { met: checks.hasUppercase, label: 'Uppercase letter (A–Z)' },
    { met: checks.hasNumber, label: 'Number (0–9)' },
    { met: checks.hasSpecialChar, label: 'Special character (!@#$)' },
  ];

  const metCount = items.filter(item => item.met).length;

  return (
    <div
      role="region"
      aria-label="Password requirements"
      aria-live="polite"
      className={`mt-2.5 pt-2.5 space-y-2 border-t border-[#E5DFD9] dark:border-[#3D3835] ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E6863] dark:text-[#BDB7B2]">
          Password Requirements
        </p>
        <span
          className={`text-[11px] font-bold ${
            checks.allMet
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-[#795548] dark:text-[#BDB7B2]'
          }`}
        >
          {metCount}/4 met
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-[#6E6863] dark:text-[#BDB7B2]">
        {items.map(req => (
          <li
            key={req.label}
            data-met={req.met ? 'true' : 'false'}
            className={`flex items-center gap-1.5 transition-colors ${
              req.met
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-[#6E6863] dark:text-[#BDB7B2]'
            }`}
          >
            {req.met ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
