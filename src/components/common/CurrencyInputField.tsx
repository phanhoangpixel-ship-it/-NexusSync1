import React, { useState, useEffect, useRef } from 'react';
import { formatNumberWithDots, parseFormattedNumber } from '../../lib/currency';

interface CurrencyInputFieldProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  id?: string;
  name?: string;
  suffix?: string;
}

export const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  value,
  onChange,
  placeholder = 'VD: 1.500.000',
  className = '',
  required = false,
  disabled = false,
  min,
  max,
  id,
  name,
  suffix
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(formatNumberWithDots(value));

  useEffect(() => {
    const currentParsed = parseFormattedNumber(displayValue);
    if (currentParsed !== value) {
      setDisplayValue(formatNumberWithDots(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const inputElem = e.target;
    const oldCursorPos = inputElem.selectionStart ?? rawInput.length;
    const digitsBeforeCursor = rawInput.slice(0, oldCursorPos).replace(/\D/g, '').length;

    if (rawInput.trim() === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    let parsed = parseFormattedNumber(rawInput);
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;

    let newFormatted = formatNumberWithDots(parsed);
    if (rawInput.endsWith(',')) {
      if (!newFormatted.includes(',')) {
        newFormatted = newFormatted + ',';
      }
    } else if (rawInput.includes(',')) {
      const parts = rawInput.split(',');
      const decimalDigits = parts[1].replace(/[^0-9]/g, '');
      if (decimalDigits.length > 0) {
        newFormatted = formatNumberWithDots(parsed) + ',' + decimalDigits;
      }
    }
    setDisplayValue(newFormatted);

    let newCursorPos = 0;
    let countedDigits = 0;
    for (let i = 0; i < newFormatted.length; i++) {
      if (/\d/.test(newFormatted[i])) {
        countedDigits++;
      }
      if (countedDigits === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    if (countedDigits < digitsBeforeCursor) {
      newCursorPos = newFormatted.length;
    }

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });

    onChange(parsed);
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 tabular-nums ${
          suffix ? 'pr-12 text-right' : 'text-left'
        } ${className}`}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 font-mono">
          {suffix}
        </div>
      )}
    </div>
  );
};

