// Serverless function compatível com Vercel (CommonJS / Node.js standard)
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const planoAlimentarSchema = {
  type: SchemaType.OBJECT,
  description: 'Plano alimentar semanal completo com refeições estruturadas',
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Lista com os 7 dias da semana',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)',
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções para o café da manhã',
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções para o lanche da manhã',
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções para o almoço',
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções para o lanche da tarde',
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções para o jantar',
              },
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
  },
  required: ['plano_semanal'],
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Chave GEMINI_API_KEY não configurada no servidor (.env).'
    });
  }

  let paciente = req.body;
  if (typeof paciente === 'string') {
    try {
      paciente = JSON.parse(paciente);
    } catch (e) {
      // continua
    }
  }

  if (!paciente || typeof paciente !== 'object') {
    return res.status(400).json({ error: 'Dados do paciente não informados.' });
  }

  const dadosFormatados = `
- Nome: ${paciente.nome || 'Não informado'}
- Idade: ${paciente.idade ?? 'Não informada'}
- Sexo: ${paciente.sexo || 'Não informado'}
- Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}
- Peso atual: ${paciente.peso_atual ? `${paciente.peso_atual} kg` : 'Não informado'}
- Objetivo: ${paciente.objetivo || 'Não informado'}
- Nível de Atividade Física: ${paciente.nivel_atividade || (paciente.atividade_fisica ? 'Pratica atividade física: ' + (paciente.atividade_fisica_descricao || 'Sim') : 'Não informado')}
- Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares.join(', ') : (paciente.restricoes_alimentares || 'Nenhuma')}
- Alergias: ${Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : (paciente.alergias || 'Nenhuma')}
- Patologias / Condições clínicas: ${Array.isArray(paciente.patologias) ? paciente.patologias.join(', ') : (paciente.patologias || 'Nenhuma')}
- Medicamentos / Suplementos: ${[paciente.medicamentos, paciente.suplementos].filter(Boolean).join(', ') || 'Nenhum'}
- Preferências / Alimentos preferidos: ${Array.isArray(paciente.preferencias_alimentares) ? paciente.preferencias_alimentares.join(', ') : (paciente.preferencias_alimentares || 'Nenhuma')}
- Alimentos que não gosta / aversões: ${Array.isArray(paciente.alimentos_aversao) ? paciente.alimentos_aversao.join(', ') : (paciente.alimentos_aversao || 'Nenhuma')}
- Consumo diário de água: ${paciente.litros_agua ? `${paciente.litros_agua} L` : 'Não informado'}
- Rotina de sono: Acorda às ${paciente.horario_acorda || '?'} e dorme às ${paciente.horario_dorme || '?'}
- Observações adicionais: ${paciente.observacoes || 'Nenhuma'}
`.trim();

  const promptFinal = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: planoAlimentarSchema,
        temperature: 0.4,
      },
    });

    const result = await model.generateContent(promptFinal);
    const responseText = result.response.text();

    let jsonParsed;
    try {
      jsonParsed = JSON.parse(responseText);
    } catch (err) {
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      jsonParsed = JSON.parse(cleaned);
    }

    if (!jsonParsed || !Array.isArray(jsonParsed.plano_semanal)) {
      throw new Error('Formato retornado pelo Gemini é inválido.');
    }

    return res.status(200).json(jsonParsed);
  } catch (error) {
    console.error('Erro na chamada da API Gemini:', error);
    return res.status(502).json({
      error: error?.message || 'Falha ao processar requisição com a IA do Google Gemini.'
    });
  }
};
