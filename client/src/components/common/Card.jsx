import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`bg-white dark:bg-[#1E2B40] text-slate-900 dark:text-[#F8FAFC] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors duration-200 ${className}`}>
      {(title || action) && (
        <div className={`px-6 py-4 border-b border-slate-200 dark:border-[#334155] flex items-center justify-between ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
