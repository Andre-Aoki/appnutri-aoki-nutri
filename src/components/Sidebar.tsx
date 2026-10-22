import React, { useState } from 'react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export type NavItem = 'dashboard' | 'pacientes';

interface SidebarProps {
  currentNav: NavItem;
  onNavigate: (nav: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentNav, onNavigate }) => {
  const { user, nutricionista, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard' as NavItem,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral e métricas',
    },
    {
      id: 'pacientes' as NavItem,
      label: 'Pacientes',
      icon: Users,
      description: 'Gestão de prontuários',
    },
  ];

  const handleSelect = (id: NavItem) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between z-40 shadow-xs">
        <Logo size="sm" showSubtitle={false} />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menu lateral"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo "Aoki Nutri" */}
        <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
          <Logo size="sm" showSubtitle={true} />
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Menu Principal
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-emerald-200 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: Nutricionista Profile + Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {(nutricionista?.nome || user?.name || 'N').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {nutricionista?.nome || user?.name || 'Nutricionista'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                <span className="truncate">CRN Verificado</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};
