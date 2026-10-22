import React, { useState } from 'react';
import { Consulta } from '../types/dashboard';
import { formatDateDisplay } from '../lib/pacienteUtils';
import { TrendingDown, TrendingUp, Minus, Scale, Activity } from 'lucide-react';

interface GraficoEvolucaoPesoProps {
  consultas: Consulta[];
  alturaCm?: number | string | null;
}

export const GraficoEvolucaoPeso: React.FC<GraficoEvolucaoPesoProps> = ({
  consultas,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filtra apenas consultas com peso válido e ordena da mais antiga para a mais recente (cronológica)
  const dadosValidos = [...consultas]
    .filter((c) => c.peso !== null && c.peso !== undefined && Number(c.peso) > 0)
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

  if (dadosValidos.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs text-center space-y-3">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <Scale className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-800">
          Nenhuma consulta registrada ainda
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Assim que você registrar as consultas com peso, o gráfico de evolução de peso aparecerá aqui em tempo real.
        </p>
      </div>
    );
  }

  const pesoInicial = Number(dadosValidos[0].peso);
  const pesoAtual = Number(dadosValidos[dadosValidos.length - 1].peso);
  const diferencaPeso = parseFloat((pesoAtual - pesoInicial).toFixed(1));

  // Cálculo dos limites do gráfico
  const pesos = dadosValidos.map((d) => Number(d.peso));
  const minPeso = Math.floor(Math.min(...pesos) - 2);
  const maxPeso = Math.ceil(Math.max(...pesos) + 2);
  const rangePeso = maxPeso - minPeso || 1;

  // Dimensões do SVG
  const width = 700;
  const height = 240;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calcula coordenadas dos pontos
  const points = dadosValidos.map((d, index) => {
    const x =
      dadosValidos.length === 1
        ? width / 2
        : paddingX + (index / (dadosValidos.length - 1)) * chartWidth;
    const pesoNum = Number(d.peso);
    const y = height - paddingY - ((pesoNum - minPeso) / rangePeso) * chartHeight;
    return { x, y, consulta: d, peso: pesoNum };
  });

  // Caminho da linha
  const pathD =
    points.length === 1
      ? `M ${points[0].x - 30} ${points[0].y} L ${points[0].x + 30} ${points[0].y}`
      : points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  // Caminho da área com gradiente
  const areaD =
    points.length === 1
      ? ''
      : `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
          height - paddingY
        } Z`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
      {/* Top Header do Gráfico com Indicadores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Evolução de Peso
            </h3>
            <p className="text-xs text-slate-500">
              Histórico ponderal ao longo dos atendimentos
            </p>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Inicial
            </span>
            <span className="text-sm font-extrabold text-slate-700">
              {pesoInicial} kg
            </span>
          </div>

          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Atual
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {pesoAtual} kg
            </span>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-xl border text-left flex items-center gap-1.5 ${
              diferencaPeso < 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : diferencaPeso > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {diferencaPeso < 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : diferencaPeso > 0 ? (
              <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                Variação
              </span>
              <span className="text-sm font-extrabold">
                {diferencaPeso > 0 ? `+${diferencaPeso}` : diferencaPeso} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área do Gráfico SVG Interativo */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 select-none">
            <defs>
              <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Linhas de Grade Horizontais */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingY + pct * chartHeight;
              const val = Math.round(maxPeso - pct * rangePeso);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] font-medium fill-slate-400"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Preenchimento de Área sob a Curva */}
            {areaD && <path d={areaD} fill="url(#pesoGradient)" />}

            {/* Linha Principal do Gráfico */}
            <path
              d={pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pontos de Dados com Efeito Hover */}
            {points.map((p, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g key={i} className="cursor-pointer">
                  {/* Linha vertical tracejada ao passar o mouse */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={paddingY}
                      x2={p.x}
                      y2={height - paddingY}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                      opacity="0.6"
                    />
                  )}

                  {/* Círculo do Ponto */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 7 : 5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all duration-150"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Rótulo de Data no Eixo X */}
                  <text
                    x={p.x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[11px] font-semibold transition-colors ${
                      isHovered ? 'fill-emerald-700 font-bold' : 'fill-slate-600'
                    }`}
                  >
                    {formatDateDisplay(p.consulta.data_consulta)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip Dinâmico ao passar o mouse */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-0.5 border border-slate-700"
              style={{
                left: `${(points[hoveredIndex].x / width) * 100}%`,
                top: `${(points[hoveredIndex].y / height) * 100 - 4}%`,
              }}
            >
              <p className="font-bold text-emerald-400">
                {points[hoveredIndex].peso} kg
              </p>
              <p className="text-[10px] text-slate-300">
                {formatDateDisplay(points[hoveredIndex].consulta.data_consulta)}
              </p>
              {points[hoveredIndex].consulta.observacoes && (
                <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
                  {points[hoveredIndex].consulta.observacoes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
