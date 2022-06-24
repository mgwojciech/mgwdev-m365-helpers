import { ICacheService } from "./ICacheService";

export class LocalStorageCacheService implements ICacheService {
    public get<T>(key: string): Promise<T> {
        return Promise.resolve(JSON.parse(localStorage.getItem(key)));
    }
    public set<T>(key: string, value: T): Promise<void> {
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
    }
    public remove(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
    }

}