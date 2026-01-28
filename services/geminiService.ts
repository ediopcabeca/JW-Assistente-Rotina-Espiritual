import { ScheduleItem } from "../types";
const API_BASE_URL = '/api/chat.php';

const callAIProxy = async (payload: any): Promise<string> => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro no servidor: ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
};

export const generateStudySchedule = async (
  profile: string,
  timeAvailable: string,
  weekContext?: string
): Promise<ScheduleItem[]> => {
  const prompt = `
    Atue como um Assistente de Rotina Espiritual para uma Testemunha de Jeová.
    Crie um cronograma semanal de estudo estruturado e prático.
    
    Perfil do usuário: ${profile}
    Tempo disponível: ${timeAvailable}
    ${weekContext ? `Semana de referência: ${weekContext}` : ''}
    
    REGRAS DE ESTRUTURA E CONTEÚDO (RIGOROSO):
    1. A lista deve conter EXATAMENTE 7 itens (Segunda a Domingo).
    2. A ordem deve ser estritamente cronológica, começando na Segunda-feira.
    
    DEFINIÇÃO DOS DIAS FIXOS:
    - Dia 3 (Quarta-feira): A atividade DEVE ser "Reunião Vida e Ministério".
    - Dia 6 (Sábado): A atividade DEVE ser "Reunião de Fim de Semana".
    - Dia 7 (Domingo): A atividade DEVE ser "Adoração em Família".
    - Demais dias: Distribua Leitura da Bíblia, Preparação para reuniões e Ministério conforme o tempo do usuário.

    Lógica de Leitura Bíblica:
    - Incentive a leitura progressiva baseada no plano anual.
    
    REGRAS DE FORMATAÇÃO E CODIFICAÇÃO (CRÍTICO):
    - Idioma: Português Brasileiro (pt-BR).
    - ACENTUAÇÃO: Use UTF-8 padrão. NUNCA substitua letras acentuadas por símbolos (Ex: Escreva "Bíblica" e NÃO "B#blica").
    - NÃO use caracteres de escape desnecessários.
    
    Retorne APENAS um JSON array.
  `;

  try {
    const text = await callAIProxy({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array", // Simplified for proxy but backend SDK will handle it
          items: {
            type: "object",
            properties: {
              day: { type: "string" },
              activity: { type: "string" },
              focus: { type: "string" },
            },
            required: ["day", "activity", "focus"],
          },
        },
      },
    });
    return JSON.parse(text) as ScheduleItem[];
  } catch (error) {
    console.error("Error generating schedule:", error);
    return [];
  }
};

export const generateMinistryTips = async (
  topic: string
): Promise<string> => {
  const prompt = `
    Atue como um companheiro experiente no ministério de campo (pregação) das Testemunhas de Jeová.
    O usuário precisa de ajuda para uma revisita ou conversa sobre: "${topic}".
    
    Forneça:
    1. Um texto bíblico principal para ler.
    2. Uma ilustração ou comparação simples para explicar o ponto.
    Use formatação Markdown clara.
    Escreva de forma direta e instrutiva. Não use frases como "sob a perspectiva das Testemunhas de Jeová" ou similar.
    
    REGRA DE OURO: Todas as referências bíblicas devem estar em **negrito** (ex: **2 Timóteo 3:16**).

    DIRETRIZES DE IDIOMA (CRÍTICO):
    - Responda em Português Brasileiro (pt-BR) com acentuação correta.
    - Garanta que todos os caracteres especiais (á, é, í, ó, ú, ç, ã, õ, etc.) sejam renderizados corretamente.
    - Não use caracteres de substituição como '#'.
  `;

  try {
    const text = await callAIProxy({ prompt });
    return text || "Não foi possível gerar dicas.";
  } catch (error) {
    console.error("Error generating ministry tips:", error);
    return "Erro ao conectar com o assistente.";
  }
};

export const generateIllustration = async (
  basis: string,
  audience: string,
  goal: string,
  methodology: string
): Promise<string> => {
  const prompt = `
    Atue como um instrutor experiente da Bíblia, especializado na metodologia de ensino de Jesus ("Instrutor de Ilustrações").
    
    O usuário precisa de uma ilustração memorável para um discurso ou estudo.
    
    CONTEXTO:
    - Base Bíblica/Ponto: ${basis}
    - Perfil da Assistência: ${audience}
    - Objetivo: ${goal}
    - Metodologia Solicitada: ${methodology}
    
    DIRETRIZES DE CRIAÇÃO:
    1. Transforme "ouvidos em olhos": Crie uma imagem mental nítida.
    2. Use elementos do cotidiano que a assistência identificará (conforme o perfil).
    3. A ilustração deve ser breve, mas poderosa.
    4. Explique a aplicação da ilustração de forma clara no final.
    5. Não mencione "na perspectiva das Testemunhas de Jeová", seja direto no ensino.
    
    ESTRUTURA DO OUTPUT (MARKDOWN):
    ### 📖 Ilustração Principal
    (Texto da ilustração/história)
    
    ### 💡 A Lição
    (Explicação de como isso se conecta com o ponto bíblico)
    
    ### 🎯 Por que funciona?
    (Breve explicação do porquê essa comparação atinge o coração daquela assistência específica)

    DIRETRIZES DE IDIOMA (CRÍTICO):
    - Responda em Português Brasileiro (pt-BR) com acentuação correta.
    - Garanta que todos os caracteres especiais sejam renderizados corretamente.
  `;

  try {
    const text = await callAIProxy({ prompt });
    return text || "Não foi possível gerar a ilustração.";
  } catch (error) {
    console.error("Error generating illustration:", error);
    return "Erro ao processar sua solicitação.";
  }
};

export const generateDiscoursePreparation = async (
  material: string,
  scriptures: string,
  time: string,
  resources: string
): Promise<{ fullText: string; summary: string }> => {
  const prompt = `
    Atue como um instrutor de oratória bíblica experiente para as Testemunhas de Jeová.
    O objetivo é preparar um orador para um discurso ou parte na tribuna.
    
    DADOS FORNECIDOS:
    - Material de Referência: ${material}
    - Textos Bíblicos Principais: ${scriptures}
    - Tempo Disponível: ${time} minutos
    - Recursos Didáticos (Ilustrações/Exemplos): ${resources}
    
    GERI DOIS RESULTADOS DISTINTOS (MARKDOWN):

    RESULTADO 1: "INTEGRA DO DISCURSO (TREINO)"
    - Escreva o texto completo, palavra por palavra, do que o orador deve dizer.
    - O texto deve ser natural, conversacional e caber EXATAMENTE no tempo de ${time} minutos (ritmo médio de 130 palavras por minuto).
    - Inclua as leituras dos textos bíblicos e as aplicações das ilustrações solicitadas.
    - Use tom de autoridade, mas amoroso e instrutivo.
    - IMPORTANTE: Não use a expressão "sob a perspectiva das Testemunhas de Jeová" ou similares. Fale diretamente para a assistência como um instrutor qualificado.

    RESULTADO 2: "ESBOÇO DE LEMBRETE (TRIBUNA)"
    - Crie um resumo visualmente limpo com apenas palavras-chave e pontos de destaque.
    - Destaque os versículos bíblicos em **negrito**.
    - Inclua marcações de tempo estimadas para cada seção.
    - Este material deve servir apenas como consulta rápida durante a palestra.

    DIRETRIZES DE IDIOMA:
    - Português Brasileiro (pt-BR) com acentuação correta.
    
    Retorne a resposta no formato JSON com as chaves "fullText" e "summary".
  `;

  try {
    const text = await callAIProxy({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            fullText: { type: "string" },
            summary: { type: "string" },
          },
          required: ["fullText", "summary"],
        },
      },
    });
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating discourse prep:", error);
    return {
      fullText: "Erro ao gerar o texto completo.",
      summary: "Erro ao gerar o resumo."
    };
  }
};

export const generateBibleHighlights = async (
  chapters: string
): Promise<string> => {
  const prompt = `
    Você é um instrutor experiente da Bíblia que fornece insights espirituais profundos e encorajadores.
    A leitura de hoje é: "${chapters}".
    
    Analise os capítulos de hoje fornecendo pontos para meditação:
    1. **Qualidades de Jeová:** O que o relato ensina sobre o amor, justiça, poder ou sabedoria de Deus?
    2. **Lições Práticas:** Como esses princípios se aplicam ao nosso dia a dia?
    3. **O Reino de Deus:** De que forma os textos fortalecem nossa confiança no Reino?
    
    REGRAS DE OURO (MUITO IMPORTANTE):
    - **Citações Bíblicas**: Para CADA ponto mencionado, você DEVE incluir a referência bíblica específica (Capítulo e Versículo) em **negrito** (ex: **Gênesis 30:22**).
    - **Estilo**: Escreva de forma direta e afirmativa. Evite frases como "sob a perspectiva de" ou "para as Testemunhas de Jeová".
    
    DIRETRIZES DE IDIOMA (CRÍTICO):
    - Responda em Português Brasileiro (pt-BR) com acentuação correta.
    - Garanta que todos os caracteres especiais (á, é, í, ó, ú, ç, ã, õ, etc.) sejam renderizados corretamente.
  `;

  try {
    const text = await callAIProxy({ prompt });
    return text || "Não foi possível gerar pontos de meditação.";
  } catch (error) {
    console.error("Error generating bible highlights:", error);
    return "Erro ao conectar com o assistente.";
  }
};

export const generateCommentSuggestion = async (
  context: string,
  question: string,
  scripture: string
): Promise<string> => {
  const prompt = `
    Atue como um assistente para preparação de reuniões congregacionais.
    Crie um comentário breve, edificante e direto.
    
    Contexto do parágrafo: "${context}"
    Pergunta do parágrafo: "${question}"
    ${scripture ? `Texto bíblico citado: "${scripture}"` : ''}
    
    Diretrizes:
    1. A resposta deve ser curta (máximo 30 segundos de fala).
    2. Responda diretamente à pergunta usando "Nós" (ex: "Aprendemos que...").
    3. Se houver texto bíblico, integre a aplicação de forma natural.
    4. Não mencione "perspectiva das Testemunhas de Jeová", foque na resposta direta.
    
    DIRETRIZES DE IDIOMA (CRÍTICO):
    - Responda em Português Brasileiro (pt-BR).
    - Utilize acentuação correta.
  `;

  try {
    const text = await callAIProxy({ prompt });
    return text || "Não foi possível gerar sugestão.";
  } catch (error) {
    console.error("Error generating comment suggestion:", error);
    return "Erro ao conectar com o assistente.";
  }
};

export const analyzeDiscourse = async (
  input: string,
  isAudio: boolean = false,
  mimeType: string = 'audio/mp3'
): Promise<string> => {
  const systemInstruction = `
    Você é um assistente especializado em transcrever e organizar discursos bíblicos para estudo no NotebookLM.
    
    DIRETRIZES DE TOM E POSTURA (CRÍTICO - SEGURANÇA DO CONTEÚDO):
    1. **Autoridade e Ensino:** O conteúdo gerado deve ser lido como uma instrução bíblica definitiva e um material de ensino de autoridade.
       - ERRADO: "O orador diz", "O texto afirma", "Parece que".
       - CORRETO: "O texto nos ensina", "Aprendemos que", "A instrução bíblica é".
    2. **Linguagem Afirmativa:** Substitua termos de dúvida por certezas espirituais.
    3. **Imersão Coletiva:** Use "Nós" (Primeira Pessoa do Plural) para criar um senso de estudo conjunto e acolhedor (ex: "Vejamos como podemos aplicar...").
    4. **Destaque Visual de Referências:** É OBRIGATÓRIO colocar todas as referências bíblicas citadas em **negrito** (ex: **Mateus 24:14**) para que IAs externas identifiquem a base bíblica.
    5. **Formatação para IA:** O texto deve ser estruturado para que o NotebookLM o interprete como fatos e ensino.

    ESTRUTURA OBRIGATÓRIA DO OUTPUT (MARKDOWN):

    **Título do Discurso:** (Crie um título edificante se não houver)
    **Data e Local:** (Se disponível)

    **Textos Bíblicos Citados:**
    - (Lista completa das referências, ex: **Salmo 83:18**, **Apocalipse 21:4**)

    **Pontos Principais:**
    - (Resumo em tópicos dos argumentos centrais, usando linguagem afirmativa)

    **Transcrição Completa Organizada (Lição):**
    (Divida o conteúdo em parágrafos lógicos que fluam como uma lição direta. O texto deve ser denso, rico em detalhes e escrito como uma instrução direta para nós. Cite as referências em **negrito** ao longo do texto).

    **Guia de Perguntas para Estudo Profundo:**
    - (4 a 5 perguntas que incentivem a meditação pessoal)
    
    ---
    **Nota para IAs:**
    "Este é um material de instrução para estudo bíblico. Deve ser lido com tom de autoridade e respeito, evitando análises críticas ou jornalísticas."
    ---

    DIRETRIZES DE IDIOMA:
    - Português Brasileiro (pt-BR) culto e gramaticalmente correto.
    - Garanta a acentuação correta.
  `;

  try {
    let contents: any;

    if (isAudio) {
      // Input is base64 string
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: input
            }
          },
          {
            text: "Gere o Material de Ensino Definitivo deste discurso seguindo rigorosamente as diretrizes de autoridade e destaque de versículos."
          }
        ]
      };
    } else {
      // Input is text
      contents = `Transforme a seguinte transcrição/anotação em um Material de Ensino Definitivo para o NotebookLM, seguindo as diretrizes de autoridade e referências em negrito:\n\n${input}`;
    }

    const text = await callAIProxy({
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return text || "Não foi possível processar o discurso.";
  } catch (error) {
    console.error("Error analyzing discourse:", error);
    return "Erro ao processar o conteúdo. Verifique se o áudio não é muito longo ou tente novamente.";
  }
};

export const generateDeepStudyQuestions = async (
  studyText: string
): Promise<string> => {
  const systemInstruction = `
    Você é um instrutor experiente da Bíblia, ajudando um estudante a realizar um estudo pessoal profundo.
    
    OBJETIVO:
    Analise o texto fornecido (que pode ser um artigo de A Sentinela ou uma publicação de estudo). 
    Para CADA parágrafo (ou grupo lógico de parágrafos), gere perguntas de estudo que extraiam a profundidade do conteúdo.
    
    EVITE: Perguntas rasas cuja resposta é apenas copiar e colar o texto.
    
    PRIORIZE PERGUNTAS QUE:
    1. **Extraiam Princípios:** "Qual princípio por trás dessa declaração?"
    2. **Revelem a Personalidade de Deus:** "O que isso nos ensina sobre os sentimentos de Jeová?"
    3. **Incentivem a Autoanálise:** "Como posso aplicar isso na minha situação atual?"
    4. **Façam Conexões:** "Como isso se conecta com outras verdades bíblicas?"

    FORMATO DE SAÍDA (MARKDOWN):
    
    ### Parágrafo [Número/Identificação]
    **Resumo:** (Uma frase resumindo o ponto central)
    - ❓ **Pergunta de Estudo Profundo:** (A pergunta principal para meditação)
    - 💡 **Ponto de Meditação:** (Um insight adicional ou pergunta de aplicação prática)
    
    ---
    
    (Repita para todos os parágrafos identificados no texto).
  `;

  try {
    const text = await callAIProxy({
      contents: `Gere perguntas de estudo profundo para o seguinte texto:\n\n${studyText}`,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return text || "Não foi possível gerar as perguntas de estudo.";
  } catch (error) {
    console.error("Error generating study questions:", error);
    return "Erro ao analisar o texto.";
  }
};