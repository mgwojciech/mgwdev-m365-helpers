import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

export class FetchHttpClient implements IHttpClient{
    public get(url: string,options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(url, {
            method: "GET",
            ...options
        });
    }
    public post(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(url, {
            method: "POST",
            ...options
        });
    }
    public patch(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(url, {
            method: "PATCH",
            ...options
        });
    }
    public put(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return fetch(url, {
            method: "PUT",
            ...options
        });
    }
    public delete(url: string): Promise<IHttpClientResponse> {
        return fetch(url, {
            method: "DELETE",
        });
    }
}
