import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-[#442d82] border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    hot: 'bg-rose-500 text-white font-semibold',
    warm: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    cold: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    rnt: 'bg-purple-100 text-purple-800 border-purple-300 font-semibold',
    switchedoff: 'bg-slate-200 text-slate-700 border-slate-300 font-semibold'
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  // Auto-detect temperature or status variant if matching text
  let computedVariant = variant;
  const str = String(children || '').trim().toLowerCase();
  if (computedVariant === 'default') {
    if (str === 'hot' || str === 'hot lead') computedVariant = 'hot';
    else if (str === 'warm' || str === 'warm lead') computedVariant = 'warm';
    else if (str === 'cold' || str === 'cold lead') computedVariant = 'cold';
    else if (str === 'rnt') computedVariant = 'rnt';
    else if (str === 'switchedoff' || str === 'switched off') computedVariant = 'switchedoff';
    else if (['converted', 'completed', 'available', 'paid', 'successful', 'active'].includes(str)) computedVariant = 'success';
    else if (['lost', 'cancelled', 'failed', 'sold'].includes(str)) computedVariant = 'danger';
    else if (['pending', 'follow up', 'reserved', 'on hold'].includes(str)) computedVariant = 'warning';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border text-center font-medium capitalize transition-colors ${variants[computedVariant] || variants.default} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
