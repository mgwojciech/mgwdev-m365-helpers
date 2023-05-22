import { IDataProviderResult } from "./IDataProviderResult";
import { IResultAggregation } from "./IResultAggregation";

/**
 * Represents the result of a data provider request with aggregation buckets.
 * Generic type T represents the type of the data that is returned by the data provider.
 */
export interface IDataProviderRefinableResult<T> extends IDataProviderResult<T> {
    aggregations: IResultAggregation[];
}