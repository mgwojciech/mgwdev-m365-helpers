import { IBatch } from "../../model/IBatch";
import { ArrayUtilities } from "../../utils/ArrayUtilities";
import { IdGenerator } from "../../utils/IdGenerator";
import { DataverseBatchHandler } from "./DataverseBatchHandler";
import { IHttpClient, IHttpClientResponse } from "./IHttpClient";

export class DataverseBatchClient implements IHttpClient {
    protected promiseIdGenerator: IdGenerator = new IdGenerator();
    private registeredPromises: Map<string, { resolve, error }> = new Map<string, { resolve, error }>();
    private batch: IBatch[] = [];
    constructor(protected baseClient: IHttpClient, protected dataverseEnvUri, protected apiPath = "/api/data/v9.2", public batchWaitTime = 500, public batchSplitThreshold = 15) {

    }
    public async get(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        let promiseId = this.promiseIdGenerator.getNextId();
        let promise = new Promise<IHttpClientResponse>((resolve, error) => {
            if (this.batch.length === 0) {
                setTimeout(this.generateBatch, this.batchWaitTime);
            }
            this.registeredPromises.set(promiseId, { resolve, error });
            this.batch.push({
                url: url,
                id: promiseId,
                method: "GET",
                headers: options?.headers
            });
        });
        return promise;
    }
    public post(url: string, options?): Promise<IHttpClientResponse> {
        let promiseId = this.promiseIdGenerator.getNextId();
        let promise = new Promise<IHttpClientResponse>((resolve, error) => {
            if (this.batch.length === 0) {
                setTimeout(this.generateBatch, this.batchWaitTime);
            }
            this.registeredPromises.set(promiseId, { resolve, error });
            this.batch.push({
                url: url,
                id: promiseId,
                method: "POST",
                body: options?.body,
                headers: options?.headers
            });
        });
        return promise;
    }
    public patch(url: string, options?): Promise<IHttpClientResponse> {
        return this.baseClient.patch(url, options);
    }
    public put(url: string, options?): Promise<IHttpClientResponse> {
        return this.baseClient.put(url, options);
    }
    public delete(url: string): Promise<IHttpClientResponse> {
        return this.baseClient.delete(url);
    }
    protected generateBatch = async () => {
        //As there is an limit to max batch size (15) let's split our request to sub batches we will run sequentially
        let batches = ArrayUtilities.splitToMaxLength(this.batch, this.batchSplitThreshold);
        for (const batch of batches) {
            let promisesToBeResolvedByCurrentBatch = ArrayUtilities.getSubMap(this.registeredPromises, batch.map(b => b.id));
            const batchHandler = new DataverseBatchHandler(this.baseClient, this.dataverseEnvUri, this.apiPath, promisesToBeResolvedByCurrentBatch, batch, DataverseBatchHandler.maxRetries);

            this.batch = [];
            this.promiseIdGenerator.reset();
            this.registeredPromises.clear();
            await batchHandler.executeBatch();
        }
    }
}