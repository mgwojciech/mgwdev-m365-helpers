export interface IAggregationRequest{
    field: string;
    size?: number;
    bucketDefinition?: IBucketDefinition;
}

export interface IBucketRange{
    from?: any;
    to?: any;
}

export interface IBucketDefinition{
    sortBy?: string;
    isDescending?: boolean;
    minimumCount?: number;
    ranges?: IBucketRange[];
}