import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

export class FetchHttpClient implements IHttpClient{

    constructor(protected baseUrl?: string){
        
    }
    private buildUrl(url: string){
        if(url.startsWith("http")){
            return url;
        }
        if(!this.baseUrl){
            return url;
        }
        return this.baseUrl + url;
    }
    public get(url: string,options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(this.buildUrl(url), {
            method: "GET",
            ...options
        });
    }
    public post(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(this.buildUrl(url), {
            method: "POST",
            ...options
        });
    }
    public patch(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(this.buildUrl(url), {
            method: "PATCH",
            ...options
        });
    }
    public put(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(this.buildUrl(url), {
            method: "PUT",
            ...options
        });
    }
    public delete(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(this.buildUrl(url), {
            method: "DELETE",
            ...options
        });
    }
}
