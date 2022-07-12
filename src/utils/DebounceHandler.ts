export class DebounceHandler {
    protected static registeredTimeouts: Map<string, number> = new Map<string, number>();
    public static async debounce<T>(debounceKey: string, func: () => Promise<T>, wait: number = 100): Promise<T> {
        if (DebounceHandler.registeredTimeouts.has(debounceKey)) {
            window.clearTimeout(DebounceHandler.registeredTimeouts.get(debounceKey));
        }
        return new Promise<T>(async (resolve, reject) => {
            let timeoutId = setTimeout(async () => {
                try {
                    let result = await func();
                    DebounceHandler.registeredTimeouts.delete(debounceKey);
                    resolve(result);
                } catch (e) {
                    DebounceHandler.registeredTimeouts.delete(debounceKey);
                    reject(e);
                }
            }, wait);
            DebounceHandler.registeredTimeouts.set(debounceKey, timeoutId as any);
        });
    }
}