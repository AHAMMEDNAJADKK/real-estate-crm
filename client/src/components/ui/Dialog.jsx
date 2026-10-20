import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Dialog = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  className = ''
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-[#0F172A]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#1E2B40] text-slate-900 dark:text-[#F8FAFC] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-hidden transform transition-all z-10 my-8 ${className}`}
      >
        {(title || subtitle) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-[#334155] bg-slate-50/50 dark:bg-[#1A2537]/50">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#243249] rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Dialog;
