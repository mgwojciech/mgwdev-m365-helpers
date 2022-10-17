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
            if(batch.body){
                body += `${batch.body}`;
            }
            body += `\n\n\n`;
        });
        body += `--${this.batchSeparator}--`;
        return body
    }

    private processBatchResponse(responses) {
        const retryBatch = [];
        const retryRegisteredPromises: Map<string, { resolve, error }> = new Map<string, { resolve, error }>();

        this.registeredPromises.forEach((promise: { resolve; error; }, id: string) => {
            let promiseResponseText = responses[id];
            let promiseResponse = promiseResponseText.split("\n");
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
        let responseValue = promiseResponse[promiseResponse.length - 2];
        if (promiseResponse) {
            promise.resolve({
                json: () => Promise.resolve(JSON.parse(responseValue)),
                ok: promiseResponse.status === 200,
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
                ConsistencyLevel: "eventual",
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