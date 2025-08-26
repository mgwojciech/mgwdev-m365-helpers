export interface ICacheEntry<T>{
    data: T;
    expiration: number;
}