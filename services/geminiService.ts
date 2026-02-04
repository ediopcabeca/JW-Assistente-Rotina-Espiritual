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
    Tempo disponível por dia: ${timeAvailable}
    ${weekContext ? `Semana de referência: ${weekContext}` : ''}
    
    ESTRUTURA LÓGICA SEMANAL (OBRIGATÓRIO):
    1. SEGUNDA e TERÇA: O foco principal DEVE ser "Preparação: Reunião do Meio de Semana".
    2. QUARTA: O evento fixo é "Reunião: Nossa Vida e Ministério Cristão".
    3. QUINTA e SEXTA: O foco principal DEVE ser "Preparação: Reunião de Fim de Semana".
    4. SÁBADO: O evento fixo é "Reunião: Discurso Público e Estudo de A Sentinela".
    5. DOMINGO: O evento fixo é "Adoração em Família".
    
    REGRAS DE CONTEÚDO (MUITO IMPORTANTE):
    - LEITURA DA BÍBLIA: Deve ser incluída TODOS OS DIAS (Segunda a Sexta) como uma atividade complementar ou integrada, citando o plano anual.
    - USO DO TEMPO: No campo 'focus', explique como o usuário deve usar os "${timeAvailable}" disponíveis naquele dia específico. Seja prático.
    - NOMES DAS REUNIÕES: Use os nomes completos e corretos citados acima.
    
    REGRAS DE ESTRUTURA E FORMATAÇÃO:
    - Retorne EXATAMENTE 7 itens (Segunda a Domingo).
    - Idioma: Português Brasileiro (pt-BR) com acentuação UTF-8 correta.
    
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
    return extractJSON(text) as ScheduleItem[];
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

export const suggestMethodology = async (
  basis: string,
  audience: string,
  goal: string
): Promise<string> => {
  const prompt = `
    Atue como um Mentor de Oratória Teocrática especializado na metodologia de ensino de Jesus.
    
    Analise os seguintes dados e sugira qual o Padrão de Linguagem (Metodologia) mais adequado para criar uma ilustração impactante.
    
    DADOS:
    - Ponto Bíblico: ${basis}
    - Assistência: ${audience}
    - Objetivo: ${goal}
    
    OPÇÕES DISPONÍVEIS:
    - Parábola (História baseada no cotidiano)
    - Metáfora (Comparação direta e rápida)
    - Choque (Contraste forte ou paradoxo)
    - Maiêutica (Uso de perguntas que levam à descoberta)
    - Aforismo (Sentença curta e memorável)
    
    REGRA DE RESPOSTA:
    Retorne APENAS o nome exato de uma das opções acima (exatamente como escrito na lista).
  `;

  try {
    const text = await callAIProxy({ prompt });
    return text?.trim() || "Automático";
  } catch (error) {
    console.error("Error suggesting methodology:", error);
    return "Automático";
  }
};

const extractJSON = (text: string) => {
  if (!text) throw new Error("A resposta da IA está vazia.");

  try {
    // Tenta parse direto
    return JSON.parse(text.trim());
  } catch (e) {
    // Se falhar, tenta extrair o que está entre ```json e ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
      }
    }
    // Tenta achar o primeiro { e o último }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (e3) {
        console.error("Failed to parse braced JSON:", e3);
      }
    }
    throw new Error("Não foi possível encontrar um formato de resposta válido no resultado da IA.");
  }
};

export const generateDiscoursePreparation = async (
  material: string,
  scriptures: string,
  time: string,
  resources: string
): Promise<{ fullText: string; summary: string }> => {
  const prompt = `
    ATUAÇÃO: Mentor de Oratória e Especialista em Preparação de Discursos (Teocráticos).
    CONTEXTO: Baseie-se ESTRITAMENTE na metodologia da brochura "Aprimore sua Leitura e seu Ensino" (th).
    
    OBJETIVO:
    Criar um esboço de treinamento que não apenas forneça o conteúdo, mas ensine o orador A COMO FAZER, inserindo "Notas de Treinamento" baseadas nas 20 lições da brochura th.
    
    DADOS DE ENTRADA:
    - Tema/Material: ${material}
    - Textos Bíblicos: ${scriptures}
    - Tempo: ${time} minutos
    - Recursos: ${resources}
    
    ESTRUTURA DE RESPOSTA DESEJADA (JSON):
    
    1. fullText (AGORA SERÁ O "GUIA DE TREINAMENTO COM MENTORIA"):
       - Deve conter o esboço estruturado (Introd, Pontos, Conclusão).
       - IN-LINE MENTORSHIP: Dentro do texto, insira blocos de instrução visualmente destacados (use blockquotes >) para aplicar as lições.
       - REGRAS DURAIS DE MAPEAMENTO:
         * Introdução: Force o uso da Lição 1 (Comece Bem).
         * Texto Bíblico: Force Lições 4, 5 e 6 (Introdução, Leitura, Explicação). Ex: "> [TREINO - LIÇÃO 6]: Destaque a palavra-chave 'amor' ao ler."
         * Perguntas: Se houver, cite Lição 3.
         * ILUSTRAÇÕES (OBRIGATÓRIO): Se o campo 'Recursos' ou 'Material' contiver uma ilustração, história ou exemplo, você É OBRIGADO a incluí-la no corpo do discurso usando a Lição 17. Não ignore o material do usuário.
         * Conclusão: Force Lição 20.
       - GUIA VOCAL: Adicione marcações de (Pausa), (Ênfase), (Acelerar) baseadas nas Lições 8, 9, 10 e 11.
    
    2. summary (AGORA SERÁ O "ESBOÇO EXPANDIDO PARA TRIBUNA"):
       - OBJETIVO: Segurança total. Um guia que ativa a memória através de CONTEÚDO PURO, não instruções.
       - TEMPO OBRIGATÓRIO: Ao lado de cada título de seção, coloque o tempo (Ex: "1. A Criação (3 min)").
       - ESTRUTURA OBRIGATÓRIA PARA CADA PONTO PRINCIPAL:
         1. [RESUMO DE MEMÓRIA]: Um parágrafo DENSO de 4 a 6 linhas que contém a argumentação REAL, os fatos e o ensino do ponto. 
            * PROIBIÇÃO ABSOLUTA: NÃO use verbos no imperativo (Ex: "Comece", "Destaque", "Explique"). NÃO use dicas de oratória. NÃO use orientações sobre como o orador deve agir.
            * REGRA DE OURO: Se o texto parecer uma "orientação", ele está errado. Deve parecer o "texto base" do que será dito, mas em resumo.
            * FORMA CORRETA: Use apenas afirmações doutrinais ou primeira pessoa do plural (Ex: "A hipocrisia de Israel era visível em seus sacrifícios vazios. Jeová abomina adoração sem amor...") ou (Ex: "Nós precisamos examinar nosso coração para não cairmos na armadilha dos fariseus...").
         2. [TEXTOS BÍBLICOS] (Se houver):
            * [Antes]: Gancho de conexão (Por que ler?).
            * [Leitura]: Referência em negrito (Ex: **João 3:16**).
            * [Depois]: Aplicação prática e conexão com a próxima ideia.
       - FORMATO: Use espaçamento para separar os pontos. Visualmente limpo, mas extremamente conteudista.
    
    TOM DE VOZ:
    - Encorajador, Simples, Focado no Coração (Lição 19).
    - Use Português Brasileiro coloquial culto.
    
    Retorne JSON: { "fullText": "Markdown...", "summary": "Markdown..." }
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
    return extractJSON(text);
  } catch (error: any) {
    console.error("Error generating discourse prep:", error);
    return {
      fullText: `Erro na geração: ${error.message || "Verifique sua conexão ou tente um texto menor."}`,
      summary: "Falha na análise."
    };
  }
};

export const generateBibleHighlights = async (
  chapters: string
): Promise<string> => {
  const prompt = `
    Você é um instrutor experiente da Bíblia que fornece insights espirituais profundos e encorajadores, baseando-se estritamente na Tradução do Novo Mundo da Bíblia Sagrada.
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
  mimeType: string = 'audio/mp3',
  isPartial: boolean = false
): Promise<string> => {
  const systemInstruction = isPartial
    ? `Você é um transcritor especialista.
       OBJETIVO: Transcrever e limpar o áudio fornecido, transformando-o em um texto de estudo fluido e direto.
       REGRAS:
       1. Não use introduções como "Aqui está a transcrição".
       2. Use "Nós" (primeira pessoa do plural) para tom de instrução.
       3. Cite referências bíblicas em **negrito** se aparecerem.
       4. Apenas o conteúdo, sem formatação de títulos ou metadados.`
    : `
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
            text: isPartial
              ? "Transcreva este segmento de áudio em texto fluido de estudo. Apenas o texto."
              : "Gere o Material de Ensino Definitivo deste discurso seguindo rigorosamente as diretrizes de autoridade e destaque de versículos."
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