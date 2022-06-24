import { IHttpClient } from "../http";
import { IPagedDataProvider } from "./IPagedDataProvider";

export class GraphODataPagedDataProvider<T> implements IPagedDataProvider<T>{
    protected filterQuery: string = "";
    protected orderQuery: string = "";
    protected nextPageLink: string = "";
    protected previousPages: string[] = [];
    protected previousPageIndex: number = -1;
    public pageSize: number = 25;
    public allItemsCount: number = -1;
    constructor(protected graphClient: IHttpClient, protected resourceQuery: string, protected skipCountCheck = false) {

    }
    protected async getAllItemsCount(): Promise<number> {
        if (this.skipCountCheck) {
            return -1;
        }
        let query = this.getQuery();
        let apiUri = `${this.resourceQuery}/$count`;
        if (this.getQuery()) {
            apiUri += `?$filter=${query}`;
        }
        let countResponse = await this.graphClient.get(apiUri);
        if (countResponse.ok) {
            return parseInt(await countResponse.text(), 10);
        }
    }
    public async getData(): Promise<T[]> {
        let [data, allItemsCount] = await Promise.all([this.callGraphAPI(this.buildInitialQuery()), this.getAllItemsCount()])
        this.allItemsCount = allItemsCount;
        return data;
    }
    protected buildInitialQuery() {
        let query = this.getQuery();
        let apiUri = `${this.resourceQuery}?$top=${this.pageSize}&$orderBy=${this.orderQuery}`;
        if (query) {
            apiUri += `&$filter=${query}`;
        }

        return apiUri;
    }
    protected async callGraphAPI(url: string): Promise<T[]> {
        let response = await this.graphClient.get(url);
        if (response.ok) {
            let result = await response.json();
            let data = result.value;
            this.nextPageLink = result["@odata.nextLink"];
            return data;
        }
        throw new Error(await response.text());
    }
    public setQuery(value: string) {
        this.filterQuery = value;
    }
    public getQuery(): string {
        return this.filterQuery;
    }
    public setOrder(orderBy: string, orderDir: "ASC" | "DESC") {
        this.orderQuery = `${orderBy} ${orderDir.toLocaleLowerCase()}`
    }
    public async getNextPage(): Promise<T[]> {
        if (!this.isNextPageAvailable()) {
            return [];
        }
        this.previousPageIndex++;
        this.previousPages.push(this.nextPageLink);
        return this.callGraphAPI(this.nextPageLink);
    }
    public isNextPageAvailable(): boolean {
        return !!this.nextPageLink;
    }
    public async getPreviousPage(): Promise<T[]> {
        if (!this.isPreviousPageAvailable()) {
            return [];
        }
        let query = this.previousPages[this.previousPageIndex];
        let data = await this.callGraphAPI(query);
        this.previousPageIndex--;
        return data;
    }
    public isPreviousPageAvailable(): boolean {
        return this.previousPageIndex >= 0 && !!this.previousPages[this.previousPageIndex];
    }
    public getCurrentPage(): number {
        return this.previousPageIndex + 1;
    }

}