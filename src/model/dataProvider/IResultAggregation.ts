/**
 * Represents a bucket in an aggregation result.
 */
export interface IAggregationBucket {
    key: string;
    count: number;
    aggregationFilterToken: string;
}
/**
 * Represents an aggregation result.
 */
export interface IResultAggregation {
    field: string;
    buckets: IAggregationBucket[];
}