import { IBatch } from "../../model/IBatch";
import { ArrayUtilities } from "../../utils/ArrayUtilities";
import { IdGenerator } from "../../utils/IdGenerator";
import { IHttpClient, IHttpClientResponse } from "./IHttpClient";
import { SPBatchHandler } from "./SPBatchHandler";

export class BatchSPClient implements IHttpClient {
    protected promiseIdGenerator: IdGenerator = new IdGenerator();
    private registeredPromises: Map<string, { resolve, error }> = new Map<string, { resolve, error }>();
    private batch: IBatch[] = [];
    constructor(protected baseClient: IHttpClient, protected rootSiteUrl, public batchWaitTime = 500, public batchSplitThreshold = 15) {

    }
    public async get(url: string, options?: RequestInit): Promise<IHttpClientResponse> {
        if(url?.toLowerCase().indexOf("/_api/v2.1") > -1){
            //v2.1 doesn't support batching :(
            return this.baseClient.get(url, options);
        }
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
        if(url?.toLowerCase().indexOf("/_api/search/postquery") > -1 || url?.toLowerCase().indexOf("/_api/v2.1") > -1){
            //post query doesn't support batching :(
            return this.baseClient.post(url, options);
        }
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
            const batchHandler = new SPBatchHandler(this.baseClient, this.rootSiteUrl, promisesToBeResolvedByCurrentBatch, batch, SPBatchHandler.maxRetries);

            this.batch = [];
            this.promiseIdGenerator.reset();
            this.registeredPromises.clear();
            await batchHandler.executeBatch();
        }
    }
}