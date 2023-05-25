import { ISPSearchQuery, IFilterRequest, IAggregationRequest } from "../model";

export class SPSearchQueryBuilder {
    protected searchQuery: string = "";
    protected templateQuery: string = "";
    protected refiners: string[] = [];
    protected refinementFilters: string[] = [];
    constructor() {

    }
    public withSearchQuery(query: string): SPSearchQueryBuilder {
        this.searchQuery = query;
        return this;
    };
    public withTemplateQuery(query: string): SPSearchQueryBuilder {
        this.templateQuery = query;
        return this;
    }
    public withAggregationRequest(aggregationRequest: IAggregationRequest): SPSearchQueryBuilder {
        const bucketRangesCount = aggregationRequest?.bucketDefinition?.ranges ? aggregationRequest.bucketDefinition.ranges.length : 0;
        if (bucketRangesCount > 0 && aggregationRequest?.bucketDefinition?.ranges) {
            let discretizedRanges = `discretize=manual`
            aggregationRequest.bucketDefinition.ranges.forEach((range, index) => {
                let relevantRange = index === 0 ? range.from + "/" + range.to  :  range.to;
                discretizedRanges += `/${relevantRange}`;
            });
            this.refiners.push(`${aggregationRequest.field}(${discretizedRanges})`);
        }
        else {
            this.refiners.push(aggregationRequest.field);
        }
        return this;
    }
    public withFilters(filters: IFilterRequest): SPSearchQueryBuilder {
        this.refinementFilters.push(`${filters.field}:${filters.filterValue}`);
        return this;
    }
    public build(): ISPSearchQuery {
        return {
            ClientType: "mgwdev-m365-helper",
            QueryTemplate: this.templateQuery || undefined,
            Querytext: this.searchQuery,
            RefinementFilters: this.refinementFilters,
            Refiners: this.refiners.length > 0 ? this.refiners.join(",") : undefined,
            TrimDuplicates: false
        }
    }
}