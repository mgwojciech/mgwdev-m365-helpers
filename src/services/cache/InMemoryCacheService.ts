import { ICacheService } from "./ICacheService";

export class InMemoryCacheService implements ICacheService {
    private cache: Map<string, any>;

    constructor() {
        this.cache = new Map<string, any>();
    }

    public get<T>(key: string): T {
        return this.cache.get(key);
    }

    public set<T>(key: string, value: T): void {
        this.cache.set(key, value);
    }

    public remove(key: string): void {
        this.cache.delete(key);
    }
}