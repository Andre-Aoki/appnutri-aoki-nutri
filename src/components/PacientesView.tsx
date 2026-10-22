import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sql, getPacientesWithLastConsulta } from '../lib/db';
import { Paciente } from '../types/dashboard';
import { NovoPacienteForm } from './NovoPacienteForm';
import { PacientePerfilView } from './PacientePerfilView';
import { formatDateDisplay } from '../lib/pacienteUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  Users,
  Search,
  Loader2,
  ChevronRight,
  UserPlus,
  Sparkles,
} from 'lucide-react';

interface PacientesViewProps {
  onBackToDashboard: () => void;
  selectedPacienteId?: string | null;
  onClearSelectedPaciente?: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  onBackToDashboard,
  selectedPacienteId,
  onClearSelectedPaciente,
}) => {
  const { nutricionista } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modos de visualização: listagem, formulário de cadastro ou perfil do paciente
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'profile'>('list');
  const [activePaciente, setActivePaciente] = useState<Paciente | null>(null);

  // Carrega lista de pacientes com a data da última consulta
  const loadPacientes = async () => {
    if (!nutricionista?.id) return;
    try {
      setLoading(true);
      const rows = await getPacientesWithLastConsulta(nutricionista.id);
      setPacientes(rows as Paciente[]);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [nutricionista?.id]);

  // Se um paciente foi clicado no dashboard, abre direto o perfil dele
  useEffect(() => {
    async function loadSpecificPaciente(id: string) {
      if (!nutricionista?.id) return;
      try {
        const pRows = await sql`
          SELECT * FROM pacientes 
          WHERE id = ${id} AND nutricionista_id = ${nutricionista.id}
          LIMIT 1;
        `;
        if (pRows && pRows.length > 0) {
          setActivePaciente(pRows[0] as Paciente);
          setViewMode('profile');
        }
      } catch (err) {
        console.error('Erro ao carregar perfil do paciente:', err);
      }
    }

    if (selectedPacienteId) {
      loadSpecificPaciente(selectedPacienteId);
    }
  }, [selectedPacienteId, nutricionista?.id]);

  // Seleciona paciente para ver perfil
  const handleSelectPaciente = (paciente: Paciente) => {
    setActivePaciente(paciente);
    setViewMode('profile');
  };

  // Callback de sucesso ao cadastrar novo paciente
  const handlePacienteCreated = (novoPaciente: Paciente) => {
    setActivePaciente(novoPaciente);
    setViewMode('profile');
    loadPacientes();
  };

  const handleBackToList = () => {
    setActivePaciente(null);
    setViewMode('list');
    if (onClearSelectedPaciente) onClearSelectedPaciente();
  };

  // Filtro de busca por nome (Prompt 4: "Campo de busca por nome no topo da listagem")
  const filteredPacientes = pacientes.filter((p) =>
    (p.nome || '').toLowerCase().includes(search.toLowerCase())
  );

  // =========================================================================
  // MODO 1: FORMULÁRIO DE CADASTRO
  // =========================================================================
  if (viewMode === 'create') {
    return (
      <NovoPacienteForm
        onSuccess={handlePacienteCreated}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  // =========================================================================
  // MODO 2: PERFIL DO PACIENTE (Prompt 5: 3 Seções completas)
  // =========================================================================
  if (viewMode === 'profile' && activePaciente) {
    return (
      <PacientePerfilView
        paciente={activePaciente}
        onBackToList={handleBackToList}
        onPacienteUpdated={(updated) => {
          setActivePaciente(updated);
          loadPacientes();
        }}
      />
    );
  }

  // =========================================================================
  // MODO 3: TELA DE LISTAGEM DE PACIENTES (Prompt 4)
  // - Exibir todos os pacientes cadastrados pela nutricionista logada
  // - Cada paciente exibe: nome, objetivo e data da última consulta
  // - Campo de busca por nome no topo da listagem
  // - Botão "Novo Paciente" que redireciona para o formulário de cadastro
  // - Cada paciente da lista deve ser clicável e redirecionar para o perfil
  // - Se não houver pacientes cadastrados: "Nenhum paciente cadastrado ainda"
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header com Busca por Nome e Botão Novo Paciente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pacientes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie os prontuários, planos e históricos clínicos de seus pacientes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Campo de Busca por Nome no Topo da Listagem */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Buscar paciente por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Botão Novo Paciente que Redireciona para o Formulário de Cadastro */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setViewMode('create')}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-md shadow-emerald-600/20 whitespace-nowrap"
          >
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Conteúdo da Listagem */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Carregando pacientes do Neon...</p>
        </div>
      ) : pacientes.length === 0 ? (
        /* Regra: Se não houver pacientes cadastrados, exibir a mensagem "Nenhum paciente cadastrado ainda" */
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs px-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Nenhum paciente cadastrado ainda
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Cadastre seu primeiro paciente para registrar medidas, objetivos, hábitos e começar os atendimentos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setViewMode('create')}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="shadow-md shadow-emerald-600/20"
            >
              Cadastrar Primeiro Paciente
            </Button>
            <Button variant="outline" size="md" onClick={onBackToDashboard}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Busca vazia */
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs px-6">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Nenhum paciente encontrado com o nome "{search}"
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Tente pesquisar com outro termo ou limpe o campo de busca.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>
              Limpar Busca
            </Button>
            <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* Lista de Pacientes Cadastrados */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredPacientes.map((paciente) => {
              // Formatação de objetivo
              const objetivosList = Array.isArray(paciente.objetivos) ? paciente.objetivos : [];
              const objetivoExibido =
                objetivosList.length > 0
                  ? objetivosList.join(', ')
                  : paciente.objetivo_texto || 'Objetivo não informado';

              // Formatação de data da última consulta
              const dataUltimaConsulta = paciente.ultima_consulta
                ? formatDateDisplay(paciente.ultima_consulta)
                : 'Nenhuma consulta realizada';

              return (
                <div
                  key={paciente.id}
                  onClick={() => handleSelectPaciente(paciente)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Nome e Avatar */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {paciente.nome}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1">
                        {/* Objetivo em destaque */}
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-xs">
                          <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{objetivoExibido}</span>
                        </span>

                        {paciente.telefone && (
                          <span className="hidden sm:inline-block">
                            &bull; {paciente.telefone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Data da Última Consulta e Ação */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Última Consulta
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          paciente.ultima_consulta ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {dataUltimaConsulta}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                        Ver Perfil
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
