import React, { useState } from 'react';
import { generateDeepStudyQuestions } from '../services/geminiService';
import { BookOpen, Search, Loader2, Sparkles, Clipboard, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const StudyQuestionsHelper: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!inputText) return;
    setLoading(true);
    setResult('');

    const generatedQuestions = await generateDeepStudyQuestions(inputText);
    setResult(generatedQuestions);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BookOpen size={28} className="opacity-90" />
              <Search size={14} className="absolute -bottom-1 -right-1 text-white bg-purple-600 rounded-full p-0.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Perguntas de Estudo Profundo</h2>
              <p className="text-purple-100 text-sm">Extraia a profundidade dos parágrafos com perguntas de meditação.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cole o texto do Estudo (Artigo ou Publicação)
              </label>
              <textarea
                className="w-full p-4 h-48 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-all resize-y"
                placeholder="Cole aqui os parágrafos que você vai estudar..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Dica: Cole um artigo inteiro ou uma seção de capítulos para melhor contexto.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !inputText}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Analisando e Criando Perguntas...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Gerar Perguntas de Profundidade</span>
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="animate-fade-in space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Análise do Estudo
                </h3>
                <button
                  onClick={handleCopy}
                  className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Clipboard size={14} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="prose prose-purple dark:prose-invert max-w-none bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-800/50">
                <ReactMarkdown
                  components={{
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300 mt-6 mb-3 border-b border-purple-200 dark:border-purple-800 pb-1" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-purple-900 dark:text-purple-100" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
                  }}
                >
                  {result}
                </ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudyQuestionsHelper;