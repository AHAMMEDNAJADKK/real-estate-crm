import React from 'react';

export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8] mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full rounded-xl border bg-white dark:bg-[#243249] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 dark:border-[#334155] focus:border-[#6D28D9]'
        } ${disabled ? 'bg-slate-100 dark:bg-[#1E2B40] opacity-60 cursor-not-allowed' : ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="bg-white dark:bg-[#1E2B40] text-slate-400 dark:text-[#94A3B8]">
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-white dark:bg-[#1E2B40] text-slate-900 dark:text-[#F8FAFC]">
              {lbl}
            </option>
          );
        })}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Select;
