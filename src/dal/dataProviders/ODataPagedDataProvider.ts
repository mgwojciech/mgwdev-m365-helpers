import { IHttpClient } from "../http";
import { IPagedDataProvider } from "./IPagedDataProvider";

/**
 * Handles pagination for queries against API resources.
 */
export class ODataPagedDataProvider<T> implements IPagedDataProvider<T> {
    protected filterQuery: string = "";
    protected orderQuery: string = "";
    protected previousPages: Map<number, string> = new Map<number, string>();
    protected currentPage: number = 0;
    public pageSize: number = 25;
    public allItemsCount: number = -1;
    /**
     * Initializes new instance of ODataPagedDataProvider.
     * @param apiClient IHttpClient implementation supporting API calls.
     * @param resourceQuery Base query to the resource. For example https://graph.microsoft.com/v1.0/users.
     * @param skipCountCheck As some resources does not support $count or You may not want to do extra call, You can skip the call for items count. Defaults to false.
     */
    constructor(protected apiClient: IHttpClient, protected resourceQuery: string, protected skipCountCheck = false, public expandQuery: string = "", public selectQuery: string = "") {

    }
    protected async getAllItemsCount(): Promise<number> {
        if (this.skipCountCheck) {
            return Infinity;
        }
        let query = this.getQuery();
        let apiUri = `${this.resourceQuery}/$count`;
        if (this.getQuery()) {
            apiUri += `?$filter=${query}`;
        }
        let countResponse = await this.apiClient.get(apiUri);
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
        let apiUri = `${this.resourceQuery}?$top=${this.pageSize}`;
        if (this.orderQuery) {
            apiUri += `&$orderby=${this.orderQuery}`;
        }
        if (query) {
            apiUri += `&$filter=${query}`;
        }
        if (this.expandQuery) {
            apiUri += `&$expand=${this.expandQuery}`;
        }
        if (this.selectQuery) {
            apiUri += `&$select=${this.selectQuery}`;
        }

        return apiUri;
    }
    protected async callGraphAPI(url: string): Promise<T[]> {
        let response = await this.apiClient.get(url);
        if (response.ok) {
            let result = await response.json();
            let data = result.value;
            this.previousPages.set(this.currentPage + 1, result["@odata.nextLink"]);
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
        this.currentPage++;
        let url = this.previousPages.get(this.currentPage)
        if (!url) {
            url = this.buildInitialQuery();
            url += "&$skip=" + (this.currentPage * this.pageSize);
        }
        return this.callGraphAPI(url);
    }
    public isNextPageAvailable(): boolean {
        return !!this.previousPages.get(this.currentPage + 1) || (this.currentPage + 1) * this.pageSize < this.allItemsCount;
    }
    public async getPreviousPage(): Promise<T[]> {
        if (!this.isPreviousPageAvailable()) {
            return [];
        }
        this.currentPage--;
        let query = this.previousPages.get(this.currentPage)
        if (!query) {
            query = this.buildInitialQuery();
            if ((this.currentPage * this.pageSize) > 0)
                query += "&$skip=" + (this.currentPage * this.pageSize);
        }
        let data = await this.callGraphAPI(query);
        return data;
    }
    public isPreviousPageAvailable(): boolean {
        return this.currentPage > 0;
    }
    public getCurrentPage(): number {
        return this.currentPage;
    }

}