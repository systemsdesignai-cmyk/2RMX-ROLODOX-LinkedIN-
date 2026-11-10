import React from 'react';

interface NavButtonProps {
  active: boolean;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
  id?: string;
  dataTourId?: string;
  badge?: number;
  platform?: 'ios' | 'android';
}

export default function NavButton({ active, icon, label, onClick, id, dataTourId, badge, platform = 'ios' }: NavButtonProps) {
  const isAndroid = platform === 'android';

  if (isAndroid) {
    // Material Design 3 (M3) Navigation Bar Item
    return (
      <button 
        id={id}
        data-tour-id={dataTourId}
        type="button"
        onClick={onClick}
        className="flex-1 min-h-[64px] py-1 px-1 flex flex-col items-center justify-center relative select-none cursor-pointer group focus:outline-none transition-colors"
      >
        {/* M3 Active Indicator Pill container */}
        <div className="relative flex items-center justify-center mb-1">
          <div className={`w-14 sm:w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            active 
              ? 'bg-indigo-600/25 text-indigo-400' 
              : 'text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-850/50'
          }`}>
            {React.cloneElement(icon, { className: 'w-5 h-5 stroke-[1.9]' })}
          </div>

          {typeof badge === 'number' && badge > 0 && (
            <span className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-mono font-bold flex items-center justify-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>

        {/* M3 Label Medium (12sp) */}
        <span className={`text-[11px] font-medium tracking-normal text-center w-full truncate transition-colors ${
          active 
            ? 'font-bold text-zinc-100' 
            : 'text-zinc-400 group-hover:text-zinc-300'
        }`}>
          {label}
        </span>
      </button>
    );
  }

  // Apple Human Interface Guidelines (iOS) Tab Bar Item
  return (
    <button 
      id={id}
      data-tour-id={dataTourId}
      type="button"
      onClick={onClick}
      className={`flex-1 min-h-[49px] py-1 px-1 flex flex-col items-center justify-center relative select-none cursor-pointer active:opacity-70 group focus:outline-none transition-opacity ${
        active ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className={`transition-all duration-150 ${
          active 
            ? 'text-indigo-400 scale-105' 
            : 'text-zinc-400 group-hover:text-zinc-200'
        }`}>
          {React.cloneElement(icon, { className: 'w-5 h-5 stroke-[1.75]' })}
        </div>
        {typeof badge === 'number' && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-mono font-bold flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] tracking-tight text-center w-full truncate transition-colors mt-0.5 ${
        active 
          ? 'font-semibold text-indigo-400' 
          : 'font-normal text-zinc-400 group-hover:text-zinc-300'
      }`}>
        {label}
      </span>
      {active && (
        <span className="absolute -bottom-0.5 w-4 h-0.5 bg-indigo-500 rounded-full" />
      )}
    </button>
  );
}

