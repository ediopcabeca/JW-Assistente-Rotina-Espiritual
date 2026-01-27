// Lógica de sincronização removida. O App agora é 100% LocalStorage.
export const syncAdapter = {
    isAvailable: () => false,
    pullUserData: async () => false,
    initializeUser: async () => {},
    verifyCloudCredentials: async () => false,
    pushBibleData: async () => {},
    pushScheduleData: async () => {}
};