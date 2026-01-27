import React, { useState } from 'react';
import { generateMinistryTips } from '../services/geminiService';
import { Briefcase, Lightbulb, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MinistryHelper: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState('');

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    const result = await generateMinistryTips(topic);
    setTips(result);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Briefcase size={28} className="opacity-90" />
            <div>
              <h2 className="text-xl font-bold">Ministério de Campo</h2>
              <p className="text-orange-100 text-sm">Ideias para revisitas e estudos bíblicos.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              className="flex-1 p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none text-sm transition-all"
              placeholder="Qual o assunto da revisita? Ex: Por que Deus permite o sofrimento?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Lightbulb size={20} />}
            </button>
          </div>

          {tips && (
            <div className="prose prose-orange dark:prose-invert max-w-none bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-xl border border-orange-100 dark:border-orange-900/50">
              <ReactMarkdown 
                components={{
                   h1: ({node, ...props}) => <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-2" {...props} />,
                   h2: ({node, ...props}) => <h4 className="text-md font-bold text-orange-700 dark:text-orange-300 mb-2" {...props} />,
                   h3: ({node, ...props}) => <h5 className="text-sm font-bold text-orange-700 dark:text-orange-300 mb-1" {...props} />,
                   ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300" {...props} />,
                   li: ({node, ...props}) => <li className="pl-1" {...props} />,
                   p: ({node, ...props}) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
                   strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                }}
              >
                {tips}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinistryHelper;