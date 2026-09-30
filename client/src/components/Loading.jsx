import React from 'react';

const Loading = ({ text = 'Loading system data...', fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-[#800020]/20 border-t-[#800020] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
        </div>
      </div>
      <p className="text-sm font-medium text-[#6B7280] animate-pulse">{text}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F8F8]">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
