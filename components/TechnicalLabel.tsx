
import React from 'react';

interface Props {
  text: string;
  className?: string;
}

export const TechnicalLabel: React.FC<Props> = ({ text, className = "" }) => (
  <div className={`flex items-center gap-2 mb-2 ${className}`}>
    <div className="h-[1px] flex-grow bg-slate-200"></div>
    <span className="technical-font text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap px-1">
      {text}
    </span>
    <div className="h-[1px] w-4 bg-slate-200"></div>
  </div>
);
