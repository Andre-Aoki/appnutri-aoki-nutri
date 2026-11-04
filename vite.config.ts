import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Carrega .env do root
dotenv.config();

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

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-handler',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/gerar-plano')) {
          if (req.method === 'OPTIONS') {
            res.writeHead(200, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            });
            return res.end();
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const paciente = JSON.parse(body || '{}');
                const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

                if (!apiKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  return res.end(
                    JSON.stringify({
                      error: 'Chave GEMINI_API_KEY não configurada no .env.',
                    })
                  );
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

                const candidateModels = [
                  process.env.GEMINI_MODEL,
                  'gemini-3.8-flash',
                  'gemini-3.5-flash',
                  'gemini-3.7-flash',
                  'gemini-flash-latest',
                ].filter(Boolean) as string[];

                const genAI = new GoogleGenerativeAI(apiKey);
                let lastError: any = null;
                let jsonParsed: any = null;

                for (const modelName of candidateModels) {
                  try {
                    const model = genAI.getGenerativeModel({
                      model: modelName,
                      generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: planoAlimentarSchema,
                        temperature: 0.4,
                      },
                    });

                    const result = await model.generateContent(promptFinal);
                    const responseText = result.response.text();

                    try {
                      jsonParsed = JSON.parse(responseText);
                    } catch {
                      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                      jsonParsed = JSON.parse(cleaned);
                    }

                    if (jsonParsed && Array.isArray(jsonParsed.plano_semanal)) {
                      break;
                    }
                  } catch (err: any) {
                    console.warn(`Tentativa com ${modelName} falhou:`, err?.message || err);
                    lastError = err;
                  }
                }

                if (!jsonParsed || !Array.isArray(jsonParsed.plano_semanal)) {
                  throw lastError || new Error('Formato retornado pelo Gemini é inválido.');
                }

                res.writeHead(200, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                return res.end(JSON.stringify(jsonParsed));
              } catch (err: any) {
                console.error('Erro na API Vite /api/gerar-plano:', err);
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                return res.end(
                  JSON.stringify({
                    error: err?.message || 'Falha ao processar o plano com a IA do Gemini.',
                  })
                );
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
