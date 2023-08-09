import { FetchHttpClient } from "./FetchHttpClient";
import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

export class SandboxProxyGraphClient implements IHttpClient{
    constructor(protected baseClient: IHttpClient = new FetchHttpClient()){

    }
    public async get(url: string, options?: RequestInit | undefined): Promise<IHttpClientResponse> {
        const encodedUrl = encodeURIComponent(url);
        return this.baseClient.get(`https://graph.office.net/en-us/graph/api/proxy?url=${encodedUrl}`, this.appendAuthHeader(options));
    }
    public async post(url: string, options?: RequestInit | undefined): Promise<IHttpClientResponse> {
        const encodedUrl = encodeURIComponent(url);
        return this.baseClient.post(`https://graph.office.net/en-us/graph/api/proxy?url=${encodedUrl}`, this.appendAuthHeader(options));
    }
    public async patch(url: string, options?: RequestInit | undefined): Promise<IHttpClientResponse> {
        const encodedUrl = encodeURIComponent(url);
        return this.baseClient.patch(`https://graph.office.net/en-us/graph/api/proxy?url=${encodedUrl}`, this.appendAuthHeader(options));
    }
    public async put(url: string, options?: RequestInit | undefined): Promise<IHttpClientResponse> {
        const encodedUrl = encodeURIComponent(url);
        return this.baseClient.put(`https://graph.office.net/en-us/graph/api/proxy?url=${encodedUrl}`, this.appendAuthHeader(options));
    }
    public async delete(url: string): Promise<IHttpClientResponse> {
        const encodedUrl = encodeURIComponent(url);
        return this.baseClient.delete(`https://graph.office.net/en-us/graph/api/proxy?url=${encodedUrl}`);
    }
    protected appendAuthHeader = (options: RequestInit | undefined) => {
        if (!options) {
            options = {};
        }
        if (!options.headers) {
            options.headers = {};
        }
        //@ts-ignore
        if (!options.headers["Authorization"]) {
            //@ts-ignore
            options.headers["Authorization"] = `Bearer {token:https://graph.microsoft.com/}`;
        }
        return options;
    }
}