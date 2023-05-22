import { IAggregationRequest, IFilterRequest, IResultAggregation } from "../../model/dataProvider";
import { IPagedDataProvider } from "./IPagedDataProvider";

export interface IRefinableDataProvider<T> extends IPagedDataProvider<T> {
    /**
     * Defines the refiners for the data provider.
     * Aggregation buckets based on provided aggregations will be returned in the result.
     * @param aggregator Aggregation request for the data provider.
     */
    setRefiners(aggregator?: IAggregationRequest[]): void;
    /**
     * Filters defined here will be applied during the data retrieval.
     * @param filters Filters to apply to the data provider.
     */
    applyRefiners(filters: IFilterRequest[]): void;
    /**
     * Gets data based on provided refiners.
     */
    getData():Promise<T[]>;
    currentAggregations: IResultAggregation[];
}