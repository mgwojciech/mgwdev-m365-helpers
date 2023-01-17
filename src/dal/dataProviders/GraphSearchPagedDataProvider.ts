import { IHttpClient } from "../http/IHttpClient";
import { IPagedDataProvider } from "./IPagedDataProvider";

/**
 * Handles pagination for search queries against MS Graph Search API.
 */
export class GraphSearchPagedDataProvider<T> implements IPagedDataProvider<T>{
    protected query: string;
    protected orderColumn: string;
    protected isDescending: boolean;
    protected currentPage: number = 0;
    public pageSize: number = 25;
    public allItemsCount: number = -1;
    public graphSearchEndpoint: string = "https://graph.microsoft.com/beta/search/query";
    /**
     * Initialized new instance of GraphSearchPagedDataProvider.
     * @param graphClient IHttpClient implementation supporting Graph API calls.
     * @param entityTypes Entity types for search. listItem by default.
     * @param selectFields Fields You want to select in the query.
     */
    constructor(protected graphClient: IHttpClient,
        public entityTypes: ("message" | "event" | "driveItem" | "listItem" | "person" | "chatMessage"| "externalItem")[] = ["listItem"],
        public selectFields: string[] = ["id", "title", "url"]) {

    }
    protected buildSearchRequest() {
        let requestBody = {
            requests: [{
                entityTypes: this.entityTypes,
                from: this.currentPage * this.pageSize,
                to: (this.currentPage + 1) * this.pageSize,
                query: null,
                sortProperties: null,
                fields: null
            }]
        };
        if (this.getQuery()) {
            requestBody.requests[0].query = {
                queryString: this.getQuery()
            }
        }
        else {
            requestBody.requests[0].query = {
                queryString: "*"
            }
        }
        if (this.orderColumn) {
            requestBody.requests[0].sortProperties = [{
                name: this.orderColumn,
                isDescending: this.isDescending
            }]
        }
        if (this.selectFields && this.selectFields.length > 0) {
            requestBody.requests[0].fields = this.selectFields;
        }
        return requestBody;
    }
    public async getData(): Promise<T[]> {
        let searchResponse = await this.graphClient.post(this.graphSearchEndpoint, {
            body: JSON.stringify(this.buildSearchRequest()),
            headers: {
                "accept": "application/json",
                "content-type": "application/json"
            }
        });
        if (searchResponse.ok) {
            let responseJson = await searchResponse.json();
            let hitContainer = responseJson.value[0].hitsContainers[0];
            this.allItemsCount = hitContainer.total;
            if (this.allItemsCount > 0) {
                return hitContainer.hits.map(hit => ({
                    ...hit.resource,
                    type: hit.resource["@odata.type"],
                    hitResourceIdId: hit.resource.id
                }));
            }
            return [];
        }
        else {
            throw new Error(await searchResponse.text());
        }
    }
    public setQuery(value: string) {
        this.query = value;
    }
    public getQuery(): string {
        return this.query;
    }
    public setOrder(orderBy: string, orderDir: "ASC" | "DESC") {
        this.orderColumn = orderBy;
        this.isDescending = orderDir === "DESC";
    }
    public async getNextPage(): Promise<T[]> {
        if (this.isNextPageAvailable()) {
            this.currentPage++;
            return this.getData();
        }
        return [];
    }
    public isNextPageAvailable(): boolean {
        return (this.currentPage + 1) * this.pageSize < this.allItemsCount;
    }
    public async getPreviousPage(): Promise<T[]> {
        if (this.isPreviousPageAvailable()) {
            this.currentPage--;
            return this.getData();
        }
        else {
            return [];
        }
    }
    public isPreviousPageAvailable(): boolean {
        return this.currentPage > 0;
    }
    public getCurrentPage(): number {
        return this.currentPage;
    }
    public jumpToAPage(pageIndex: number): Promise<T[]> {
        this.currentPage = pageIndex;
        return this.getData();
    }
}