export interface ICacheService{
    get<T>(key: string): Promise<T>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
}