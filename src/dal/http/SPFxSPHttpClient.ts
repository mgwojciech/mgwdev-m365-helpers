import { IHttpClient, IHttpClientResponse } from "./IHttpClient";
import { SPHttpClient } from "@microsoft/sp-http";

export class SPFxSPHttpClient implements IHttpClient {
    constructor(protected httpClient: SPHttpClient) {

    }
    public get(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.httpClient.get(url, SPHttpClient.configurations.v1, {
            ...options,
            headers: {
                ...options?.headers,
                Accept: "application/json",
                "Content-Type": "application/json",
            }
        });
    }
    public post(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.httpClient.post(url, SPHttpClient.configurations.v1, options);
    }
    public patch(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.httpClient.fetch(url, SPHttpClient.configurations.v1, {
            ...options,
            headers: {
                ...options?.headers,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            method: "PATCH"
        });
    }
    public put(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.httpClient.fetch(url, SPHttpClient.configurations.v1, {
            ...options,
            headers: {
                ...options?.headers,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            method: "PUT"
        });
    }
    public delete(url: string): Promise<IHttpClientResponse> {
        return this.httpClient.fetch(url, SPHttpClient.configurations.v1, {
            method: "DELETE"
        });
    }

}