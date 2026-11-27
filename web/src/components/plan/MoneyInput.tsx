'use client';

import React, { useRef, useState } from 'react';
import {
  PLAN_LIMITS,
  formatNumberEsAr,
} from '@/shared/services/financial-plan';

interface MoneyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  ariaDescribedBy?: string;
  placeholder?: string;
}

function digitsBefore(str: string, pos: number): number {
  return (str.slice(0, pos).match(/\d/g) || []).length;
}

function caretForDigits(str: string, digits: number): number {
  if (digits <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < str.length; i++) {
    if (/\d/.test(str[i])) seen++;
    if (seen === digits) return i + 1;
  }
  return str.length;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  id,
  value,
  onChange,
  className = '',
  ariaDescribedBy,
  placeholder = '0',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isClearedWhileEditing, setIsClearedWhileEditing] =
    useState<boolean>(false);

  const displayValue =
    isFocused && isClearedWhileEditing && value === 0
      ? ''
      : formatNumberEsAr(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const raw = el.value;
    const selectionPos = el.selectionStart ?? raw.length;
    const digitsCount = digitsBefore(raw, selectionPos);
    const stripped = raw.replace(/\D/g, '');

    if (stripped.length === 0) {
      setIsClearedWhileEditing(true);
      onChange(0);
      return;
    }

    setIsClearedWhileEditing(false);
    const parsed = Math.min(PLAN_LIMITS.maxMoney, parseInt(stripped, 10) || 0);
    onChange(parsed);

    const formatted = formatNumberEsAr(parsed);
    const nextCaret = caretForDigits(formatted, digitsCount);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        try {
          inputRef.current.setSelectionRange(nextCaret, nextCaret);
        } catch {
          // Ignore on inputs that do not support selectionRange
        }
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    const target = e.currentTarget;
    requestAnimationFrame(() => {
      target.select();
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsClearedWhileEditing(false);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      aria-describedby={ariaDescribedBy}
      className={className}
    />
  );
};
