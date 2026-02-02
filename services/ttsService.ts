const API_URL = '/api/tts.php';

let currentAudio: HTMLAudioElement | null = null;
let currentText: string | null = null;
let currentSpeed: number = 1.0;

export const speakText = async (
    text: string,
    speed: number = 1.0,
    preGeneratedAudio?: string
): Promise<string | null> => {
    try {
        // Se for o mesmo texto e velocidade, e estiver pausado, apenas retoma
        if (currentAudio && currentText === text && currentSpeed === speed) {
            if (currentAudio.paused) {
                await currentAudio.play();
                return null;
            }
        }

        // Caso contrário, para o anterior
        stopSpeaking();

        let audioSrc = '';
        let audioContent: string | null = null;

        if (preGeneratedAudio) {
            // Detecção básica de formato via base64
            const mime = preGeneratedAudio.startsWith('UklGR') ? 'audio/wav' : 'audio/mp3';
            audioSrc = `data:${mime};base64,${preGeneratedAudio}`;
            audioContent = preGeneratedAudio;
        } else {
            // Chama a API para gerar novo áudio
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, speed }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao gerar voz.');
            }

            const data = await response.json();
            if (!data.audioContent) {
                throw new Error('Conteúdo de áudio não recebido.');
            }

            audioContent = data.audioContent;
            const mime = audioContent.startsWith('UklGR') ? 'audio/wav' : 'audio/mp3';
            audioSrc = `data:${mime};base64,${audioContent}`;
        }

        currentAudio = new Audio(audioSrc);
        currentAudio.playbackRate = speed;
        currentText = text;
        currentSpeed = speed;

        await currentAudio.play();

        currentAudio.onended = () => {
            currentAudio = null;
            currentText = null;
        };

        return audioContent; // Retorna o base64 para o componente salvar se quiser
    } catch (error) {
        console.error('Erro no TTS:', error);
        throw error;
    }
};

export const pauseSpeaking = () => {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
    }
};

export const stopSpeaking = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        currentText = null;
    }
};

export const changeSpeed = (speed: number) => {
    currentSpeed = speed;
    if (currentAudio) {
        currentAudio.playbackRate = speed;
    }
};

export const isSpeaking = (): boolean => {
    return currentAudio !== null && !currentAudio.paused;
};
