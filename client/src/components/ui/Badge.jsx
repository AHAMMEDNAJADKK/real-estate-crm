import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-[#243249] text-[#94A3B8] border-[#334155]',
    primary: 'bg-[#4C2A8A]/40 text-purple-300 border-[#6D28D9]/40',
    success: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
    accent: 'bg-[#84CC16]/20 text-[#84CC16] border-[#84CC16]/40',
    info: 'bg-sky-950/40 text-sky-400 border-sky-800/60'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border transition-all ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
