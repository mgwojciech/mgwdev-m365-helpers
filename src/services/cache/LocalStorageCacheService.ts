import { ICacheService } from "./ICacheService";

export class LocalStorageCacheService implements ICacheService {
    public get<T>(key: string): T {
        return JSON.parse(localStorage.getItem(key));
    }
    public set<T>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
    public remove(key: string): void {
        localStorage.removeItem(key);
    }

}