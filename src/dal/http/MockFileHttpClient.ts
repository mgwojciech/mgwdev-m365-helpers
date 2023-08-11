import { StringUtilities } from "../../utils/StringUtilities";
import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

export interface IMockFileResponse {
    url: string;
    exampleUrl: string;
    method: string;
    responseCode: number;
    responseHeaders: { [key: string]: string };
    responseBody: any;
}

export interface IMockFileStructure {
    responses: IMockFileResponse[];
}

export class MockFileHttpClient implements IHttpClient {
    public constructor(protected mockFileStructure: IMockFileStructure) {
    }
    public async get(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.getResponse(url, "GET", options);
    }
    public async post(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.getResponse(url, "POST", options);
    }
    public async patch(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.getResponse(url, "PATCH", options);
    }
    public async put(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.getResponse(url, "PUT", options);
    }
    public async delete(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        return this.getResponse(url, "DELETE", options);
    }

    public async getResponse(url: string, method: "GET" | "POST" | "PATCH" | "PUT"| "DELETE", options?: RequestInit): Promise<IHttpClientResponse> {
        const responses = this.getResponsesRegisteredForUrl(url).filter(response => response.method === method);
        if (responses.length === 0) {
            throw new Error(`No response registered for url ${url}`);
        }
        const response = responses.find(resp => resp.url === StringUtilities.findMostSimilar(responses.map(response => response.url), url));
        return {
            headers: response.responseHeaders,
            json: async () => response.responseBody,
            ok: response.responseCode >= 200 && response.responseCode < 300,
            status: response.responseCode,
            statusText: response.responseCode.toString(),
            text: async () => JSON.stringify(response.responseBody),
            blob: async () => new Blob([JSON.stringify(response.responseBody)], { type: response.responseHeaders["Content-Type"] || "application/json" }),
        };
    }

    public getResponsesRegisteredForUrl(url: string): IMockFileResponse[] {
        //the url in stored file may have * in it, so we need to check for that
        return this.mockFileStructure.responses.filter(response => this.compareUrlToMockUrl(url, response.url));
    }
    public compareUrlToMockUrl(url: string, mockUrl: string): boolean {
        let regexUrl = mockUrl.replace(/\*/g, '.*');
        regexUrl = regexUrl.replace(/\?/g, '\\?');
        const regex = new RegExp(`^${regexUrl}$`);

        return regex.test(url);
    }
}