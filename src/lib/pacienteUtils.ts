/**
 * Utilitários e constantes para o cadastro e exibição de pacientes
 */

export const OPCOES_SEXO = ['Feminino', 'Masculino', 'Outro'] as const;

export const OPCOES_OBJETIVOS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
] as const;

export const OPCOES_NIVEL_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
] as const;

export const OPCOES_PATOLOGIAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
] as const;

export const OPCOES_RESTRICOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
] as const;

export const OPCOES_ALERGIAS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
] as const;

/**
 * Calcula a idade a partir da data de nascimento (formato YYYY-MM-DD, ISO string ou Date object)
 */
export function calculateAge(birthDateInput?: string | Date | null): number | null {
  if (!birthDateInput) return null;
  let birthDate: Date;

  if (birthDateInput instanceof Date) {
    birthDate = birthDateInput;
  } else if (typeof birthDateInput === 'string') {
    if (birthDateInput.includes('T')) {
      birthDate = new Date(birthDateInput);
    } else {
      const parts = birthDateInput.split('-');
      if (parts.length < 3) return null;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      birthDate = new Date(year, month, day);
    }
  } else {
    return null;
  }

  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Formata data para exibição em português (DD/MM/AAAA) considerando fuso de forma segura
 */
export function formatDateDisplay(dateVal?: string | Date | null): string {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return String(dateVal);
  }
}

export interface IMCResult {
  imc: number;
  classificacao: string;
  badgeColor: string;
}

/**
 * Calcula o IMC a partir do peso (kg) e altura (cm)
 * IMC = peso (kg) / (altura (m))²
 */
export function calculateIMC(
  pesoKg?: number | string | null,
  alturaCm?: number | string | null
): IMCResult | null {
  const p = pesoKg != null && pesoKg !== '' ? Number(pesoKg) : null;
  const a = alturaCm != null && alturaCm !== '' ? Number(alturaCm) : null;

  if (!p || !a || p <= 0 || a <= 0 || isNaN(p) || isNaN(a)) return null;

  const alturaMetros = a > 3 ? a / 100 : a;
  const imcVal = p / (alturaMetros * alturaMetros);
  const imc = parseFloat(imcVal.toFixed(1));

  let classificacao = '';
  let badgeColor = '';

  if (imc < 18.5) {
    classificacao = 'Abaixo do peso';
    badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (imc <= 24.9) {
    classificacao = 'Peso normal (Eutrofia)';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (imc <= 29.9) {
    classificacao = 'Sobrepeso';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (imc <= 34.9) {
    classificacao = 'Obesidade Grau I';
    badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (imc <= 39.9) {
    classificacao = 'Obesidade Grau II';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
  } else {
    classificacao = 'Obesidade Grau III (Mórbida)';
    badgeColor = 'bg-red-50 text-red-800 border-red-300';
  }

  return { imc, classificacao, badgeColor };
}

/**
 * Formata telefone/celular com máscara brasileira (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Converte automaticamente horários digitados como números para formato HH:MM
 * Exemplos:
 * 6 -> "06:00"
 * 630 -> "06:30"
 * 700 -> "07:00"
 * 23 -> "23:00"
 * 2230 -> "22:30"
 */
export function formatTimeInput(value: string): string {
  if (!value) return '';
  // Se já está no formato correto HH:MM
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value;

  const clean = value.replace(/\D/g, '');
  if (!clean) return value;

  if (clean.length === 1 || clean.length === 2) {
    const hours = parseInt(clean, 10);
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:00`;
    }
  }

  if (clean.length === 3) {
    const hours = parseInt(clean.slice(0, 1), 10);
    const minutes = parseInt(clean.slice(1), 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  if (clean.length >= 4) {
    const hours = parseInt(clean.slice(0, 2), 10);
    const minutes = parseInt(clean.slice(2, 4), 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return value;
}
