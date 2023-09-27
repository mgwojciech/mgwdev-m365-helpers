export interface ISPRefinementFilters {
    results: string[];
}
/**
 * Represents search query payload
 */
export interface ISPSearchQuery {
    ClientType?: string;
    QueryTemplate?: string;
    Querytext: string;
    RefinementFilters?: string[];
    Refiners?: string;
    RowLimit?: number;
    StartRow?: number;
    SelectProperties?: string[];
    SortList?: { Direction: number, Property: string }[];
    TrimDuplicates: boolean;
    Culture?: number;
}