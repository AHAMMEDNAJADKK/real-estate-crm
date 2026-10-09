import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variants = {
    default: 'bg-[#243249] text-[#F8FAFC] border-[#334155]',
    primary: 'bg-[#6D28D9]/20 text-[#A78BFA] border-[#6D28D9]/40',
    success: 'bg-[#84CC16]/20 text-[#84CC16] border-[#84CC16]/40',
    warning: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40',
    danger: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40',
    info: 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40',
    hot: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 font-bold',
    warm: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 font-bold',
    cold: 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40 font-bold',
    rnt: 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/40 font-bold',
    switchedoff: 'bg-[#64748B]/20 text-[#94A3B8] border-[#64748B]/40 font-bold'
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
