export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | Date | null;
  sexo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | string | null;
  altura?: number | string | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | string | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at: string | Date;
  ultima_consulta?: string | Date | null;
}

export interface NovoPacienteInput {
  nome: string;
  data_nascimento?: string;
  sexo?: 'Feminino' | 'Masculino' | 'Outro' | '';
  telefone?: string;
  whatsapp?: string;
  email?: string;
  peso_inicial?: number | string;
  altura?: number | string;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  refeicoes_por_dia?: number | string;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number | string;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
  data_inicio_tratamento?: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string | Date;
  peso?: number | string | null;
  cintura?: number | string | null;
  quadril?: number | string | null;
  percentual_gordura?: number | string | null;
  observacoes?: string | null;
  proximo_retorno?: string | Date | null;
  created_at: string | Date;
}

export interface NovaConsultaInput {
  paciente_id: string;
  data_consulta: string;
  peso?: number | string | null;
  cintura?: number | string | null;
  quadril?: number | string | null;
  percentual_gordura?: number | string | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string | Date;
}

export interface PacienteSemRetorno {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  ultima_consulta: string;
  dias_sem_consulta: number;
  proximo_retorno?: string;
}

export interface DashboardStats {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}
