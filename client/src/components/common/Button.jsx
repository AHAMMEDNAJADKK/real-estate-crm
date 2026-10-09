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
    primary: 'bg-[#6D28D9] text-white hover:bg-[#5B21B6] focus:ring-[#6D28D9]/50 shadow-md shadow-[#6D28D9]/25 active:scale-[0.98]',
    accent: 'bg-[#84CC16] text-slate-900 hover:bg-[#65A30D] focus:ring-[#84CC16]/50 font-bold shadow-md shadow-[#84CC16]/20',
    secondary: 'bg-[#243249] text-[#F8FAFC] border border-[#334155] hover:bg-[#334155] hover:border-[#475569] focus:ring-[#6D28D9]/30',
    outline: 'border border-[#334155] text-[#F8FAFC] hover:bg-[#243249] focus:ring-[#6D28D9]/30',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444]/50 shadow-md shadow-[#EF4444]/20',
    ghost: 'text-[#94A3B8] hover:bg-[#243249] hover:text-[#F8FAFC]'
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
