import React, { useState } from 'react';
import { createConsulta } from '../lib/db';
import { Consulta, NovaConsultaInput } from '../types/dashboard';
import { Button } from './ui/Button';
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface NovaConsultaModalProps {
  pacienteId: string;
  pacienteNome: string;
  isOpen: boolean;
  onClose: () => void;
  onConsultaCreated: (novaConsulta: Consulta) => void;
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  pacienteId,
  pacienteNome,
  isOpen,
  onClose,
  onConsultaCreated,
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<NovaConsultaInput>({
    paciente_id: pacienteId,
    data_consulta: hoje,
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof NovaConsultaInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data_consulta) {
      setError('Por favor, informe a data da consulta.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const created = await createConsulta({
        ...formData,
        paciente_id: pacienteId,
      });
      onConsultaCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar consulta:', err);
      setError('Falha ao registrar consulta no banco Neon. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full z-10 overflow-hidden animate-fadeIn">
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nova Consulta
              </h3>
              <p className="text-xs text-slate-500">
                Paciente: <strong className="text-slate-700">{pacienteNome}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Data da Consulta (Preenchida com hoje, editável) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Data da Consulta *
              </label>
              <input
                type="date"
                required
                value={formData.data_consulta}
                onChange={(e) => handleChange('data_consulta', e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            {/* Peso Atual em kg */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Peso Atual
              </label>
              <div className="relative rounded-xl">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 68.5"
                  value={formData.peso === '' ? '' : formData.peso ?? ''}
                  onChange={(e) => handleChange('peso', e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  kg
                </div>
              </div>
            </div>

            {/* Cintura (opcional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Cintura (Opcional)
              </label>
              <div className="relative rounded-xl">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 82"
                  value={formData.cintura === '' ? '' : formData.cintura ?? ''}
                  onChange={(e) => handleChange('cintura', e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  cm
                </div>
              </div>
            </div>

            {/* Quadril (opcional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Quadril (Opcional)
              </label>
              <div className="relative rounded-xl">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 98"
                  value={formData.quadril === '' ? '' : formData.quadril ?? ''}
                  onChange={(e) => handleChange('quadril', e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  cm
                </div>
              </div>
            </div>

            {/* % de Gordura (opcional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                % Gordura (Opcional)
              </label>
              <div className="relative rounded-xl">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 21.5"
                  value={formData.percentual_gordura === '' ? '' : formData.percentual_gordura ?? ''}
                  onChange={(e) => handleChange('percentual_gordura', e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  %
                </div>
              </div>
            </div>

            {/* Próximo Retorno */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Próximo Retorno (Opcional)
              </label>
              <input
                type="date"
                value={formData.proximo_retorno || ''}
                onChange={(e) => handleChange('proximo_retorno', e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Observações Clínicas
            </label>
            <textarea
              rows={3}
              placeholder="Evolução do paciente, adesão à dieta, sintomas relatados..."
              value={formData.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="shadow-md shadow-emerald-600/20"
            >
              Salvar consulta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
