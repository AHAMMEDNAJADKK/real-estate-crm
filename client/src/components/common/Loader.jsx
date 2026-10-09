import React from 'react';

export const Loader = ({ message = 'Loading real estate data...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-[#334155]"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[#6D28D9] border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-[#84CC16] border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }}></div>
      </div>
      <p className="text-xs font-semibold tracking-wide text-[#94A3B8] uppercase">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/75 backdrop-blur-sm">
        <div className="bg-[#1E2B40] text-[#F8FAFC] p-8 rounded-3xl shadow-2xl border border-[#334155]">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default Loader;
