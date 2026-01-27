# Assistente de Rotina Espiritual (JW Assistant)

Um aplicativo web progressivo (PWA) desenvolvido para auxiliar na organização da rotina espiritual, preparação para reuniões e estudo pessoal.

## 📱 Funcionalidades

- **📅 Organizador Semanal:** Gera cronogramas de estudo baseados no seu tempo disponível e perfil, utilizando IA para sugerir focos práticos.
- **👜 Ministério de Campo:** Auxílio para revisitas, criando ilustrações e perguntas de raciocínio.
- **📖 Leitura da Bíblia:** Acompanhamento do plano anual com marcação de progresso e geração de "pérolas" (destaques) baseados nos capítulos do dia.
- **🎙️ Preparação NotebookLM:** Ferramenta exclusiva que transcreve áudios ou textos e os formata com diretrizes específicas para criar Podcasts de estudo profundo (Deep Dive) no Google NotebookLM.
- **💬 Comentários:** Ajuda a preparar comentários concisos para as reuniões.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, Vite, TypeScript
- **Estilização:** Tailwind CSS, Lucide React (Ícones)
- **Inteligência Artificial:** Google Gemini API (via `@google/genai`)
- **Áudio:** Web Audio API & MediaRecorder

## 🚀 Como Rodar este Projeto

1. Baixe os arquivos do projeto para uma pasta no seu computador.

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure a Chave de API:
   - Crie um arquivo `.env` na raiz do projeto.
   - Adicione sua chave do Google Gemini: `API_KEY=sua_chave_aqui`

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔒 Privacidade

Os dados de cronograma, progresso de leitura e usuários são salvos apenas no **LocalStorage** do seu navegador. Nenhuma informação pessoal é enviada para servidores externos além do texto necessário para o processamento da IA (Google Gemini).

---
*Nota: Este é um projeto de auxílio pessoal e não é uma ferramenta oficial.*