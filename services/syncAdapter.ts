/**
 * syncAdapter.ts
 * Gerencia a sincronização de dados entre o LocalStorage e o Banco de Dados MySQL (Backend)
 */

const API_BASE = ''; // PHP usa caminhos relativos na Hostinger

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

            // Salva cada chave recebida no LocalStorage
            Object.entries(sync_data).forEach(([key, value]) => {
                if (key.startsWith('jw_')) {
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                }
            });

            console.log('[SYNC] Dados sincronizados do servidor com sucesso.');
            return true;
        } catch (error) {
            console.error('[SYNC] Erro ao puxar dados:', error);
            return false;
        }
    },

    /**
     * Envia todos os dados locais que começam com 'jw_' para o servidor
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

            if (response.status === 401 || response.status === 403) {
                throw new Error('AUTH_ERROR');
            }

            if (!response.ok) throw new Error('SERVER_ERROR');

            console.log('[SYNC] Backup realizado no servidor.');
            return true;
        } catch (error: any) {
            console.error('[SYNC] Erro ao enviar backup:', error);
            throw error;
        }
    },

    /**
     * Inicializa a sincronização (chama pull ao logar ou abrir o app)
     */
    initializeUser: async () => {
        if (syncAdapter.isAvailable()) {
            await syncAdapter.pullUserData();
        }
    }
};