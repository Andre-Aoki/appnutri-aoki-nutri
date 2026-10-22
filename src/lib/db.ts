import { neon } from '@neondatabase/serverless';
import { Nutricionista } from '../types/auth';

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL || 'postgresql://neondb_owner:npg_cgmQ4Mpt0xfZ@ep-red-king-b6bu7owl-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(DATABASE_URL);

/**
 * Salva ou atualiza os dados do nutricionista na tabela `public.nutricionistas`
 */
export async function syncNutricionista(nome: string, email: string, userId?: string): Promise<Nutricionista> {
  try {
    const rows = await sql`
      INSERT INTO nutricionistas (user_id, nome, email)
      VALUES (${userId || null}, ${nome}, ${email})
      ON CONFLICT (email)
      DO UPDATE SET
        nome = EXCLUDED.nome,
        user_id = COALESCE(EXCLUDED.user_id, nutricionistas.user_id)
      RETURNING id, user_id, nome, email, created_at;
    `;

    if (rows && rows.length > 0) {
      return rows[0] as Nutricionista;
    }
    throw new Error('Nenhum registro retornado após inserção.');
  } catch (error) {
    console.error('Erro ao sincronizar nutricionista no banco de dados:', error);
    // Tenta buscar se já existir
    try {
      const existing = await sql`
        SELECT id, user_id, nome, email, created_at 
        FROM nutricionistas 
        WHERE email = ${email} 
        LIMIT 1;
      `;
      if (existing && existing.length > 0) {
        return existing[0] as Nutricionista;
      }
    } catch (e) {
      console.error('Falha na busca alternativa de nutricionista:', e);
    }
    throw error;
  }
}

/**
 * Busca o registro do nutricionista pelo email
 */
export async function getNutricionistaByEmail(email: string): Promise<Nutricionista | null> {
  try {
    const rows = await sql`
      SELECT id, user_id, nome, email, created_at 
      FROM nutricionistas 
      WHERE email = ${email} 
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0] as Nutricionista;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar nutricionista por email:', error);
    return null;
  }
}

/**
 * Busca estatísticas do dashboard para a nutricionista logada
 */
export async function getDashboardStats(nutricionistaId: string) {
  try {
    // 1. Total de pacientes cadastrados pela nutricionista logada
    const totalPacientesQuery = sql`
      SELECT count(*)::int as total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId};
    `;

    // 2. Número de consultas registradas na semana atual da nutricionista logada
    // date_trunc('week', CURRENT_DATE) pega a segunda-feira da semana corrente
    const consultasSemanaQuery = sql`
      SELECT count(*)::int as total
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days');
    `;

    // 3. Pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado
    const pacientesSemRetornoQuery = sql`
      SELECT 
        p.id,
        p.nome,
        p.telefone,
        p.email,
        last_c.data_consulta as ultima_consulta,
        (CURRENT_DATE - last_c.data_consulta)::int as dias_sem_consulta,
        last_c.proximo_retorno
      FROM pacientes p
      CROSS JOIN LATERAL (
        SELECT c.data_consulta, c.proximo_retorno
        FROM consultas c
        WHERE c.paciente_id = p.id
        ORDER BY c.data_consulta DESC, c.created_at DESC
        LIMIT 1
      ) last_c
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND last_c.data_consulta < CURRENT_DATE - INTERVAL '30 days'
        AND (last_c.proximo_retorno IS NULL OR last_c.proximo_retorno < CURRENT_DATE)
      ORDER BY last_c.data_consulta ASC;
    `;

    const [totalPacientesRes, consultasSemanaRes, pacientesSemRetornoRes] = await Promise.all([
      totalPacientesQuery,
      consultasSemanaQuery,
      pacientesSemRetornoQuery,
    ]);

    const totalPacientes = Number(totalPacientesRes[0]?.total || 0);
    const consultasSemana = Number(consultasSemanaRes[0]?.total || 0);
    const pacientesSemRetorno = (pacientesSemRetornoRes || []).map((row: any) => ({
      id: row.id,
      nome: row.nome,
      telefone: row.telefone,
      email: row.email,
      ultima_consulta: row.ultima_consulta,
      dias_sem_consulta: Number(row.dias_sem_consulta || 0),
      proximo_retorno: row.proximo_retorno,
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('Erro ao carregar estatísticas do dashboard:', error);
    throw error;
  }
}

/**
 * Busca todos os pacientes da nutricionista com a data da última consulta
 */
export async function getPacientesWithLastConsulta(nutricionistaId: string) {
  try {
    const rows = await sql`
      SELECT 
        p.*,
        last_c.data_consulta as ultima_consulta
      FROM pacientes p
      LEFT JOIN LATERAL (
        SELECT c.data_consulta
        FROM consultas c
        WHERE c.paciente_id = p.id
        ORDER BY c.data_consulta DESC, c.created_at DESC
        LIMIT 1
      ) last_c ON true
      WHERE p.nutricionista_id = ${nutricionistaId}
      ORDER BY p.nome ASC;
    `;
    return rows;
  } catch (error) {
    console.error('Erro ao buscar lista de pacientes com última consulta:', error);
    throw error;
  }
}

/**
 * Cadastra um novo paciente vinculado à nutricionista logada
 */
export async function createPaciente(
  nutricionistaId: string,
  data: import('../types/dashboard').NovoPacienteInput
) {
  try {
    const objetivosArr = data.objetivos && data.objetivos.length > 0 ? data.objetivos : null;
    const patologiasArr = data.patologias && data.patologias.length > 0 ? data.patologias : null;
    const restricoesArr = data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null;
    const alergiasArr = data.alergias && data.alergias.length > 0 ? data.alergias : null;

    const pesoVal = data.peso_inicial !== '' && data.peso_inicial != null ? Number(data.peso_inicial) : null;
    const alturaVal = data.altura !== '' && data.altura != null ? Number(data.altura) : null;
    const refeicoesVal = data.refeicoes_por_dia !== '' && data.refeicoes_por_dia != null ? parseInt(String(data.refeicoes_por_dia), 10) : null;
    const aguaVal = data.litros_agua !== '' && data.litros_agua != null ? Number(data.litros_agua) : null;

    const rows = await sql`
      INSERT INTO pacientes (
        nutricionista_id,
        nome,
        data_nascimento,
        sexo,
        telefone,
        whatsapp,
        email,
        peso_inicial,
        altura,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes
      ) VALUES (
        ${nutricionistaId},
        ${data.nome.trim()},
        ${data.data_nascimento || null},
        ${data.sexo || null},
        ${data.telefone || null},
        ${data.whatsapp || null},
        ${data.email?.trim() || null},
        ${pesoVal},
        ${alturaVal},
        ${objetivosArr},
        ${data.objetivo_texto || null},
        ${data.nivel_atividade || null},
        ${patologiasArr},
        ${restricoesArr},
        ${alergiasArr},
        ${data.medicamentos || null},
        ${data.suplementos || null},
        ${refeicoesVal},
        ${data.horario_acorda || null},
        ${data.horario_dorme || null},
        ${aguaVal},
        ${typeof data.atividade_fisica === 'boolean' ? data.atividade_fisica : false},
        ${data.atividade_fisica_descricao || null},
        ${data.observacoes || null}
      )
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      const createdPaciente = rows[0] as import('../types/dashboard').Paciente;

      // Se informada data de início do tratamento ou peso inicial, registra automaticamente como a 1ª consulta
      if (data.data_inicio_tratamento || pesoVal) {
        try {
          const dataConsulta = data.data_inicio_tratamento || new Date().toISOString().split('T')[0];
          await sql`
            INSERT INTO consultas (
              paciente_id,
              data_consulta,
              peso,
              observacoes
            ) VALUES (
              ${createdPaciente.id},
              ${dataConsulta},
              ${pesoVal},
              'Início do tratamento'
            );
          `;
        } catch (consultaErr) {
          console.warn('Aviso: Falha ao registrar primeira consulta automática:', consultaErr);
        }
      }

      return createdPaciente;
    }
    throw new Error('Falha ao inserir paciente.');
  } catch (error) {
    console.error('Erro ao cadastrar paciente no banco:', error);
    throw error;
  }
}

/**
 * Atualiza os dados de um paciente existente no Neon
 */
export async function updatePaciente(
  id: string,
  nutricionistaId: string,
  data: Partial<import('../types/dashboard').NovoPacienteInput>
) {
  try {
    const objetivosArr = data.objetivos && data.objetivos.length > 0 ? data.objetivos : null;
    const patologiasArr = data.patologias && data.patologias.length > 0 ? data.patologias : null;
    const restricoesArr = data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null;
    const alergiasArr = data.alergias && data.alergias.length > 0 ? data.alergias : null;

    const pesoVal = data.peso_inicial !== '' && data.peso_inicial != null ? Number(data.peso_inicial) : null;
    const alturaVal = data.altura !== '' && data.altura != null ? Number(data.altura) : null;
    const refeicoesVal = data.refeicoes_por_dia !== '' && data.refeicoes_por_dia != null ? parseInt(String(data.refeicoes_por_dia), 10) : null;
    const aguaVal = data.litros_agua !== '' && data.litros_agua != null ? Number(data.litros_agua) : null;

    const rows = await sql`
      UPDATE pacientes SET
        nome = COALESCE(${data.nome ? data.nome.trim() : null}, nome),
        data_nascimento = ${data.data_nascimento || null},
        sexo = ${data.sexo || null},
        telefone = ${data.telefone || null},
        whatsapp = ${data.whatsapp || null},
        email = ${data.email ? data.email.trim() : null},
        peso_inicial = ${pesoVal},
        altura = ${alturaVal},
        objetivos = ${objetivosArr},
        objetivo_texto = ${data.objetivo_texto || null},
        nivel_atividade = ${data.nivel_atividade || null},
        patologias = ${patologiasArr},
        restricoes_alimentares = ${restricoesArr},
        alergias = ${alergiasArr},
        medicamentos = ${data.medicamentos || null},
        suplementos = ${data.suplementos || null},
        refeicoes_por_dia = ${refeicoesVal},
        horario_acorda = ${data.horario_acorda || null},
        horario_dorme = ${data.horario_dorme || null},
        litros_agua = ${aguaVal},
        atividade_fisica = ${typeof data.atividade_fisica === 'boolean' ? data.atividade_fisica : false},
        atividade_fisica_descricao = ${data.atividade_fisica_descricao || null},
        observacoes = ${data.observacoes || null}
      WHERE id = ${id} AND nutricionista_id = ${nutricionistaId}
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      return rows[0] as import('../types/dashboard').Paciente;
    }
    throw new Error('Paciente não encontrado ou não atualizado.');
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
}

/**
 * Busca todas as consultas de um paciente ordenadas cronologicamente decrescente
 */
export async function getConsultasByPacienteId(pacienteId: string) {
  try {
    const rows = await sql`
      SELECT *
      FROM consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC, created_at DESC;
    `;
    return rows as import('../types/dashboard').Consulta[];
  } catch (error) {
    console.error('Erro ao buscar consultas do paciente:', error);
    throw error;
  }
}

/**
 * Registra uma nova consulta para o paciente
 */
export async function createConsulta(data: import('../types/dashboard').NovaConsultaInput) {
  try {
    const pesoVal = data.peso !== '' && data.peso != null ? Number(data.peso) : null;
    const cinturaVal = data.cintura !== '' && data.cintura != null ? Number(data.cintura) : null;
    const quadrilVal = data.quadril !== '' && data.quadril != null ? Number(data.quadril) : null;
    const gorduraVal = data.percentual_gordura !== '' && data.percentual_gordura != null ? Number(data.percentual_gordura) : null;

    const rows = await sql`
      INSERT INTO consultas (
        paciente_id,
        data_consulta,
        peso,
        cintura,
        quadril,
        percentual_gordura,
        observacoes,
        proximo_retorno
      ) VALUES (
        ${data.paciente_id},
        ${data.data_consulta},
        ${pesoVal},
        ${cinturaVal},
        ${quadrilVal},
        ${gorduraVal},
        ${data.observacoes || null},
        ${data.proximo_retorno || null}
      )
      RETURNING *;
    `;

    if (rows && rows.length > 0) {
      return rows[0] as import('../types/dashboard').Consulta;
    }
    throw new Error('Falha ao registrar consulta.');
  } catch (error) {
    console.error('Erro ao registrar consulta no banco:', error);
    throw error;
  }
}

/**
 * Busca o histórico de planos alimentares salvos para o paciente
 */
export async function getPlanosAlimentaresByPacienteId(pacienteId: string) {
  try {
    const rows = await sql`
      SELECT *
      FROM planos_alimentares
      WHERE paciente_id = ${pacienteId}
      ORDER BY created_at DESC;
    `;
    return rows as import('../types/dashboard').PlanoAlimentar[];
  } catch (error) {
    console.error('Erro ao buscar planos alimentares:', error);
    return [];
  }
}

