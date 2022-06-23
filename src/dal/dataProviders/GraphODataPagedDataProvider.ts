import { IHttpClient } from "../http";
import { IPagedDataProvider } from "./IPagedDataProvider";

export class GraphODataPagedDataProvider<T> implements IPagedDataProvider<T>{
    protected filterQuery: string = "";
    protected orderQuery: string = "";
    protected nextPageLink: string = "";
    protected previousPages: string[];
    protected previousPageIndex: number = -1;
    public pageSize: number = 25;
    public allItemsCount: number = -1;
    constructor(protected graphClient: IHttpClient, protected resourceQuery: string, protected skipCountCheck = false) {

    }
    protected async getAllItemsCount(): Promise<number> {
        if(this.skipCountCheck){
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
        let apiUri = `${this.resourceQuery}?$filter=${query}&$top=${this.pageSize}&$orderBy=${this.orderQuery}`;

        return apiUri;
    }
    protected async callGraphAPI(url: string): Promise<T[]> {
        throw new Error("Method not implemented.");
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