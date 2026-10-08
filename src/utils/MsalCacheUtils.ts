export class MsalCacheUtils {
    public static clearStorageKeys(clientId: string): void {
        for (const storage of [localStorage, sessionStorage]) {
            const keys = Object.keys(storage);
            for (const key of keys) {
                if (key.startsWith(`msal.${clientId}.`) || key.includes(clientId)) {
                    storage.removeItem(key);
                }
            }
        }
    }
}
