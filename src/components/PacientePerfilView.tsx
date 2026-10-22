import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePaciente, getConsultasByPacienteId, getPlanosAlimentaresByPacienteId } from '../lib/db';
import { Paciente, Consulta, PlanoAlimentar, NovoPacienteInput } from '../types/dashboard';
import {
  calculateAge,
  calculateIMC,
  formatDateDisplay,
  formatPhone,
  formatTimeInput,
  OPCOES_SEXO,
  OPCOES_OBJETIVOS,
  OPCOES_NIVEL_ATIVIDADE,
  OPCOES_PATOLOGIAS,
  OPCOES_RESTRICOES,
  OPCOES_ALERGIAS,
} from '../lib/pacienteUtils';
import { GraficoEvolucaoPeso } from './GraficoEvolucaoPeso';
import { NovaConsultaModal } from './NovaConsultaModal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  User,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FileText,
  Sparkles,
  Save,
  Eye,
} from 'lucide-react';

interface PacientePerfilViewProps {
  paciente: Paciente;
  onBackToList: () => void;
  onPacienteUpdated: (updatedPaciente: Paciente) => void;
}

type MainSection = 'dados' | 'consultas' | 'planos';
type SubTab = 'pessoal' | 'clinico' | 'habitos';

export const PacientePerfilView: React.FC<PacientePerfilViewProps> = ({
  paciente,
  onBackToList,
  onPacienteUpdated,
}) => {
  const { nutricionista } = useAuth();

  // Seção principal ativa (Prompt 5: Dados do Paciente, Consultas, Planos Alimentares)
  const [activeSection, setActiveSection] = useState<MainSection>('dados');

  // Sub-aba ativa na Seção 1 (Pessoal, Clínico, Hábitos)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pessoal');

  // Estado editável dos dados do paciente
  const [formData, setFormData] = useState<NovoPacienteInput>({
    nome: paciente.nome || '',
    data_nascimento: paciente.data_nascimento
      ? typeof paciente.data_nascimento === 'string'
        ? paciente.data_nascimento.split('T')[0]
        : paciente.data_nascimento.toISOString().split('T')[0]
      : '',
    sexo: (paciente.sexo as any) || '',
    telefone: paciente.telefone || '',
    whatsapp: paciente.whatsapp || '',
    email: paciente.email || '',
    peso_inicial: paciente.peso_inicial ?? '',
    altura: paciente.altura ?? '',
    objetivos: Array.isArray(paciente.objetivos) ? [...paciente.objetivos] : [],
    objetivo_texto: paciente.objetivo_texto || '',
    nivel_atividade: paciente.nivel_atividade || '',
    patologias: Array.isArray(paciente.patologias) ? [...paciente.patologias] : [],
    restricoes_alimentares: Array.isArray(paciente.restricoes_alimentares) ? [...paciente.restricoes_alimentares] : [],
    alergias: Array.isArray(paciente.alergias) ? [...paciente.alergias] : [],
    medicamentos: paciente.medicamentos || '',
    suplementos: paciente.suplementos || '',
    refeicoes_por_dia: paciente.refeicoes_por_dia ?? '',
    horario_acorda: paciente.horario_acorda || '',
    horario_dorme: paciente.horario_dorme || '',
    litros_agua: paciente.litros_agua ?? '',
    atividade_fisica: Boolean(paciente.atividade_fisica),
    atividade_fisica_descricao: paciente.atividade_fisica_descricao || '',
    observacoes: paciente.observacoes || '',
  });

  // Campos extras livres
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // Estados de Consultas e Planos
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loadingConsultas, setLoadingConsultas] = useState(false);
  const [isModalConsultaOpen, setIsModalConsultaOpen] = useState(false);

  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);

  // Notificações e feedback
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cálculos reativos
  const idade = useMemo(() => calculateAge(formData.data_nascimento), [formData.data_nascimento]);
  const imc = useMemo(() => calculateIMC(formData.peso_inicial, formData.altura), [
    formData.peso_inicial,
    formData.altura,
  ]);

  // Carrega consultas do Neon
  const loadConsultas = async () => {
    try {
      setLoadingConsultas(true);
      const data = await getConsultasByPacienteId(paciente.id);
      setConsultas(data);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
    } finally {
      setLoadingConsultas(false);
    }
  };

  // Carrega planos alimentares do Neon
  const loadPlanos = async () => {
    try {
      setLoadingPlanos(true);
      const data = await getPlanosAlimentaresByPacienteId(paciente.id);
      setPlanos(data);
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    } finally {
      setLoadingPlanos(false);
    }
  };

  useEffect(() => {
    loadConsultas();
    loadPlanos();
  }, [paciente.id]);

  // Atualizador genérico
  const handleChange = (field: keyof NovoPacienteInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggles em arrays
  const toggleArrayItem = (
    field: 'objetivos' | 'patologias' | 'restricoes_alimentares' | 'alergias',
    item: string
  ) => {
    const current = (formData[field] as string[]) || [];
    if (current.includes(item)) {
      handleChange(
        field,
        current.filter((i) => i !== item)
      );
    } else {
      handleChange(field, [...current, item]);
    }
  };

  const toggleNenhum = (field: 'patologias' | 'restricoes_alimentares' | 'alergias') => {
    const current = (formData[field] as string[]) || [];
    if (current.includes('Nenhum')) {
      handleChange(
        field,
        current.filter((i) => i !== 'Nenhum')
      );
    } else {
      handleChange(field, ['Nenhum']);
    }
  };

  const addCustomItem = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    val: string,
    setVal: (v: string) => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const current = (formData[field] as string[]) || [];
    const filtered = current.filter((i) => i !== 'Nenhum');
    if (!filtered.includes(trimmed)) {
      handleChange(field, [...filtered, trimmed]);
    }
    setVal('');
  };

  // Salvar alterações nos dados do paciente
  const handleSaveChanges = async () => {
    if (!nutricionista?.id) return;
    if (!formData.nome.trim()) {
      setErrorMessage('O nome do paciente não pode ficar vazio.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const updated = await updatePaciente(paciente.id, nutricionista.id, formData);
      onPacienteUpdated(updated);
      setSuccessMessage('Alterações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Erro ao atualizar dados do paciente:', err);
      setErrorMessage('Falha ao salvar alterações no Neon. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Ao cadastrar nova consulta
  const handleConsultaCreated = (novaConsulta: Consulta) => {
    setConsultas((prev) => [novaConsulta, ...prev]);
    setSuccessMessage('Consulta registrada com sucesso!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Mensagens de Sucesso e Erro */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:text-rose-900 font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Top Header / Breadcrumb & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToList}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-600 hover:text-slate-900"
          >
            Voltar para lista
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-700 truncate">
            Prontuário de {formData.nome || paciente.nome}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalConsultaOpen(true)}
            leftIcon={<Calendar className="w-4 h-4" />}
            className="shadow-md shadow-emerald-600/20"
          >
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Card Header Resumo do Paciente */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              {(formData.nome || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {formData.nome || paciente.nome}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Paciente Ativo
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                {formData.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {formData.email}
                  </span>
                )}
                {formData.telefone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {formData.telefone}
                  </span>
                )}
                {formData.data_nascimento && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Nasc: {formatDateDisplay(formData.data_nascimento)}
                    {idade !== null && ` (${idade} anos)`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Consultas
              </span>
              <span className="text-lg font-extrabold text-emerald-700">
                {consultas.length}
              </span>
            </div>
            {imc && (
              <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  IMC Atual
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  {imc.imc} <span className="text-xs font-normal text-slate-400">kg/m²</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          NAVEGAÇÃO DAS 3 SEÇÕES PRINCIPAIS (Prompt 5)
          1. Dados do Paciente
          2. Consultas
          3. Planos Alimentares
         ========================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection('dados')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSection === 'dados'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Dados do Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('consultas')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSection === 'consultas'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>2. Consultas ({consultas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('planos')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSection === 'planos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Planos Alimentares ({planos.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 1 — DADOS DO PACIENTE (Editáveis diretamente na página)
         ========================================================================= */}
      {activeSection === 'dados' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-fadeIn">
          {/* Sub-abas: Pessoal, Clínico e Hábitos */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-2 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('pessoal')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeSubTab === 'pessoal'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Pessoal
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('clinico')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeSubTab === 'clinico'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Clínico
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('habitos')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeSubTab === 'habitos'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Hábitos
              </button>
            </div>

            {/* Botão Salvar Alterações */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="shadow-xs"
            >
              Salvar alterações
            </Button>
          </div>

          <div className="p-6 sm:p-8">
            {/* SUB-ABA 1: PESSOAL */}
            {activeSubTab === 'pessoal' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome Completo *"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Data de Nascimento
                      </label>
                      {idade !== null && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {idade} anos
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.data_nascimento || ''}
                      onChange={(e) => handleChange('data_nascimento', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Sexo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {OPCOES_SEXO.map((opcao) => (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => handleChange('sexo', opcao)}
                          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all text-center ${
                            formData.sexo === opcao
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Telefone"
                      placeholder="(XX) XXXXX-XXXX"
                      value={formData.telefone || ''}
                      onChange={(e) => handleChange('telefone', formatPhone(e.target.value))}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="WhatsApp"
                      placeholder="(XX) XXXXX-XXXX"
                      value={formData.whatsapp || ''}
                      onChange={(e) => handleChange('whatsapp', formatPhone(e.target.value))}
                      leftIcon={<Phone className="w-4 h-4 text-emerald-600" />}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 2: CLÍNICO */}
            {activeSubTab === 'clinico' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Medidas e IMC */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Peso Inicial / Atual
                    </label>
                    <div className="relative rounded-xl">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.peso_inicial === '' ? '' : formData.peso_inicial ?? ''}
                        onChange={(e) => handleChange('peso_inicial', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        kg
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Altura
                    </label>
                    <div className="relative rounded-xl">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.altura === '' ? '' : formData.altura ?? ''}
                        onChange={(e) => handleChange('altura', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        cm
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      IMC (Calculado automaticamente)
                    </label>
                    <div className="h-[42px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      {imc ? (
                        <>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {imc.imc} <span className="text-xs font-normal text-slate-400">kg/m²</span>
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${imc.badgeColor}`}
                          >
                            {imc.classificacao}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Informe peso e altura
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">
                    Objetivos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OPCOES_OBJETIVOS.map((obj) => {
                      const isSelected = (formData.objetivos || []).includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleArrayItem('objetivos', obj)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {obj}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1">
                    <Input
                      placeholder="Outro objetivo ou observação de meta..."
                      value={formData.objetivo_texto || ''}
                      onChange={(e) => handleChange('objetivo_texto', e.target.value)}
                    />
                  </div>
                </div>

                {/* Nível de Atividade */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">
                    Nível de Atividade Física
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {OPCOES_NIVEL_ATIVIDADE.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => handleChange('nivel_atividade', nivel)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center truncate ${
                          formData.nivel_atividade === nivel
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">
                    Patologias ou Condições de Saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleNenhum('patologias')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        (formData.patologias || []).includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {(formData.patologias || []).includes('Nenhum') ? '✓ ' : ''}
                      Nenhum
                    </button>

                    {OPCOES_PATOLOGIAS.map((pat) => {
                      const isSelected = (formData.patologias || []).includes(pat);
                      return (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => {
                            const current = (formData.patologias || []).filter((i) => i !== 'Nenhum');
                            if (isSelected) {
                              handleChange('patologias', current.filter((i) => i !== pat));
                            } else {
                              handleChange('patologias', [...current, pat]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {pat}
                        </button>
                      );
                    })}

                    {(formData.patologias || [])
                      .filter((p) => p !== 'Nenhum' && !OPCOES_PATOLOGIAS.includes(p as any))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(
                                'patologias',
                                (formData.patologias || []).filter((i) => i !== custom)
                              )
                            }
                            className="hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-1 max-w-md">
                    <Input
                      placeholder="Adicionar outra patologia..."
                      value={customPatologia}
                      onChange={(e) => setCustomPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomItem('patologias', customPatologia, setCustomPatologia);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCustomItem('patologias', customPatologia, setCustomPatologia)}
                      disabled={!customPatologia.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleNenhum('restricoes_alimentares')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        (formData.restricoes_alimentares || []).includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {(formData.restricoes_alimentares || []).includes('Nenhum') ? '✓ ' : ''}
                      Nenhum
                    </button>

                    {OPCOES_RESTRICOES.map((res) => {
                      const isSelected = (formData.restricoes_alimentares || []).includes(res);
                      return (
                        <button
                          key={res}
                          type="button"
                          onClick={() => {
                            const current = (formData.restricoes_alimentares || []).filter((i) => i !== 'Nenhum');
                            if (isSelected) {
                              handleChange('restricoes_alimentares', current.filter((i) => i !== res));
                            } else {
                              handleChange('restricoes_alimentares', [...current, res]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {res}
                        </button>
                      );
                    })}

                    {(formData.restricoes_alimentares || [])
                      .filter((r) => r !== 'Nenhum' && !OPCOES_RESTRICOES.includes(r as any))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(
                                'restricoes_alimentares',
                                (formData.restricoes_alimentares || []).filter((i) => i !== custom)
                              )
                            }
                            className="hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-1 max-w-md">
                    <Input
                      placeholder="Adicionar outra restrição..."
                      value={customRestricao}
                      onChange={(e) => setCustomRestricao(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCustomItem('restricoes_alimentares', customRestricao, setCustomRestricao)}
                      disabled={!customRestricao.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">
                    Alergias Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleNenhum('alergias')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        (formData.alergias || []).includes('Nenhum')
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {(formData.alergias || []).includes('Nenhum') ? '✓ ' : ''}
                      Nenhum
                    </button>

                    {OPCOES_ALERGIAS.map((ale) => {
                      const isSelected = (formData.alergias || []).includes(ale);
                      return (
                        <button
                          key={ale}
                          type="button"
                          onClick={() => {
                            const current = (formData.alergias || []).filter((i) => i !== 'Nenhum');
                            if (isSelected) {
                              handleChange('alergias', current.filter((i) => i !== ale));
                            } else {
                              handleChange('alergias', [...current, ale]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {ale}
                        </button>
                      );
                    })}

                    {(formData.alergias || [])
                      .filter((a) => a !== 'Nenhum' && !OPCOES_ALERGIAS.includes(a as any))
                      .map((custom) => (
                        <span
                          key={custom}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
                        >
                          {custom}
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(
                                'alergias',
                                (formData.alergias || []).filter((i) => i !== custom)
                              )
                            }
                            className="hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>

                  <div className="flex gap-2 pt-1 max-w-md">
                    <Input
                      placeholder="Adicionar outra alergia..."
                      value={customAlergia}
                      onChange={(e) => setCustomAlergia(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCustomItem('alergias', customAlergia, setCustomAlergia)}
                      disabled={!customAlergia.trim()}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Medicamentos Contínuos
                    </label>
                    <textarea
                      rows={3}
                      value={formData.medicamentos || ''}
                      onChange={(e) => handleChange('medicamentos', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Suplementos em Uso
                    </label>
                    <textarea
                      rows={3}
                      value={formData.suplementos || ''}
                      onChange={(e) => handleChange('suplementos', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-ABA 3: HÁBITOS */}
            {activeSubTab === 'habitos' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Quantas refeições faz por dia?
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.refeicoes_por_dia === '' ? '' : formData.refeicoes_por_dia ?? ''}
                      onChange={(e) => handleChange('refeicoes_por_dia', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Quantidade de água por dia
                    </label>
                    <div className="relative rounded-xl">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.litros_agua === '' ? '' : formData.litros_agua ?? ''}
                        onChange={(e) => handleChange('litros_agua', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-14 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                        litros
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Horário que acorda
                    </label>
                    <input
                      type="text"
                      value={formData.horario_acorda || ''}
                      onChange={(e) => handleChange('horario_acorda', e.target.value)}
                      onBlur={() => {
                        if (formData.horario_acorda) {
                          handleChange('horario_acorda', formatTimeInput(formData.horario_acorda));
                        }
                      }}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Horário que dorme
                    </label>
                    <input
                      type="text"
                      value={formData.horario_dorme || ''}
                      onChange={(e) => handleChange('horario_dorme', e.target.value)}
                      onBlur={() => {
                        if (formData.horario_dorme) {
                          handleChange('horario_dorme', formatTimeInput(formData.horario_dorme));
                        }
                      }}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">
                        Pratica atividade física?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange('atividade_fisica', false)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            !formData.atividade_fisica
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('atividade_fisica', true)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            formData.atividade_fisica
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Sim
                        </button>
                      </div>
                    </div>

                    {formData.atividade_fisica && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                        <label className="block text-xs font-bold text-emerald-900 mb-1">
                          Qual atividade e frequência semanal?
                        </label>
                        <input
                          type="text"
                          value={formData.atividade_fisica_descricao || ''}
                          onChange={(e) => handleChange('atividade_fisica_descricao', e.target.value)}
                          className="block w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700">
                      Observações Gerais
                    </label>
                    <textarea
                      rows={4}
                      value={formData.observacoes || ''}
                      onChange={(e) => handleChange('observacoes', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 2 — CONSULTAS (Gráfico + Lista Cronológica Decrescente)
         ========================================================================= */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Gráfico de Evolução de Peso (sempre visível) */}
          <GraficoEvolucaoPeso consultas={consultas} alturaCm={formData.altura} />

          {/* Lista de Consultas */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Histórico de Consultas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Listadas em ordem cronológica decrescente (mais recente primeiro)
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalConsultaOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-xs self-start sm:self-auto"
              >
                Nova Consulta
              </Button>
            </div>

            {loadingConsultas ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Carregando consultas...
              </div>
            ) : consultas.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  Nenhuma consulta registrada ainda
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Clique no botão "Nova Consulta" acima para registrar os dados antropométricos e retornos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {consultas.map((c, index) => (
                  <div
                    key={c.id || index}
                    className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-2xl transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          {formatDateDisplay(c.data_consulta)}
                        </span>

                        {index === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Mais recente
                          </span>
                        )}
                      </div>

                      {/* Medidas Antropométricas */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                        {c.peso && (
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Peso: {c.peso} kg
                          </span>
                        )}
                        {c.cintura && (
                          <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Cintura: {c.cintura} cm
                          </span>
                        )}
                        {c.quadril && (
                          <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Quadril: {c.quadril} cm
                          </span>
                        )}
                        {c.percentual_gordura && (
                          <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Gordura: {c.percentual_gordura}%
                          </span>
                        )}
                      </div>

                      {c.observacoes && (
                        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60 max-w-xl">
                          "{c.observacoes}"
                        </p>
                      )}
                    </div>

                    <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        Próximo Retorno
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          c.proximo_retorno ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {c.proximo_retorno ? formatDateDisplay(c.proximo_retorno) : 'Não agendado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 3 — PLANOS ALIMENTARES
         ========================================================================= */}
      {activeSection === 'planos' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Planos Alimentares do Paciente
                </h3>
                <p className="text-xs text-slate-500">
                  Dietas personalizadas, cardápios e prescrições nutricionais
                </p>
              </div>
            </div>

            {/* Botão Gerar Plano Alimentar (visível conforme Prompt 5) */}
            <div className="relative group">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />}
                className="shadow-md shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                onClick={() => {
                  alert('O gerador inteligente de planos alimentares será ativado no Prompt 6!');
                }}
              >
                Gerar Plano Alimentar
              </Button>
            </div>
          </div>

          {/* Histórico de Planos Salvos */}
          {loadingPlanos ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Carregando planos alimentares...
            </div>
          ) : planos.length === 0 ? (
            /* Regra: "Se não houver planos salvos ainda, exibir a mensagem 'Nenhum plano alimentar gerado ainda'" */
            <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Nenhum plano alimentar gerado ainda
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Os planos nutricionais gerados para este paciente aparecerão listados aqui em ordem cronológica decrescente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  onClick={() => setSelectedPlano(plano)}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all shadow-xs space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Plano Alimentar
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateDisplay(plano.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3">
                    {typeof plano.conteudo === 'string'
                      ? plano.conteudo
                      : JSON.stringify(plano.conteudo, null, 2)}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                    <span>Ver detalhes completos</span>
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal para Visualização de Plano Salvo */}
          {selectedPlano && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                onClick={() => setSelectedPlano(null)}
              />
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full z-10 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Plano Alimentar de {formData.nome}
                  </h3>
                  <button
                    onClick={() => setSelectedPlano(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Gerado em: {formatDateDisplay(selectedPlano.created_at)}
                </div>
                <pre className="p-4 rounded-2xl bg-slate-50 text-slate-800 text-xs font-mono whitespace-pre-wrap overflow-x-auto border border-slate-200/80">
                  {typeof selectedPlano.conteudo === 'string'
                    ? selectedPlano.conteudo
                    : JSON.stringify(selectedPlano.conteudo, null, 2)}
                </pre>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedPlano(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Nova Consulta */}
      <NovaConsultaModal
        pacienteId={paciente.id}
        pacienteNome={formData.nome || paciente.nome}
        isOpen={isModalConsultaOpen}
        onClose={() => setIsModalConsultaOpen(false)}
        onConsultaCreated={handleConsultaCreated}
      />
    </div>
  );
};
