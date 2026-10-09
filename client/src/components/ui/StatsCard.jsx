import React from 'react';

const colorThemes = {
  purple: {
    bg: 'bg-[#442d82]/10',
    border: 'border-[#442d82]/20',
    text: 'text-[#442d82] dark:text-purple-400',
    glow: 'shadow-purple-500/5'
  },
  lime: {
    bg: 'bg-[#b7d333]/20',
    border: 'border-[#b7d333]/40',
    text: 'text-slate-900 dark:text-[#b7d333]',
    glow: 'shadow-lime-500/5'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/5'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/5'
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-rose-500/5'
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-600 dark:text-sky-400',
    glow: 'shadow-sky-500/5'
  }
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'purple',
  loading = false,
  className = ''
}) => {
  const scheme = colorThemes[color] || colorThemes.purple;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 ${scheme.glow} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
          )}
          {(subtitle || trend) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {trend && (
                <span
                  className={`font-semibold ${
                    trend.positive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </div>

        <div
          className={`p-3.5 rounded-xl border ${scheme.bg} ${scheme.border} ${scheme.text} flex items-center justify-center`}
        >
          {Icon && <Icon size={22} className="stroke-[2.2px]" />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
