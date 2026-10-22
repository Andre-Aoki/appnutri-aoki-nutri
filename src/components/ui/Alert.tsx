import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'error',
  title,
  message,
  onClose,
  className,
}) => {
  const styles = {
    error: {
      container: 'bg-rose-50/90 border-rose-200/80 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    info: {
      container: 'bg-sky-50/90 border-sky-200/80 text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border text-sm backdrop-blur-sm shadow-sm animate-fadeIn',
        current.container,
        className
      )}
      role="alert"
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 leading-tight">{title}</h5>}
        <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-lg"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
