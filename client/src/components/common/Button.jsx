import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const isBusy = isLoading || loading;
  const base = 'inline-flex items-center justify-center font-semibold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1';

  const variants = {
    primary: 'bg-[#6D28D9] text-white hover:bg-[#5B21B6] focus:ring-[#6D28D9]/50 shadow-xs shadow-[#6D28D9]/25 active:scale-[0.98]',
    accent: 'bg-[#84CC16] text-slate-900 hover:bg-[#65A30D] focus:ring-[#84CC16]/50 font-bold shadow-xs shadow-[#84CC16]/20',
    secondary: 'bg-slate-100 dark:bg-[#243249] text-slate-800 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] hover:bg-slate-200 dark:hover:bg-[#334155] hover:border-slate-400 dark:hover:border-[#475569] focus:ring-[#6D28D9]/30',
    outline: 'border border-slate-300 dark:border-[#334155] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#243249] focus:ring-[#6D28D9]/30',
    danger: 'bg-rose-600 dark:bg-[#EF4444] text-white hover:bg-rose-700 dark:hover:bg-[#DC2626] focus:ring-rose-500/50 shadow-xs shadow-rose-500/20',
    ghost: 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#243249] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      disabled={disabled || isBusy}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isBusy ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
