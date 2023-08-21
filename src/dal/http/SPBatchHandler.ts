import { IBatch } from "../../model/IBatch";
import { IHttpClient } from "./IHttpClient";

export class SPBatchHandler {
    public static readonly maxRetries = 5;
    public batchSeparator: string = "batch-mgwdev-m365-helpers";
    constructor(protected baseClient: IHttpClient, protected rootSiteUrl, protected registeredPromises: Map<string, { resolve, error }>, protected batch: IBatch[], protected retries: number = 0) { }

    public async executeBatch() {
        let batchBody = this.buildBatchBody();
        let responses = [];
        if (this.batch.length > 0) {
            let batchResponse = await this.requestBatch(batchBody);
            responses.push(...batchResponse);
        }
        this.processBatchResponse(responses);
        if (this.batch.length > 0 && this.retries > 0) {
            this.retries--;
            this.executeBatch();
        }
    }

    protected buildBatchBody() {
        let body = ``;
        this.batch.forEach(batch => {
            body += `--${this.batchSeparator}\nContent-type: application/http\nContent-Transfer-Encoding: binary\n\n`;
            body += `${batch.method} ${batch.url} HTTP/1.1\n`;
            if (batch.headers) {
                for (var prop in batch.headers) {
                    body += `${prop}: ${batch.headers[prop]}\n`;
                }
            }
            if (batch.body) {
                const encoder = new TextEncoder();
                const payloadBytes = encoder.encode(batch.body);

                // Calculate the length of the payload in bytes
                const contentLength = payloadBytes.length;
                body += `Content-Length: ${contentLength}\n`;
                body += `\n`;
                body += `${batch.body}`;
            }
            body += `\n\n\n`;
        });
        body += `--${this.batchSeparator}--`;
        return body
    }
    private extractJSONFromBody(inputText): string {
        // Find the starting position of the JSON data
        const start = inputText.indexOf('{');

        if (start !== -1) {
            // Extract the JSON data
            const jsonSection: string = inputText.substring(start);
            const jsonEnd = jsonSection.lastIndexOf('}') + 1;

            if (jsonEnd !== -1) {
                const jsonData = jsonSection.substring(0, jsonEnd);

                try {
                    // Parse the JSON data
                    JSON.parse(jsonData);
                    return jsonData;
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    return null;
                }
            } else {
                console.error('End of JSON data not found in the input text.');
                return null;
            }
        } else {
            console.error('JSON data not found in the input text.');
            return null;
        }
    }

    private processBatchResponse(responses) {
        const retryBatch = [];
        const retryRegisteredPromises: Map<string, { resolve, error }> = new Map<string, { resolve, error }>();

        this.registeredPromises.forEach((promise: { resolve; error; }, id: string) => {
            let promiseResponseText = responses[id];
            let promiseResponse = this.extractJSONFromBody(promiseResponseText);
            this.handleSingleResponse(promiseResponse, promise);
        });

        if (retryBatch.length > 0) {
            this.registeredPromises = retryRegisteredPromises;
            this.batch = retryBatch;
        } else {
            this.batch = [];
            this.registeredPromises.clear();
        }
    }

    private handleSingleResponse(promiseResponse: any, promise: { resolve: any; error: any; }) {
        let responseValue = promiseResponse;
        if (promiseResponse) {
            promise.resolve({
                json: () => Promise.resolve(JSON.parse(responseValue)),
                ok: true,
                text: () => Promise.resolve(responseValue)
            });
        }
        else {
            promise.error({
                json: () => Promise.resolve(JSON.parse(responseValue)),
                ok: false,
                text: () => Promise.resolve(responseValue)
            });
        }
    }

    protected requestBatch = async (batchBody: string) => {
        const options = {
            headers: {
                Accept: "application/json",
                "OData-Version": "4.0",
                "content-type": `multipart/mixed; boundary=${this.batchSeparator}`
            }, body: batchBody
        };
        const response = await this.baseClient.post(`${this.rootSiteUrl}/_api/$batch`, options);
        if (response.ok) {
            let batchResponse = await response.text();
            let responseSeparator = response.headers.get("content-type").split("boundary=")[1];
            return batchResponse.split(responseSeparator);
        }
    }
}