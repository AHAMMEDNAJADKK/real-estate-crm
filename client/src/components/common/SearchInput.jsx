import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search records...',
  onClear,
  className = ''
}) => {
  return (
    <div className={`relative w-full sm:w-72 ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#64748B]">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#243249] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/40 focus:border-[#6D28D9] transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear && onClear();
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-[#64748B] hover:text-slate-700 dark:hover:text-[#F8FAFC] cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
