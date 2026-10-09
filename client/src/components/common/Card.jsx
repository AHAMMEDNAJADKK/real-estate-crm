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
    <div className={`bg-[#1E2B40] rounded-2xl border border-[#334155] shadow-sm overflow-hidden transition-all duration-200 ${className}`}>
      {(title || action) && (
        <div className={`px-6 py-4 border-b border-[#334155] flex items-center justify-between ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default Card;
