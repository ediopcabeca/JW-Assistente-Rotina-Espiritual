import React, { useState } from 'react';
import { generateCommentSuggestion } from '../services/geminiService';
import { MessageSquare, PenTool, Loader2, Copy } from 'lucide-react';

const CommentHelper: React.FC = () => {
  const [context, setContext] = useState('');
  const [question, setQuestion] = useState('');
  const [scripture, setScripture] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const handleGenerate = async () => {
    if (!context || !question) return;
    setLoading(true);
    const result = await generateCommentSuggestion(context, question, scripture);
    setSuggestion(result);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white">
          <div className="flex items-center space-x-3">
            <MessageSquare size={28} className="opacity-90" />
            <div>
              <h2 className="text-xl font-bold">Preparar Comentários</h2>
              <p className="text-teal-100 text-sm">Respostas breves e edificantes para as reuniões.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobre o que fala o parágrafo?</label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                rows={3}
                placeholder="Ex: O parágrafo fala sobre ter paciência em situações difíceis..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta do parágrafo</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                  placeholder="Ex: Como podemos imitar a Jesus?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto bíblico (opcional)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                  placeholder="Ex: Tiago 5:7"
                  value={scripture}
                  onChange={(e) => setScripture(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !context || !question}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Escrevendo sugestão...</span>
                </>
              ) : (
                <>
                  <PenTool size={20} />
                  <span>Gerar Comentário</span>
                </>
              )}
            </button>
          </div>

          {suggestion && (
            <div className="mt-8 bg-teal-50 rounded-xl p-6 border border-teal-100 animate-fade-in relative group">
              <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wide mb-3">Sugestão:</h3>
              <p className="text-gray-800 text-lg leading-relaxed font-medium">"{suggestion}"</p>
              <button 
                onClick={() => navigator.clipboard.writeText(suggestion)}
                className="absolute top-4 right-4 text-teal-600 hover:text-teal-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copiar"
              >
                <Copy size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentHelper;