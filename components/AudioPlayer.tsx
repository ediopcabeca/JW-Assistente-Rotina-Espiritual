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

    const handlePlay = async () => {
        if (!text) return;

        setIsLoading(true);
        try {
            await speakText(text);
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
            {!isPlaying ? (
                <button
                    onClick={handlePlay}
                    disabled={isLoading || !text}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                    {isLoading ? "Gerando Áudio..." : label}
                </button>
            ) : (
                <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                    <Square size={14} />
                    Parar Leitura
                </button>
            )}
        </div>
    );
};

export default AudioPlayer;
