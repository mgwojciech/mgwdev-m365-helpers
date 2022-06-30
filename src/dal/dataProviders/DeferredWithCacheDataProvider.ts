import { ICacheService } from "../../services";
import { IDataProvider } from "./IDataProvider";

export class DeferredWithCacheDataProvider<T,U>{
    constructor(public dataProvider: IDataProvider<T,U>, 
        protected cacheService: ICacheService, 
        protected cacheKey: string) {

    }
    public getData(query?: U): { 
        cached: T, 
        promise: Promise<T> 
    } {
        return {
            cached: this.cacheService.get(this.cacheKey),
            promise: this.dataProvider.getData(query).then(data => { 
                this.cacheService.set(this.cacheKey, data); 
                return data; 
            })
        }
    }
}