import React, { useState, useEffect } from 'react';
import { Play, Square, Loader2, Volume2, Pause } from 'lucide-react';
import { speakText, stopSpeaking, pauseSpeaking, isSpeaking } from '../services/ttsService';

interface AudioPlayerProps {
    text: string;
    label?: string;
}

type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused';

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, label = "Ouvir Conteúdo" }) => {
    const [status, setStatus] = useState<PlaybackStatus>('idle');
    const [speed, setSpeed] = useState(1.0);

    const handlePlay = async () => {
        if (!text) return;

        setStatus('loading');
        try {
            await speakText(text, speed);
            setStatus('playing');
        } catch (error) {
            alert("Houve um erro ao gerar a voz. Verifique sua chave de API do Google Cloud.");
            setStatus('idle');
        }
    };

    const handlePause = () => {
        pauseSpeaking();
        setStatus('paused');
    };

    const handleStop = () => {
        stopSpeaking();
        setStatus('idle');
    };

    return (
        <div className="flex items-center gap-2">
            {/* Seletor de Velocidade */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
                <select
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="bg-transparent text-[10px] font-bold text-gray-600 dark:text-gray-300 outline-none px-1 cursor-pointer"
                    disabled={status === 'loading' || status === 'playing' || status === 'paused'}
                    title="Velocidade de leitura"
                >
                    <option value="0.75">0.75x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                </select>
            </div>

            {/* Botão Play/Pause */}
            {status === 'idle' || status === 'paused' ? (
                <button
                    onClick={handlePlay}
                    disabled={status === 'loading' || !text}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                    {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {status === 'loading' ? "Gerando..." : status === 'paused' ? "Retomar" : label}
                </button>
            ) : (
                <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all"
                >
                    <Pause size={14} />
                    Pausar
                </button>
            )}

            {/* Botão Parar (Reset) */}
            {(status === 'playing' || status === 'paused') && (
                <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                    title="Parar e voltar ao início"
                >
                    <Square size={14} />
                    Sair
                </button>
            )}
        </div>
    );
};

export default AudioPlayer;
