import { IAuthenticationService } from "../../services/IAuthenticationService";
import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

export class AuthHttpClient implements IHttpClient {
    public resourceUri: string = "https://graph.microsoft.com";
    constructor(protected authService: IAuthenticationService, protected baseClient: IHttpClient) {
    }
    public async get(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options)
        return this.baseClient.get(url, config);
    }
    private async prepareRequest(options: RequestInit) {
        return {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: await this.getAuthHeader()
            }
        };
    }

    public async post(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options)
        return this.baseClient.post(url, config);
    }
    public async patch(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options)
        return this.baseClient.patch(url, config);
    }
    public async put(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options)
        return this.baseClient.put(url, config);
    }
    public async delete(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest({})
        return this.baseClient.delete(url, config);
    }
    protected async getAuthHeader() {
        let token = await this.authService.getAccessToken(this.resourceUri);
        return `Bearer ${token}`;
    }
}