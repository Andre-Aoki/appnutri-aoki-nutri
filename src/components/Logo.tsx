import React from 'react';
import { cn } from '../lib/utils';
import { Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className,
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-10 h-10 p-2.5',
    lg: 'w-12 h-12 p-3',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div className={cn(
        'rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center transition-transform duration-300 hover:scale-105',
        iconSizes[size]
      )}>
        <Leaf className="w-full h-full fill-white/20 stroke-[2.2]" />
      </div>

      <div className="flex flex-col">
        <div className={cn('font-bold tracking-tight text-slate-900 flex items-center gap-1.5', textSizes[size])}>
          <span>Aoki</span>
          <span className="text-emerald-600 font-extrabold">Nutri</span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            Gestão Nutricional
          </span>
        )}
      </div>
    </div>
  );
};
