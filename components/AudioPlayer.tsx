import React, { useState } from 'react';
import { Play, Square, Loader2, Volume2 } from 'lucide-react';
import { speakText, stopSpeaking } from '../services/ttsService';

interface AudioPlayerProps {
    text: string;
    label?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, label = "Ouvir Conteúdo" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [speed, setSpeed] = useState(1.0);

    const handlePlay = async () => {
        if (!text) return;

        setIsLoading(true);
        try {
            await speakText(text, speed);
            setIsPlaying(true);
        } catch (error) {
            alert("Houve um erro ao gerar a voz. Verifique sua chave de API do Google Cloud.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = () => {
        stopSpeaking();
        setIsPlaying(false);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
                <select
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="bg-transparent text-[10px] font-bold text-gray-600 dark:text-gray-300 outline-none px-1 cursor-pointer"
                    disabled={isLoading || isPlaying}
                    title="Velocidade de leitura"
                >
                    <option value="0.75">0.75x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                </select>
            </div>

            {!isPlaying ? (
                <button
                    onClick={handlePlay}
                    disabled={isLoading || !text}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                    {isLoading ? "Gerando..." : label}
                </button>
            ) : (
                <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                    <Square size={14} />
                    Parar
                </button>
            )}
        </div>
    );
};

export default AudioPlayer;
