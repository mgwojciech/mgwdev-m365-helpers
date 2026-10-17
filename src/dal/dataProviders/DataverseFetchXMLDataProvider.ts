import { FetchXMLBuilder } from "../../utils/FetchXMLBuilder";
import { IHttpClient } from "../http";
import { IPagedDataProvider } from "./IPagedDataProvider";

export class DataverseFetchXMLDataProvider<T> implements IPagedDataProvider<T> {
    protected dataverseClient: IHttpClient;
    protected dataverseUrl: string;
    protected entityName: string;

    protected query: string;
    protected orderBy: string;
    protected orderDir: "ASC" | "DESC";
    protected currentPage: number = 0;
    public allItemsCount: number;
    public pageSize: number = 25;
    public columns: string[] = [];

    constructor(dataverseClient: IHttpClient, dataverseUrl: string, entityName: string, columns: string[]) {
        this.dataverseClient = dataverseClient;
        this.dataverseUrl = dataverseUrl;
        this.entityName = entityName;
        this.columns = columns;
    }

    protected async callApi() {
        const fetchBuilder = new FetchXMLBuilder(this.entityName, this.columns);
        fetchBuilder.withPageSize(this.pageSize);
        this.columns.forEach(column => fetchBuilder.withAttribute(column));
        fetchBuilder.withPageNumber(this.currentPage + 1);
        fetchBuilder.withOrder(this.orderBy, this.orderDir);
        if(this.query) {
            fetchBuilder.withQuery(this.query);
        }
        const fetchXml = fetchBuilder.build();
        const tableName = this.entityName.endsWith("s") ? this.entityName + "es" : `${this.entityName}s`;
        const response = await this.dataverseClient.get(`${this.dataverseUrl}/api/data/v9.1/${tableName}?fetchXml=${encodeURIComponent(fetchXml)}`);
        if(!response.ok){
            throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.value;
    }
    public getData(): Promise<T[]> {
        return this.callApi();
    }
    public setQuery(value: string) {
        this.query = value;
    }
    public getQuery(): string {
        return this.query;
    }
    public setOrder(orderBy: string, orderDir: "ASC" | "DESC") {
        this.orderBy = orderBy;
        this.orderDir = orderDir;
    }
    public getNextPage(): Promise<T[]> {
        if(this.isNextPageAvailable()) {
            this.currentPage++;
            return this.callApi();
        }
        return Promise.resolve([]);
    }
    public isNextPageAvailable(): boolean {
        return this.allItemsCount > (this.currentPage + 1) * this.pageSize;
    }
    public getPreviousPage(): Promise<T[]> {
        if(this.isPreviousPageAvailable()) {
            this.currentPage--;
            return this.callApi();
        }
        return Promise.resolve([]);
    }
    public isPreviousPageAvailable(): boolean {
        return this.currentPage > 0;
    }
    public getCurrentPage(): number {
        return this.currentPage;
    }
}