import React from 'react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#6D28D9] text-white hover:bg-[#5B21B6] focus:ring-[#6D28D9]/50 shadow-xs shadow-[#6D28D9]/25 active:scale-[0.98]',
    secondary: 'bg-slate-100 dark:bg-[#243249] text-slate-800 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#334155] hover:bg-slate-200 dark:hover:bg-[#334155] hover:border-slate-400 dark:hover:border-[#475569] focus:ring-[#6D28D9]/30',
    accent: 'bg-[#84CC16] text-slate-900 font-bold hover:bg-[#65A30D] focus:ring-[#84CC16]/50 shadow-xs shadow-[#84CC16]/20',
    outline: 'border border-slate-300 dark:border-[#334155] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#243249] focus:ring-[#6D28D9]/30',
    danger: 'bg-rose-600 dark:bg-[#EF4444] text-white hover:bg-rose-700 dark:hover:bg-[#DC2626] focus:ring-rose-500/50 shadow-xs',
    ghost: 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#243249] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
