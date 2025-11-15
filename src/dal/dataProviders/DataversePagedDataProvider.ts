import { IHttpClient } from "../http";
import { ODataPagedDataProvider } from "./ODataPagedDataProvider";


export class DataversePagedDataProvider<T> extends ODataPagedDataProvider<T> {
    constructor(dataverseClient: IHttpClient, protected dataverseEnv: string, protected tableName: string, expandQuery: string = "", selectQuery: string = "") {
        super(dataverseClient, `${dataverseEnv}/api/data/v9.0/${tableName}`, false, expandQuery, selectQuery)
    }
    public override async getData(): Promise<T[]> {
        let data = await this.callGraphAPI(this.buildInitialQuery());

        return data;
    }
    protected override buildInitialQuery(): string {
        let query = this.getQuery();
        let apiUri = new URL(this.resourceQuery);
        if (this.orderQuery) {
            apiUri.searchParams.set("$orderby", this.orderQuery)
        }
        if (query) {
            apiUri.searchParams.set("$filter", query)
        }        
        if(this.expandQuery){
            apiUri.searchParams.set("$expand", this.expandQuery)
        }
        if(this.selectQuery){
            apiUri.searchParams.set("$select", this.selectQuery)
        }
        apiUri.searchParams.set("$count", "true");

        return apiUri.toString();
    }
    protected override async callGraphAPI(url: string): Promise<T[]> {
        let response = await this.apiClient.get(url, {
            headers: {
                "Prefer": `odata.maxpagesize=${this.pageSize}`,
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                "accept": "application/json"
            }
        });
        if (response.ok) {
            let result = await response.json();
            let data = result.value;
            this.previousPages.set(this.currentPage + 1, result["@odata.nextLink"]);
            this.allItemsCount = result["@odata.count"]
            return data;
        }
        throw new Error(await response.text());
    }
}