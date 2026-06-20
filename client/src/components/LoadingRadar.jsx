import React from 'react';

export default function LoadingRadar() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border border-cyan/20"></div>
        <div className="absolute inset-2 rounded-full border border-cyan/40"></div>
        <div className="absolute inset-4 rounded-full border border-cyan/60"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-cyan/50 origin-left animate-[spin_2s_linear_infinite]"></div>
        <div className="absolute inset-0 rounded-full bg-cyan/10 animate-ping"></div>
      </div>
    </div>
  );
}
