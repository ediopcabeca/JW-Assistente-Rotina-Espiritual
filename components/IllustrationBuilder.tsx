import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, Home, Lightbulb, Zap, HelpCircle, PenTool, Image as ImageIcon, Mic2, Wand2 } from 'lucide-react';
import { generateIllustration, suggestMethodology } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import DiscoursePreparer from './DiscoursePreparer';

const methodologies = [
    { id: 'Automático', icon: <Sparkles size={18} />, label: 'Automático' },
    { id: 'Parábola', icon: <Home size={18} />, label: 'Parábola' },
    { id: 'Metáfora', icon: <Lightbulb size={18} />, label: 'Metáfora' },
    { id: 'Choque', icon: <Zap size={18} />, label: 'Choque' },
    { id: 'Maiêutica', icon: <HelpCircle size={18} />, label: 'Maiêutica' },
    { id: 'Aforismo', icon: <PenTool size={18} />, label: 'Aforismo' },
];

const IllustrationBuilder: React.FC = () => {
    const [activeMode, setActiveMode] = useState<'illustrator' | 'preparer'>('illustrator');
    const [basis, setBasis] = useState('');
    const [audience, setAudience] = useState('');
    const [goal, setGoal] = useState('');
    const [methodology, setMethodology] = useState('Automático');
    const [loading, setLoading] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [suggestedId, setSuggestedId] = useState<string | null>(null);
    const [result, setResult] = useState('');

    const handleSuggest = async () => {
        if (!basis) return;
        setSuggesting(true);
        try {
            const suggestion = await suggestMethodology(basis, audience, goal);
            // Match the suggestion with methodology IDs
            const found = methodologies.find(m => suggestion.toLowerCase().includes(m.id.toLowerCase()));
            if (found) {
                setSuggestedId(found.id);
                setMethodology(found.id);
            }
        } catch (error) {
            console.error("Error suggesting methodology:", error);
        } finally {
            setSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!basis) return;
        setLoading(true);
        setResult('');
        try {
            const output = await generateIllustration(basis, audience, goal, methodology);
            setResult(output);
        } catch (error) {
            console.error("Error generating illustration:", error);
            setResult("Erro ao gerar ilustração. Verifique sua conexão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="bg-[#0f172a] dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 transition-all">

                {/* Header - Unified INSTRUA Brand */}
                <div className="p-10 text-center space-y-4 bg-gradient-to-b from-blue-600/10 to-transparent">
                    <div className="flex justify-center items-center gap-3">
                        <span className="text-4xl">📖</span>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">INSTRUA</h1>
                    </div>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto leading-tight">
                        Crie ilustrações memoráveis e prepare discursos públicos com ferramentas baseadas na metodologia de Jesus.
                    </p>

                    {/* Mode Switcher */}
                    <div className="flex justify-center mt-6">
                        <div className="bg-[#020617] p-1.5 rounded-2xl border border-slate-800 flex gap-2">
                            <button
                                onClick={() => setActiveMode('illustrator')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeMode === 'illustrator' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <ImageIcon size={18} />
                                ILUSTRADOR
                            </button>
                            <button
                                onClick={() => setActiveMode('preparer')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeMode === 'preparer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Mic2 size={18} />
                                PREPARADOR
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0">
                    {activeMode === 'illustrator' ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                {/* Input Basis */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ponto Bíblico ou Base do Discurso</label>
                                    <textarea
                                        className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none min-h-[120px] transition-all"
                                        placeholder="Ex: A necessidade de abandonar velhos hábitos ao se tornar cristão (Col. 3:9)."
                                        value={basis}
                                        onChange={(e) => setBasis(e.target.value)}
                                    />
                                </div>

                                {/* Grid for Audience and Goal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Perfil da Assistência</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                                            placeholder="Ex: Jovens profissionais urbanos"
                                            value={audience}
                                            onChange={(e) => setAudience(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Objetivo da Ilustração</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#020617] border border-slate-800 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                                            placeholder="Ex: Motivar mudança imediata"
                                            value={goal}
                                            onChange={(e) => setGoal(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Methodology Selector */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Padrão de Linguagem (Metodologia)</label>
                                        <button
                                            onClick={handleSuggest}
                                            disabled={suggesting || !basis}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 transition-all disabled:opacity-50"
                                        >
                                            {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                            {suggesting ? 'Sugerindo...' : 'Sugerir Especialista'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {methodologies.map((m) => {
                                            const isSuggested = suggestedId === m.id;
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setMethodology(m.id);
                                                        setSuggestedId(null); // Clear suggestion highlight on manual change
                                                    }}
                                                    className={`
                                                        relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200
                                                        ${methodology === m.id
                                                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                            : 'bg-[#020617] border-slate-800 text-gray-500 hover:border-slate-600'}
                                                        ${isSuggested ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f172a] animate-pulse' : ''}
                                                    `}
                                                >
                                                    <span className={methodology === m.id ? 'text-blue-400' : 'text-gray-600'}>{m.icon}</span>
                                                    <span className="text-sm font-semibold">{m.label}</span>
                                                    {isSuggested && (
                                                        <span className="absolute -top-2 -right-1 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Indicado</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !basis}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-xl shadow-blue-900/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                        <>
                                            <span className="text-lg uppercase tracking-wider">Criar Ilustrações</span>
                                            <ArrowRight size={24} />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Result Display */}
                            {result && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-inner">
                                        <div className="prose prose-invert prose-blue max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    h3: ({ node, ...props }) => <h3 className="text-xl font-black text-blue-400 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2" {...props} />,
                                                    p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed text-lg" {...props} />,
                                                    li: ({ node, ...props }) => <li className="text-gray-300 mb-2" {...props} />,
                                                }}
                                            >
                                                {result}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <DiscoursePreparer />
                    )}
                </div>
            </div>
        </div>
    );
};

export default IllustrationBuilder;
