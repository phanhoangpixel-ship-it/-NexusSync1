import React, { useState, useEffect, useRef } from "react";
import { Banknote, Sparkles, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { formatNumber, parseNumber } from "../../utils/numberFormat";
import { formatAmountInWordsShort, formatAmountInWordsFull } from "../../utils/currencyFormatter";

export interface CurrencyInputProps {
  value: number | string;
  onChange: (numericValue: number, formattedString: string) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  showBadge?: boolean;
  showPresets?: boolean;
  showFullWordsTooltip?: boolean;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  currencySymbol?: string;
  min?: number;
  max?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label,
  placeholder = "Nhập số tiền...",
  id,
  name,
  className = "",
  inputClassName = "",
  showBadge = true,
  showPresets = true,
  showFullWordsTooltip = true,
  disabled = false,
  required = false,
  autoFocus = false,
  currencySymbol = "VNĐ",
  min = 0,
  max,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Numeric representation
  const numericValue = typeof value === "number" ? value : parseNumber(value);

  // Formatted string representation for display in input
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === null || value === undefined || value === "") return "";
    return formatNumber(value);
  });

  // Sync internal displayValue when external value changes
  useEffect(() => {
    if (value === null || value === undefined || value === "") {
      setDisplayValue("");
    } else {
      const formatted = formatNumber(value);
      setDisplayValue(formatted);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const inputElem = e.target;
    const oldCursorPos = inputElem.selectionStart ?? rawInput.length;
    
    // Count digits before cursor in rawInput
    const digitsBeforeCursor = rawInput.slice(0, oldCursorPos).replace(/[^0-9]/g, "").length;

    if (rawInput.trim() === "") {
      setDisplayValue("");
      onChange(0, "");
      return;
    }

    // Parse to clean numeric value
    const parsedNum = parseNumber(rawInput);
    
    // Check min/max bounds if specified
    let clampedNum = parsedNum;
    if (min !== undefined && clampedNum < min && rawInput.trim() !== "") {
      // Allow zero or typing
    }
    if (max !== undefined && clampedNum > max) {
      clampedNum = max;
    }

    // Format new display value with Vietnamese thousands dot
    const newFormatted = formatNumber(clampedNum);
    setDisplayValue(newFormatted);

    // Calculate new cursor position based on digit count
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

    // Restore cursor position smoothly
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });

    // Notify parent listener with raw numeric number AND formatted string
    onChange(clampedNum, newFormatted);
  };

  const handleAddPreset = (addAmount: number) => {
    const newTotal = (numericValue || 0) + addAmount;
    const formatted = formatNumber(newTotal);
    setDisplayValue(formatted);
    onChange(newTotal, formatted);
  };

  const handleReset = () => {
    setDisplayValue("");
    onChange(0, "");
  };

  // Words representations
  const shortWordsBadge = formatAmountInWordsShort(numericValue);
  const fullWordsText = formatAmountInWordsFull(numericValue);

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {/* Input Label & Live Amount Badge */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {label && (
          <label htmlFor={id} className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        {/* Live Amount Badge (Đọc số tiền bằng chữ) */}
        {showBadge && (
          <div
            title={showFullWordsTooltip ? `Bằng chữ: ${fullWordsText}` : undefined}
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] transition-all border ${
              numericValue > 0
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 shadow-xs"
                : numericValue < 0
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold font-mono tabular-nums">{displayValue || "0"} {currencySymbol}</span>
            {numericValue > 0 && (
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold border-l border-emerald-300 dark:border-emerald-700 pl-1.5 ml-1">
                ({shortWordsBadge})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input Box Wrapper */}
      <div className="relative rounded-lg shadow-xs">
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
          className={`w-full px-3 py-2 pr-12 text-sm font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 transition placeholder:font-sans placeholder:font-normal placeholder:text-left placeholder:text-slate-400 dark:placeholder:text-slate-500 ${inputClassName}`}
        />

        {/* Right Currency Suffix */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
          {currencySymbol}
        </div>
      </div>

      {/* Full Words Subtext & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Full Text Reading */}
        {showFullWordsTooltip && numericValue > 0 && (
          <div className="text-slate-500 dark:text-slate-400 italic flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Bằng chữ: <strong className="not-italic text-slate-700 dark:text-slate-200 font-medium">{fullWordsText}</strong></span>
          </div>
        )}

        {/* Quick Add Presets (+10M, +100M, +1B) */}
        {showPresets && !disabled && (
          <div className="flex items-center space-x-1 ml-auto shrink-0">
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">Cộng nhanh:</span>
            <button
              type="button"
              onClick={() => handleAddPreset(10000000)}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono tabular-nums font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              +10Tr
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset(100000000)}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono tabular-nums font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              +100Tr
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset(1000000000)}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-300 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono tabular-nums font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              +1Tỷ
            </button>
            {numericValue > 0 && (
              <button
                type="button"
                onClick={handleReset}
                title="Xóa nhập lại"
                className="p-0.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
