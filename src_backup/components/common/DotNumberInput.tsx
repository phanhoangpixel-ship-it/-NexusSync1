import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, parseNumber } from '../../utils/numberFormat';
import { formatAmountInWordsShort } from '../../utils/currencyFormatter';

export interface DotNumberInputProps {
  value: number | string;
  onChange: (numVal: number, formattedStr: string) => void;
  label?: string;
  placeholder?: string;
  suffix?: string;
  id?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  showWordsHint?: boolean;
  autoFocus?: boolean;
}

export const DotNumberInput: React.FC<DotNumberInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0',
  suffix,
  id,
  name,
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  min,
  max,
  showWordsHint = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const getFormatted = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : parseNumber(val);
    if (isNaN(num)) return '';
    return formatNumber(num);
  };

  const [displayValue, setDisplayValue] = useState<string>(() => getFormatted(value));

  useEffect(() => {
    const nextFormatted = getFormatted(value);
    if (nextFormatted !== displayValue && parseNumber(displayValue) !== parseNumber(value)) {
      setDisplayValue(nextFormatted);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const inputElem = e.target;
    const oldCursorPos = inputElem.selectionStart ?? rawInput.length;

    // Count digits before cursor in raw input
    const digitsBeforeCursor = rawInput.slice(0, oldCursorPos).replace(/[^0-9]/g, '').length;

    if (rawInput.trim() === '') {
      setDisplayValue('');
      onChange(0, '');
      return;
    }

    // Parse clean number
    let parsed = parseNumber(rawInput);
    if (min !== undefined && parsed < min && rawInput.trim() !== '') {
      // allow typing
    }
    if (max !== undefined && parsed > max) {
      parsed = max;
    }

    const newFormatted = formatNumber(parsed);
    setDisplayValue(newFormatted);

    // Track new cursor position
    let newCursorPos = 0;
    let countedDigits = 0;
    for (let i = 0; i < newFormatted.length; i++) {
      if (/[0-9]/.test(newFormatted[i])) {
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

    onChange(parsed, newFormatted);
  };

  const numericValue = typeof value === 'number' ? value : parseNumber(value);

  return (
    <div className={`space-y-1 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs mb-1">
          <label htmlFor={id} className="font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          {showWordsHint && numericValue > 0 && (
            <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {formatAmountInWordsShort(numericValue)}
            </span>
          )}
        </div>
      )}

      <div className="relative rounded-xl">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          className={`w-full px-3 py-2 text-xs font-mono font-bold tabular-nums text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-60 transition-all ${
            suffix ? 'pr-12 text-right' : 'text-left'
          } ${inputClassName}`}
        />

        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
            {suffix}
          </div>
        )}
      </div>

      {!label && showWordsHint && numericValue > 0 && (
        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 text-right pr-1">
          ≈ {formatAmountInWordsShort(numericValue)}
        </div>
      )}
    </div>
  );
};
