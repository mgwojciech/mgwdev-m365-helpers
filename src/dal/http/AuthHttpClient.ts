import { IAuthenticationService } from "../../services/IAuthenticationService";
import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

/**
 * Represents an HTTP client that handles authentication and delegates requests to a base HTTP client.
 */
export class AuthHttpClient implements IHttpClient {
    /**
     * The resource URI for the API endpoint.
     */
    public resourceUri: string = "https://graph.microsoft.com";

    /**
     * Initializes a new instance of the AuthHttpClient class.
     * @param authService The authentication service used to obtain access tokens.
     * @param baseClient The base HTTP client used to send requests.
     */
    constructor(protected authService: IAuthenticationService, protected baseClient: IHttpClient) {
    }

    /**
     * Sends an HTTP GET request.
     * @param url The URL to send the request to.
     * @param options The options for the request.
     * @returns A promise that resolves to the HTTP response.
     */
    public async get(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options);
        return this.baseClient.get(url, config);
    }

    /**
     * Sends an HTTP POST request.
     * @param url The URL to send the request to.
     * @param options The options for the request.
     * @returns A promise that resolves to the HTTP response.
     */
    public async post(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options);
        return this.baseClient.post(url, config);
    }

    /**
     * Sends an HTTP PATCH request.
     * @param url The URL to send the request to.
     * @param options The options for the request.
     * @returns A promise that resolves to the HTTP response.
     */
    public async patch(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options);
        return this.baseClient.patch(url, config);
    }

    /**
     * Sends an HTTP PUT request.
     * @param url The URL to send the request to.
     * @param options The options for the request.
     * @returns A promise that resolves to the HTTP response.
     */
    public async put(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest(options);
        return this.baseClient.put(url, config);
    }

    /**
     * Sends an HTTP DELETE request.
     * @param url The URL to send the request to.
     * @param options The options for the request.
     * @returns A promise that resolves to the HTTP response.
     */
    public async delete(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let config = await this.prepareRequest({});
        return this.baseClient.delete(url, config);
    }

    /**
     * Prepares the request by adding the authorization header.
     * @param options The options for the request.
     * @returns The modified options with the authorization header added.
     */
    private async prepareRequest(options: RequestInit) {
        return {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: await this.getAuthHeader()
            }
        };
    }

    /**
     * Gets the authorization header with the access token.
     * @returns The authorization header value.
     */
    protected async getAuthHeader() {
        let token = await this.authService.getAccessToken(this.resourceUri);
        return `Bearer ${token}`;
    }
}