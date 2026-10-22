import React from 'react';
import { Sidebar, NavItem } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';


interface DashboardLayoutProps {
  children: React.ReactNode;
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentNav,
  onNavigate,
  title,
  subtitle,
}) => {
  const { nutricionista, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar fixo à esquerda */}
      <Sidebar currentNav={currentNav} onNavigate={onNavigate} />

      {/* Área principal com margem à esquerda para o sidebar em telas grandes */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pt-16 lg:pt-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {title || 'Painel de Controle'}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs px-3 py-1.5 rounded-full font-medium shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Neon DB Conectado</span>
              </div>

              <div className="h-6 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {nutricionista?.nome || user?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                    Nutricionista Responsável
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs border border-emerald-200">
                  {(nutricionista?.nome || user?.name || 'N').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo dinâmico da página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
};
