import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  actions,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={`bg-[#1E2B40] text-[#F8FAFC] rounded-2xl border border-[#334155] shadow-sm transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4.5 border-b border-[#334155]">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  );
};

export default Card;
