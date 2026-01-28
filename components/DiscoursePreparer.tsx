import React, { useState } from 'react';
import { generateDiscoursePreparation } from '../services/geminiService';
import { Loader2, ArrowRight, BookOpen, Clock, FileText, ClipboardList, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AudioPlayer from './AudioPlayer';

const DiscoursePreparer: React.FC = () => {
    const [material, setMaterial] = useState('');
    const [scriptures, setScriptures] = useState('');
    const [time, setTime] = useState('5');
    const [resources, setResources] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ fullText: string; summary: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'treino' | 'tribuna'>('treino');

    const handleGenerate = async () => {
        if (!material) return;
        setLoading(true);
        setResult(null);
        try {
            const output = await generateDiscoursePreparation(material, scriptures, time, resources);
            setResult(output);
        } catch (error) {
            console.error("Error generating discourse prep:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
                {/* Input Material */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={14} /> Material de Referência (Esboço/Artigo)
                    </label>
                    <textarea
                        className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none min-h-[150px] transition-all"
                        placeholder="Cole aqui o texto ou esboço original do discurso..."
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} /> Textos para Ler
                        </label>
                        <input
                            type="text"
                            className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                            placeholder="Ex: Mateus 24:14; Salmo 83:18"
                            value={scriptures}
                            onChange={(e) => setScriptures(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> Tempo da Palestra (Minutos)
                        </label>
                        <input
                            type="number"
                            className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={14} /> Ilustrações ou Recursos Específicos
                    </label>
                    <input
                        type="text"
                        className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                        placeholder="Ex: Ilustração sobre um navio; Uso da Bíblia de Estudo"
                        value={resources}
                        onChange={(e) => setResources(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !material}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl shadow-indigo-900/20"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                        <>
                            <span className="text-lg uppercase tracking-wider">Preparar Discurso</span>
                            <ArrowRight size={24} />
                        </>
                    )}
                </button>
            </div>

            {result && (
                <div className="space-y-6">
                    <div className="flex bg-[#020617] p-1 rounded-xl border border-slate-800 w-fit mx-auto">
                        <button
                            onClick={() => setActiveTab('treino')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'treino' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            TEXTO PARA TREINO
                        </button>
                        <button
                            onClick={() => setActiveTab('tribuna')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tribuna' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            ESBOÇO PARA TRIBUNA
                        </button>
                        <div className="ml-4 border-l border-slate-800 pl-4 flex items-center">
                            <AudioPlayer text={activeTab === 'treino' ? result.fullText : result.summary} label="Ouvir Conteúdo" />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-inner min-h-[400px]">
                        <div className="prose prose-invert prose-indigo max-w-none">
                            <ReactMarkdown
                                components={{
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-black text-indigo-400 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-300 dark:text-gray-100 leading-relaxed text-lg" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="text-white font-bold bg-indigo-900/30 px-1 rounded" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 text-gray-300 dark:text-gray-100" {...props} />,
                                    li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                                }}
                            >
                                {activeTab === 'treino' ? result.fullText : result.summary}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscoursePreparer;
