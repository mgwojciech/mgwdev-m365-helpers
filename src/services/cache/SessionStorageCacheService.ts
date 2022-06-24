import { ICacheService } from "./ICacheService";

export class SessionStorageCacheService implements ICacheService {
    public get<T>(key: string): Promise<T> {
        return Promise.resolve(JSON.parse(sessionStorage.getItem(key)));
    }
    public set<T>(key: string, value: T): Promise<void> {
        sessionStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
    }
    public remove(key: string): Promise<void> {
        sessionStorage.removeItem(key);
        return Promise.resolve();
    }

}