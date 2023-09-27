import { IAggregationRequest, IDataProviderRefinableResult, IFilterRequest, IResultAggregation } from "../../model/dataProvider";
import { SPSearchQueryBuilder } from "../../utils/SPSearchQueryBuilder";
import { IHttpClient } from "../http/IHttpClient";
import { IPagedDataProvider } from "./IPagedDataProvider";
import { IRefinableDataProvider } from "./IRefinableDataProvider";

export class SPSearchDataProvider<T> implements IPagedDataProvider<T>, IRefinableDataProvider<T>{
    protected query: string = "";
    protected orderColumn?: string;
    protected isDescending: boolean = false;
    protected currentPage: number = 0;
    public pageSize: number = 25;
    public allItemsCount: number = -1;
    protected aggregations?: IAggregationRequest[];
    protected filters?: IFilterRequest[];
    public cultureId: number = 1033;
    constructor(protected searchApiUrl: string, protected httpClient: IHttpClient,
        public selectFields: string[],
        public serviceQuery: string) {

    }
    public currentAggregations: IResultAggregation[];
    public setRefiners(aggregator?: IAggregationRequest[]): void {
        this.aggregations = aggregator;
    }
    public applyRefiners(filters: IFilterRequest[]): void {
        this.filters = filters;
    }
    public getCurrentPageIndex(): number {
        return this.currentPage;
    }
    public getPageSize(): number {
        return this.pageSize;
    }
    protected buildSearchRequest() {
        const queryBuilder = new SPSearchQueryBuilder();
        queryBuilder.withTemplateQuery(this.serviceQuery)
            .withSearchQuery(this.query);
        if (this.aggregations) {
            this.aggregations.forEach(aggregation => queryBuilder.withAggregationRequest(aggregation));
        }
        if (this.filters) {
            this.filters.forEach(filter => queryBuilder.withFilters(filter));
        }
        let request = queryBuilder.build();
        request.RowLimit = this.pageSize;
        request.StartRow = this.currentPage * this.pageSize;
        request.SortList = this.orderColumn && [{Direction: this.isDescending ? 0 : 1, Property: this.orderColumn || ""}]
        request.SelectProperties = this.selectFields;
        request.Culture = this.cultureId;
        let requestBody = {
            request
        }
        return requestBody;
    }

    protected mapSearchResultToEntity(row: { Cells: { Key: string, Value: string, ValueType: string }[] }): T {
        let result: { [key: string]: any } = {};
        row.Cells.forEach(cell => {
            result[cell.Key] = cell.Value;
        });
        return result as T;
    }

    protected parseResponse(response: any): IDataProviderRefinableResult<T> {
        let hitContainer = response?.PrimaryQueryResult?.RelevantResults;
        if(!hitContainer) {
            return {
                data: [],
                itemsCount: 0,
                aggregations: []
            }
        }
        this.allItemsCount = hitContainer.TotalRows;
        let data: T[] = [];
        if (this.allItemsCount > 0) {
            data = hitContainer.Table.Rows.map(this.mapSearchResultToEntity);
        }
        const aggregations: IResultAggregation[] = response.PrimaryQueryResult.RefinementResults?.Refiners?.map((refiner: any) => {
            return {
                field: refiner.Name,
                buckets: refiner.Entries.map((entry: any) => {
                    return {
                        key: entry.RefinementValue,
                        count: entry.RefinementCount,
                        aggregationFilterToken: entry.RefinementToken,
                    }
                })
            }
        });
        return {
            data,
            itemsCount: this.allItemsCount,
            aggregations
        }
    }
    public async getData(): Promise<T[]> {
        let searchResponse = await this.httpClient.post(this.searchApiUrl, {
            body: JSON.stringify(this.buildSearchRequest()),
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "odata-version": "3.0"
            }
        });
        if (searchResponse.ok) {
            let responseJson = await searchResponse.json();
            const response = this.parseResponse(responseJson);
            this.currentAggregations = response.aggregations;
            return response.data;
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
            let getDataResponse = await this.getData();
            return getDataResponse;
        }
        return [];
    }
    public isNextPageAvailable(): boolean {
        return (this.currentPage + 1) * this.pageSize < this.allItemsCount;
    }
    public async getPreviousPage(): Promise<T[]> {
        if (this.isPreviousPageAvailable()) {
            this.currentPage--;
            let getDataResponse = await this.getData();
            return getDataResponse;
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
    public async jumpToAPage(pageIndex: number): Promise<T[]> {
        this.currentPage = pageIndex;
        let getDataResponse = await this.getData();
        return getDataResponse;
    }
}