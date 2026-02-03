/**
 * syncAdapter.ts
 * Gerencia a sincronização de dados e subscrições de Push
 */

const API_BASE = '';

export const syncAdapter = {
    /**
     * Verifica se o usuário está autenticado para sincronizar
     */
    isAvailable: () => {
        return !!localStorage.getItem('jw_auth_token');
    },

    /**
     * Busca todos os dados do usuário no servidor e mescla com o LocalStorage
     */
    pullUserData: async () => {
        const token = localStorage.getItem('jw_auth_token');
        if (!token) return false;

        try {
            const response = await fetch(`/api/sync.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao buscar dados');

            const { sync_data } = await response.json();
            if (!sync_data) return false;

            Object.entries(sync_data).forEach(([key, value]) => {
                if (key.startsWith('jw_')) {
                    const localValueNode = localStorage.getItem(key);
                    const remoteValueString = typeof value === 'string' ? value : JSON.stringify(value);

                    if (key === 'jw_bible_read_chapters' && localValueNode) {
                        try {
                            const localList = JSON.parse(localValueNode) as string[];
                            const remoteList = JSON.parse(remoteValueString) as string[];
                            const mergedList = Array.from(new Set([...localList, ...remoteList]));
                            localStorage.setItem(key, JSON.stringify(mergedList));
                            return;
                        } catch (e) {
                            console.error('[SYNC] Falha ao mesclar capítulos:', e);
                        }
                    }
                    localStorage.setItem(key, remoteValueString);
                }
            });

            console.log('[SYNC] Dados mesclados com sucesso.');
            return true;
        } catch (error) {
            console.error('[SYNC] Erro ao puxar dados:', error);
            return false;
        }
    },

    /**
     * Envia todos os dados locais
     */
    pushUserData: async () => {
        const token = localStorage.getItem('jw_auth_token');
        if (!token) throw new Error('NO_TOKEN');

        try {
            const allLocalData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('jw_') && !key.includes('test') && !key.includes('auth_token')) {
                    allLocalData[key] = localStorage.getItem(key);
                }
            }

            const response = await fetch(`/api/sync.php`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sync_data: allLocalData })
            });

            if (response.status === 401 || response.status === 403) throw new Error('AUTH_ERROR');
            if (!response.ok) throw new Error('SERVER_ERROR');

            console.log('[SYNC] Backup realizado.');
            return true;
        } catch (error: any) {
            console.error('[SYNC] Erro ao enviar backup:', error);
            throw error;
        }
    },

    /**
     * Inicializa a sincronização
     */
    initializeUser: async () => {
        if (syncAdapter.isAvailable()) {
            await syncAdapter.pullUserData();
        }
    },

    /**
     * Inscreve o usuário no sistema de Web Push Real
     */
    subscribeUser: async (publicKey: string) => {
        const token = localStorage.getItem('jw_auth_token');
        if (!token || !('serviceWorker' in navigator)) return false;

        try {
            const registration = await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: publicKey
                });
            }

            const response = await fetch('/api/push_sub.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });

            return response.ok;
        } catch (error) {
            console.error('[PUSH] Erro na subscrição:', error);
            return false;
        }
    }
};