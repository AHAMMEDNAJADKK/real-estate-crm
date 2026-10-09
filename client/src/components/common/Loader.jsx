import React from 'react';

export const Loader = ({ message = 'Loading real estate data...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[#442d82] border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-[#b7d333] border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }}></div>
      </div>
      <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default Loader;
