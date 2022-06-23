import { ICacheService } from "./ICacheService";

export class InMemoryCacheService implements ICacheService {
    private cache: Map<string, any>;

    constructor() {
        this.cache = new Map<string, any>();
    }

    public async get<T>(key: string): Promise<T> {
        return this.cache.get(key);
    }

    public async set<T>(key: string, value: T): Promise<void> {
        this.cache.set(key, value);
    }

    public async remove(key: string): Promise<void> {
        this.cache.delete(key);
    }
}