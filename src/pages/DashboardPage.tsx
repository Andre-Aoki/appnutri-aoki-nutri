import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../lib/db';
import { DashboardStats, PacienteSemRetorno } from '../types/dashboard';
import { DashboardLayout } from '../components/DashboardLayout';
import { PacientesView } from '../components/PacientesView';
import { NavItem } from '../components/Sidebar';
import { Button } from '../components/ui/Button';
import {
  Users,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Phone,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { nutricionista, user } = useAuth();
  const [currentNav, setCurrentNav] = useState<NavItem>('dashboard');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Carrega estatísticas em tempo real do Neon
  const fetchDashboardData = useCallback(async () => {
    if (!nutricionista?.id) return;
    try {
      setError(null);
      const data = await getDashboardStats(nutricionista.id);
      setStats(data);
    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError('Não foi possível carregar os dados em tempo real do Neon.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [nutricionista?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
  };

  // Redireciona para o perfil do paciente ao clicar no nome
  const handleOpenPaciente = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setCurrentNav('pacientes');
  };

  // Se a aba selecionada for "pacientes", renderiza o gerenciador de pacientes
  if (currentNav === 'pacientes') {
    return (
      <DashboardLayout
        currentNav={currentNav}
        onNavigate={setCurrentNav}
        title="Gestão de Pacientes"
        subtitle="Consulte e gerencie prontuários, planos e históricos"
      >
        <PacientesView
          onBackToDashboard={() => {
            setCurrentNav('dashboard');
            setSelectedPacienteId(null);
          }}
          selectedPacienteId={selectedPacienteId}
          onClearSelectedPaciente={() => setSelectedPacienteId(null)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentNav={currentNav}
      onNavigate={setCurrentNav}
      title="Dashboard Principal"
      subtitle={`Bem-vinda, Dra. ${nutricionista?.nome || user?.name || ''}`}
    >
      <div className="space-y-8">
        {/* Banner de Boas-vindas com Estética Moderna */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-950/10">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Dados em tempo real &bull; Neon PostgreSQL</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Olá, {nutricionista?.nome || user?.name}! 👋
              </h2>
              <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-xl">
                Acompanhe os principais indicadores da sua clínica nutricional, seus pacientes ativos e mantenha os retornos em dia.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs shadow-xs"
              >
                Atualizar Dados
              </Button>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro, se houver */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs font-bold underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* =========================================================================
            CARDS DE INFORMAÇÃO PRINCIPAIS (Prompt 3)
            - Card 1: Total de pacientes ativos (da nutricionista logada)
            - Card 2: Consultas da semana (da nutricionista logada)
            - Card 3: Pacientes sem retorno (> 30 dias sem consulta e sem retorno agendado)
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1 — Total de pacientes ativos */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Total de Pacientes
                </span>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? '...' : stats.totalPacientes}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Ativos
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Pacientes cadastrados sob a sua responsabilidade clínica.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentNav('pacientes')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors group-hover:translate-x-0.5"
              >
                <span>Ver todos os pacientes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 2 — Consultas da semana */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Consultas da Semana
                </span>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? '...' : stats.consultasSemana}
                  </span>
                  <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    Semana atual
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Consultas registradas de segunda a domingo nesta semana.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Agenda atualizada em tempo real
              </span>
            </div>
          </div>

          {/* CARD 3 (Resumo) — Pacientes sem retorno */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pacientes sem Retorno
                </span>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? '...' : stats.pacientesSemRetorno.length}
                  </span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                    &gt; 30 dias
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Sem consulta recente (&gt;30d) e sem data de retorno agendada.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Atenção ao acompanhamento
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD 3 — Lista Detalhada de Pacientes sem retorno (com nomes clicáveis)
           ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Lista de Pacientes sem Retorno
                </h3>
                <p className="text-xs text-slate-500">
                  Pacientes cuja última consulta ocorreu há mais de 30 dias e não possuem retorno agendado.
                </p>
              </div>
            </div>

            {stats.pacientesSemRetorno.length > 0 && (
              <span className="text-xs font-semibold bg-amber-100/70 text-amber-800 px-3 py-1 rounded-full border border-amber-200/60 self-start sm:self-auto">
                {stats.pacientesSemRetorno.length} paciente{stats.pacientesSemRetorno.length > 1 ? 's' : ''} necessitando contato
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Buscando pacientes no Neon...</p>
            </div>
          ) : stats.pacientesSemRetorno.length === 0 ? (
            /* Regra: "Se não houver pacientes sem retorno, exibir a mensagem 'Nenhum paciente sem retorno no momento'" */
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Nenhum paciente sem retorno no momento
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Todos os seus pacientes estão com consultas em dia ou já possuem retorno agendado. Parabéns pela gestão!
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.pacientesSemRetorno.map((item: PacienteSemRetorno) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenPaciente(item.id)}
                  className="p-5 sm:px-6 flex items-center justify-between hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
                      {item.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {/* Cada nome da lista deve ser clicável e redirecionar para o perfil do paciente */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPaciente(item.id);
                        }}
                        className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-left truncate block hover:underline"
                      >
                        {item.nome}
                      </button>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="text-amber-700 font-medium">
                          Última consulta: {new Date(item.ultima_consulta).toLocaleDateString('pt-BR')} ({item.dias_sem_consulta} dias atrás)
                        </span>
                        {item.telefone && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                            &bull; <Phone className="w-3 h-3" /> {item.telefone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                      Ver Perfil
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
