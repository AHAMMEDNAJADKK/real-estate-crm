import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-slate-100 dark:bg-[#243249] text-slate-700 dark:text-[#F8FAFC] border-slate-200 dark:border-[#334155]',
    primary: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    hot: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 font-bold',
    warm: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold',
    cold: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 font-bold',
    rnt: 'bg-purple-50 dark:bg-[#8B5CF6]/20 text-purple-700 dark:text-[#A78BFA] border-purple-200 dark:border-[#8B5CF6]/40 font-bold',
    switchedoff: 'bg-slate-100 dark:bg-[#64748B]/20 text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-[#64748B]/40 font-bold'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  let computedVariant = variant;
  const str = String(children || '').trim().toLowerCase();
  if (computedVariant === 'default') {
    if (str === 'hot' || str === 'hot lead') computedVariant = 'hot';
    else if (str === 'warm' || str === 'warm lead') computedVariant = 'warm';
    else if (str === 'cold' || str === 'cold lead') computedVariant = 'cold';
    else if (str === 'rnt') computedVariant = 'rnt';
    else if (str === 'switchedoff' || str === 'switched off') computedVariant = 'switchedoff';
    else if (['converted', 'completed', 'available', 'paid', 'successful', 'active', 'won'].includes(str)) computedVariant = 'success';
    else if (['lost', 'cancelled', 'failed', 'sold'].includes(str)) computedVariant = 'danger';
    else if (['pending', 'follow up', 'reserved', 'on hold', 'negotiation'].includes(str)) computedVariant = 'warning';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border text-center font-medium transition-colors ${
        variants[computedVariant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
