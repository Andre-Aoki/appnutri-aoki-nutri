import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPaciente } from '../lib/db';
import { NovoPacienteInput, Paciente } from '../types/dashboard';
import {
  calculateAge,
  calculateIMC,
  formatPhone,
  formatTimeInput,
  OPCOES_SEXO,
  OPCOES_OBJETIVOS,
  OPCOES_NIVEL_ATIVIDADE,
  OPCOES_PATOLOGIAS,
  OPCOES_RESTRICOES,
  OPCOES_ALERGIAS,
} from '../lib/pacienteUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  User,
  Activity,
  HeartPulse,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Copy,
} from 'lucide-react';

interface NovoPacienteFormProps {
  onSuccess: (novoPaciente: Paciente) => void;
  onCancel: () => void;
}

type TabType = 'pessoal' | 'clinico' | 'habitos';

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { nutricionista } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState<NovoPacienteInput>({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
    data_inicio_tratamento: new Date().toISOString().split('T')[0],
  });

  // Campos para adição livre de patologia, restrição e alergia
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // Erros de validação
  const [nameError, setNameError] = useState('');

  // Cálculo da idade
  const idadeCalculada = useMemo(() => {
    return calculateAge(formData.data_nascimento);
  }, [formData.data_nascimento]);

  // Cálculo do IMC
  const imcCalculado = useMemo(() => {
    const pesoNum = formData.peso_inicial ? Number(formData.peso_inicial) : null;
    const alturaNum = formData.altura ? Number(formData.altura) : null;
    return calculateIMC(pesoNum, alturaNum);
  }, [formData.peso_inicial, formData.altura]);

  // Atualizador genérico
  const handleChange = (field: keyof NovoPacienteInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'nome' && value.trim()) {
      setNameError('');
    }
  };

  // Telefone / WhatsApp com máscara
  const handlePhoneChange = (field: 'telefone' | 'whatsapp', val: string) => {
    handleChange(field, formatPhone(val));
  };

  // Copiar telefone para whatsapp
  const handleCopyPhoneToWhatsapp = () => {
    if (formData.telefone) {
      handleChange('whatsapp', formData.telefone);
    }
  };

  // Conversão de horário ao desfocar do input
  const handleTimeBlur = (field: 'horario_acorda' | 'horario_dorme') => {
    const raw = formData[field] || '';
    if (raw) {
      const formatted = formatTimeInput(raw);
      handleChange(field, formatted);
    }
  };

  // Toggle em listas de múltipla escolha
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

  // Toggle da opção especial "Nenhum"
  const toggleNenhum = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias'
  ) => {
    const current = (formData[field] as string[]) || [];
    if (current.includes('Nenhum')) {
      handleChange(
        field,
        current.filter((i) => i !== 'Nenhum')
      );
    } else {
      // Se marcou "Nenhum", limpa as outras seleções
      handleChange(field, ['Nenhum']);
    }
  };

  // Adicionar item livre à lista
  const addCustomItem = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    val: string,
    setVal: (v: string) => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const current = (formData[field] as string[]) || [];
    // Remove "Nenhum" se estava selecionado
    const filtered = current.filter((i) => i !== 'Nenhum');
    if (!filtered.includes(trimmed)) {
      handleChange(field, [...filtered, trimmed]);
    }
    setVal('');
  };

  // Validação e Submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nutricionista?.id) {
      setError('Sessão expirada. Por favor, recarregue a página.');
      return;
    }

    if (!formData.nome.trim()) {
      setNameError('O nome completo é obrigatório');
      setActiveTab('pessoal');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const novo = await createPaciente(nutricionista.id, formData);
      onSuccess(novo);
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err);
      setError('Erro ao salvar no banco Neon. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-slate-600 hover:text-slate-900"
          >
            Voltar
          </Button>
          <span className="text-slate-300">/</span>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Novo Paciente
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Preencha os dados cadastrais, clínicos e hábitos para criar o prontuário.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit()}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Cadastrar Paciente
          </Button>
        </div>
      </div>

      {/* Erro Geral */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Card Principal com Abas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navegação entre as 3 Abas */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-2 sm:p-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pessoal')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'pessoal'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <User
                className={`w-4 h-4 ${
                  activeTab === 'pessoal' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>1. Pessoal</span>
              {formData.nome.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 hidden sm:inline-block" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clinico')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'clinico'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <HeartPulse
                className={`w-4 h-4 ${
                  activeTab === 'clinico' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>2. Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('habitos')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'habitos'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Activity
                className={`w-4 h-4 ${
                  activeTab === 'habitos' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>3. Hábitos</span>
            </button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          {/* =========================================================================
              ABA 1: DADOS PESSOAIS
             ========================================================================= */}
          {activeTab === 'pessoal' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Identificação do Paciente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados básicos e contatos. Apenas o nome completo é obrigatório.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome Completo (Obrigatório) */}
                <div className="md:col-span-2">
                  <Input
                    label="Nome Completo *"
                    placeholder="Ex: Maria Clara Souza"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    error={nameError}
                    required
                    leftIcon={<User className="w-4 h-4" />}
                    autoFocus
                  />
                </div>

                {/* Data de Nascimento com Idade Automática */}
                <div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700">
                        Data de Nascimento
                      </label>
                      {idadeCalculada !== null && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.data_nascimento || ''}
                        onChange={(e) => handleChange('data_nascimento', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      O sistema calcula a idade automaticamente.
                    </p>
                  </div>
                </div>

                {/* Data de Início do Tratamento (Prompt 5) */}
                <div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Data de Início do Tratamento
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.data_inicio_tratamento || ''}
                        onChange={(e) => handleChange('data_inicio_tratamento', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ficará registrada como a 1ª consulta do paciente.
                    </p>
                  </div>
                </div>

                {/* Sexo (Seleção Única) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Sexo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {OPCOES_SEXO.map((opcao) => {
                      const isSelected = formData.sexo === opcao;
                      return (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => handleChange('sexo', opcao)}
                          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all text-center ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opcao}
                        </button>
                      );
                    })}
                  </div>
                </div>

                

                {/* Tel / WhatsApp */}
                <div>
                  <Input
                    label="Tel / WhatsApp"
                    placeholder="(XX) XXXXX-XXXX"
                    value={formData.whatsapp || ''}
                    onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
                    leftIcon={<Phone className="w-4 h-4 text-emerald-600" />}
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Botão para Próxima Aba */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (!formData.nome.trim()) {
                      setNameError('O nome completo é obrigatório');
                      return;
                    }
                    setActiveTab('clinico');
                  }}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Avançar para Clínico
                </Button>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 2: DADOS CLÍNICOS
             ========================================================================= */}
          {activeTab === 'clinico' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-emerald-600" />
                  Perfil Antropométrico e Clínico
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Insira as medidas, objetivos nutricionais, patologias e intolerâncias.
                </p>
              </div>

              {/* Medidas Físicas e IMC Calculado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Peso atual */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Peso Atual
                  </label>
                  <div className="relative rounded-xl">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="70.5"
                      value={formData.peso_inicial === '' ? '' : formData.peso_inicial}
                      onChange={(e) => handleChange('peso_inicial', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                      kg
                    </div>
                  </div>
                </div>

                {/* Altura em cm */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Altura
                  </label>
                  <div className="relative rounded-xl">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="175"
                      value={formData.altura === '' ? '' : formData.altura}
                      onChange={(e) => handleChange('altura', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                      cm
                    </div>
                  </div>
                </div>

                {/* IMC Calculado (Somente Leitura) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    IMC (Calculado automaticamente)
                  </label>
                  <div className="h-[42px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    {imcCalculado ? (
                      <>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {imcCalculado.imc} <span className="text-xs font-normal text-slate-400">kg/m²</span>
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${imcCalculado.badgeColor}`}
                        >
                          {imcCalculado.classificacao}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Informe peso e altura para calcular
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Objetivos (Múltipla Escolha + Campo Livre) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Objetivo Principal e Secundários
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
                    placeholder="Outro objetivo ou observação adicional de meta..."
                    value={formData.objetivo_texto || ''}
                    onChange={(e) => handleChange('objetivo_texto', e.target.value)}
                  />
                </div>
              </div>

              {/* Nível de Atividade Física (Seleção Única) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Nível de Atividade Física
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {OPCOES_NIVEL_ATIVIDADE.map((nivel) => {
                    const isSelected = formData.nivel_atividade === nivel;
                    return (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => handleChange('nivel_atividade', nivel)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center truncate ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={nivel}
                      >
                        {nivel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patologias ou Condições de Saúde (Múltipla Escolha + Nenhum + Campo Livre) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700">
                  Patologias ou Condições de Saúde
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* Opção Nenhum */}
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
                          // Se clicar em alguma, tira o 'Nenhum'
                          const current = (formData.patologias || []).filter((i) => i !== 'Nenhum');
                          if (isSelected) {
                            handleChange(
                              'patologias',
                              current.filter((i) => i !== pat)
                            );
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

                  {/* Tags adicionadas livremente que não estão na lista padrão */}
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

                {/* Input para adicionar patologia livre */}
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

              {/* Restrições Alimentares (Múltipla Escolha + Nenhum + Campo Livre) */}
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
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
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
                            handleChange(
                              'restricoes_alimentares',
                              current.filter((i) => i !== res)
                            );
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('restricoes_alimentares', customRestricao, setCustomRestricao);
                      }
                    }}
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

              {/* Alergias Alimentares (Múltipla Escolha + Nenhum + Campo Livre) */}
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
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
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
                            handleChange(
                              'alergias',
                              current.filter((i) => i !== ale)
                            );
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('alergias', customAlergia, setCustomAlergia);
                      }
                    }}
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

              {/* Medicamentos e Suplementos (Texto Livre) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Medicamentos Contínuos
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Losartana 50mg pela manhã, Levotiroxina 75mcg em jejum..."
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
                    placeholder="Ex: Creatina 5g diárias, Whey protein pós-treino, Ômega 3..."
                    value={formData.suplementos || ''}
                    onChange={(e) => handleChange('suplementos', e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y"
                  />
                </div>
              </div>

              {/* Navegação */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('pessoal')}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Voltar para Pessoal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setActiveTab('habitos')}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Avançar para Hábitos
                </Button>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 3: HÁBITOS E ROTINA
             ========================================================================= */}
          {activeTab === 'habitos' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Hábitos Diários e Rotina
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mapeamento de rotina alimentar, sono, hidratação e atividades físicas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Refeições por Dia */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quantas refeições faz por dia?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Ex: 4"
                    value={formData.refeicoes_por_dia === '' ? '' : formData.refeicoes_por_dia}
                    onChange={(e) => handleChange('refeicoes_por_dia', e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Quantidade de Água por Dia (sistema exibe "litros" automaticamente) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quantidade de água por dia
                  </label>
                  <div className="relative rounded-xl">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 2.5"
                      value={formData.litros_agua === '' ? '' : formData.litros_agua}
                      onChange={(e) => handleChange('litros_agua', e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-14 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                      litros
                    </div>
                  </div>
                </div>

                {/* Horário que Acorda (conversão automática ex: 6 -> 06:00, 630 -> 06:30) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Horário que acorda
                  </label>
                  <div className="relative rounded-xl">
                    <input
                      type="text"
                      placeholder="Ex: 6 ou 630"
                      value={formData.horario_acorda || ''}
                      onChange={(e) => handleChange('horario_acorda', e.target.value)}
                      onBlur={() => handleTimeBlur('horario_acorda')}
                      className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digite o número que o sistema converte (ex: 6 → 06:00, 630 → 06:30)
                  </p>
                </div>

                {/* Horário que Dorme (conversão automática ex: 23 -> 23:00, 2230 -> 22:30) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Horário que dorme
                  </label>
                  <div className="relative rounded-xl">
                    <input
                      type="text"
                      placeholder="Ex: 23 ou 2230"
                      value={formData.horario_dorme || ''}
                      onChange={(e) => handleChange('horario_dorme', e.target.value)}
                      onBlur={() => handleTimeBlur('horario_dorme')}
                      className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digite o número que o sistema converte (ex: 23 → 23:00, 2230 → 22:30)
                  </p>
                </div>

                {/* Pratica Atividade Física (Sim / Não) */}
                <div className="md:col-span-2 space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="block text-sm font-medium text-slate-800">
                        Pratica atividade física?
                      </span>
                      <p className="text-xs text-slate-400">
                        Musculação, corrida, natação, caminhada, etc.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange('atividade_fisica', false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          !formData.atividade_fisica
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('atividade_fisica', true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.atividade_fisica
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </div>

                  {/* Campo condicional se pratica atividade física */}
                  {formData.atividade_fisica && (
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 animate-fadeIn space-y-1.5">
                      <label className="block text-xs font-bold text-emerald-900">
                        Qual atividade e frequência semanal?
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Musculação 4x na semana, Corrida aos sábados 5km"
                        value={formData.atividade_fisica_descricao || ''}
                        onChange={(e) => handleChange('atividade_fisica_descricao', e.target.value)}
                        className="block w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais (Texto Livre) */}
                <div className="md:col-span-2 space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">
                    Observações Gerais
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Anotações gerais sobre o paciente, histórico de dietas anteriores, preferências, etc."
                    value={formData.observacoes || ''}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y"
                  />
                </div>
              </div>

              {/* Botões Finais de Ação */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('clinico')}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Voltar para Clínico
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="flex-1 sm:flex-initial shadow-md shadow-emerald-600/20"
                  >
                    Salvar e Ver Perfil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
