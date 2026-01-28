const API_URL = '/api/tts.php';

let currentAudio: HTMLAudioElement | null = null;

export const speakText = async (text: string): Promise<void> => {
    try {
        // Para o áudio atual se houver
        stopSpeaking();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao gerar voz.');
        }

        const data = await response.json();
        if (!data.audioContent) {
            throw new Error('Conteúdo de áudio não recebido.');
        }

        // Cria o áudio a partir do Base64 retornado pelo Google
        const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
        currentAudio = new Audio(audioSrc);

        await currentAudio.play();
    } catch (error) {
        console.error('Erro no TTS:', error);
        throw error;
    }
};

export const stopSpeaking = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
};

export const isSpeaking = (): boolean => {
    return currentAudio !== null && !currentAudio.paused;
};
