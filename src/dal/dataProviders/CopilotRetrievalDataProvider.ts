import { IHttpClient } from "../http/IHttpClient";
import { IDataProvider } from "./IDataProvider";

interface ICopilotRetrievalResponseEntity<T> {
    webUrl: string;
    resourceType: string;
    resourceMetadata: T,
    extracts: { text: string }[]
}

export class CopilotRetrievalDataProvider<T> implements IDataProvider<ICopilotRetrievalResponseEntity<T>[], string> {
    constructor(protected graphClient: IHttpClient, public dataSource: "sharePoint" | "externalItem",
        public resourceMetadata: string[],
        public filterExpresssion: string = "",
        public maximumNumberOfResults: number = 12) {

    }
    public async getData(query?: string): Promise<ICopilotRetrievalResponseEntity<T>[]> {
        const resp = await this.graphClient.post(`https://graph.microsoft.com/beta/copilot/retrieval`, {
            headers: {
                accept: "application/json",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                queryString: query,
                dataSource: this.dataSource,
                resourceMetadata: this.resourceMetadata,
                maximumNumberOfResults: this.maximumNumberOfResults,
                filterExpresssion: this.filterExpresssion
            })
        });
        if(!resp.ok){
            throw new Error(resp.statusText)
        }
        const respBody = await resp.json();
        return respBody.retrievalHits;
    }

}