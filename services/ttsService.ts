const API_URL = '/api/tts.php';

let currentAudio: HTMLAudioElement | null = null;
let currentText: string | null = null;
let currentSpeed: number = 1.0;

export const speakText = async (text: string, speed: number = 1.0): Promise<void> => {
    try {
        // Se for o mesmo texto e velocidade, e estiver pausado, apenas retoma
        if (currentAudio && currentText === text && currentSpeed === speed) {
            if (currentAudio.paused) {
                await currentAudio.play();
                return;
            }
        }

        // Caso contrário, para o anterior e gera um novo
        stopSpeaking();

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

        const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
        currentAudio = new Audio(audioSrc);
        currentText = text;
        currentSpeed = speed;

        await currentAudio.play();

        currentAudio.onended = () => {
            currentAudio = null;
            currentText = null;
        };
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

export const isSpeaking = (): boolean => {
    return currentAudio !== null && !currentAudio.paused;
};
