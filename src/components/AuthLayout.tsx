import React from 'react';
import { Logo } from './Logo';
import { Sparkles, ShieldCheck, Users, CalendarCheck, Utensils } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 relative overflow-hidden">
      {/* Decorative ambient background elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-green-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-10 relative z-10 max-w-xl mx-auto lg:max-w-none lg:w-1/2">
        <div className="w-full max-w-md mx-auto">
          {/* Logo on top of both screens */}
          <div className="mb-8 flex justify-center sm:justify-start">
            <Logo size="md" />
          </div>

          {/* Card Container */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6 text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Aoki Nutri. Plataforma segura com Neon Auth & PostgreSQL.
          </div>
        </div>
      </div>

      {/* Visual Right Showcase (Desktop only) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 p-12 flex-col justify-between text-white overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        {/* Glow effect */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />

        {/* Top badge */}
        <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full w-fit">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span className="text-xs font-medium text-emerald-100">Solução Especializada para Nutricionistas</span>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            Eleve o nível do seu atendimento nutricional.
          </h2>
          <p className="text-emerald-100/80 text-base leading-relaxed">
            Tenha prontuários digitais, planos alimentares personalizados, cálculos antropométricos e acompanhamento completo de pacientes em uma única plataforma moderna e rápida.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-3.5 pt-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-200/70">Gestão</div>
                <div className="text-sm font-semibold">Pacientes Ilimitados</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-200/70">Cardápios</div>
                <div className="text-sm font-semibold">Planos em Minutos</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-200/70">Consultas</div>
                <div className="text-sm font-semibold">Histórico e Evolução</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-200/70">Segurança</div>
                <div className="text-sm font-semibold">Neon Auth & RLS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom review quote */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/70">
          <span>Acesso rápido e criptografado de ponta a ponta</span>
          <span className="font-semibold text-white">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
