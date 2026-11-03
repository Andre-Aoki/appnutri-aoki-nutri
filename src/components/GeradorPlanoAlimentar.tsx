import React, { useState } from 'react';
import { 
  DiaPlanoAlimentar, 
  PlanoAlimentarConteudo, 
  RefeicoesDia 
} from '../types/dashboard';
import { Button } from './ui/Button';
import { 
  Sparkles, 
  Save, 
  X, 
  Coffee, 
  Apple, 
  UtensilsCrossed, 
  Cookie, 
  Moon, 
  CheckCircle2, 
  Edit3
} from 'lucide-react';

interface GeradorPlanoAlimentarProps {
  planoInicial: PlanoAlimentarConteudo;
  onSalvar: (planoAtualizado: PlanoAlimentarConteudo) => Promise<void>;
  onCancelar: () => void;
  salvando: boolean;
  pacienteNome: string;
}

const REFEICOES_CONFIG: {
  key: keyof RefeicoesDia;
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
  corBg: string;
  corTexto: string;
}[] = [
  {
    key: 'cafe_da_manha',
    titulo: 'Café da manhã',
    icone: Coffee,
    corBg: 'bg-amber-50 text-amber-600 border-amber-200',
    corTexto: 'text-amber-800'
  },
  {
    key: 'lanche_manha',
    titulo: 'Lanche da manhã',
    icone: Apple,
    corBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    corTexto: 'text-emerald-800'
  },
  {
    key: 'almoco',
    titulo: 'Almoço',
    icone: UtensilsCrossed,
    corBg: 'bg-blue-50 text-blue-600 border-blue-200',
    corTexto: 'text-blue-800'
  },
  {
    key: 'lanche_tarde',
    titulo: 'Lanche da tarde',
    icone: Cookie,
    corBg: 'bg-purple-50 text-purple-600 border-purple-200',
    corTexto: 'text-purple-800'
  },
  {
    key: 'jantar',
    titulo: 'Jantar',
    icone: Moon,
    corBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    corTexto: 'text-indigo-800'
  }
];

export const GeradorPlanoAlimentar: React.FC<GeradorPlanoAlimentarProps> = ({
  planoInicial,
  onSalvar,
  onCancelar,
  salvando,
  pacienteNome
}) => {
  const [plano, setPlano] = useState<PlanoAlimentarConteudo>(() => {
    // Clona para permitir edição local sem mutação externa
    return JSON.parse(JSON.stringify(planoInicial));
  });

  const [diaAtivoIndex, setDiaAtivoIndex] = useState(0);

  const dias = plano.plano_semanal || [];
  const diaAtual: DiaPlanoAlimentar | undefined = dias[diaAtivoIndex] || dias[0];

  const handleUpdateOpcao = (
    diaIndex: number,
    refeicaoKey: keyof RefeicoesDia,
    opcaoIndex: number,
    novoValor: string
  ) => {
    setPlano(prev => {
      const novosDias = [...prev.plano_semanal];
      const diaAlvo = { ...novosDias[diaIndex] };
      const refeicoesAlvo = { ...diaAlvo.refeicoes };
      const opcoesRefeicao = [...(refeicoesAlvo[refeicaoKey] || [])];

      opcoesRefeicao[opcaoIndex] = novoValor;
      refeicoesAlvo[refeicaoKey] = opcoesRefeicao;
      diaAlvo.refeicoes = refeicoesAlvo;
      novosDias[diaIndex] = diaAlvo;

      return {
        ...prev,
        plano_semanal: novosDias
      };
    });
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-500/30 p-6 shadow-xl space-y-6 animate-fadeIn">
      {/* Top Header do Editor */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Plano Alimentar Semanal Gerado
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Editável
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Personalizado para <strong className="text-slate-700">{pacienteNome}</strong>. Revise ou edite as 5 opções de cada refeição antes de salvar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelar}
            disabled={salvando}
            leftIcon={<X className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            Descartar
          </Button>

          {/* Botão de salvar (Regra: só aparece após gerar) */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSalvar(plano)}
            isLoading={salvando}
            leftIcon={<Save className="w-4 h-4" />}
            className="flex-1 sm:flex-none shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {salvando ? 'Salvando...' : 'Salvar Plano Alimentar'}
          </Button>
        </div>
      </div>

      {/* Navegação por Dias da Semana */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {dias.map((d, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setDiaAtivoIndex(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              diaAtivoIndex === idx
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <span>{d.dia}</span>
          </button>
        ))}
      </div>

      {/* Exibição das Refeições em Cards com Inputs Editáveis */}
      {diaAtual && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              Opções de refeição para: <span className="text-emerald-700 font-extrabold">{diaAtual.dia}</span>
            </span>
            <span className="text-xs text-slate-400">
              5 opções por refeição • clique no texto para alterar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REFEICOES_CONFIG.map(({ key, titulo, icone: Icone, corBg, corTexto }) => {
              const opcoes = diaAtual.refeicoes?.[key] || [];
              // Garante 5 posições
              const opcoesPreenchidas = Array.from({ length: 5 }, (_, i) => opcoes[i] || '');

              return (
                <div
                  key={key}
                  className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
                    <div className={`p-2 rounded-xl border ${corBg}`}>
                      <Icone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${corTexto} uppercase tracking-wider`}>
                        {titulo}
                      </h4>
                      <p className="text-[10px] text-slate-400">5 sugestões variadas</p>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    {opcoesPreenchidas.map((opcao, opIdx) => (
                      <div key={opIdx} className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                          <span>Opção {opIdx + 1}</span>
                        </label>
                        <input
                          type="text"
                          value={opcao}
                          onChange={e =>
                            handleUpdateOpcao(diaAtivoIndex, key, opIdx, e.target.value)
                          }
                          placeholder={`Sugestão ${opIdx + 1} para ${titulo.toLowerCase()}...`}
                          className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rodapé com botão de salvar também em destaque */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-500">
          Você pode revisar os outros dias usando as abas acima antes de concluir.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSalvar(plano)}
            isLoading={salvando}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {salvando ? 'Salvando...' : 'Salvar Plano Alimentar'}
          </Button>
        </div>
      </div>
    </div>
  );
};
