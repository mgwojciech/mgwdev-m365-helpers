/**
 * Interface defining all methods needed to handle pagination.
 */
export interface IPagedDataProvider<T> {
    /**
     * Returns first page of content based on query set in setQuery, order set in setOrder and pageSize. Starts new enumeration.
     */
    getData(): Promise<T[]>;
    /**
     * Defines a query for the provider instance.
     * @param value 
     */
    setQuery(value: string);
    /**
     * Returns current query.
     */
    getQuery(): string;
    /**
     * Sets order by colum and order direction.
     * @param orderBy 
     * @param orderDir 
     */
    setOrder(orderBy: string, orderDir: "ASC" | "DESC");
    /**
     * Returns next page of paged content.
     */
    getNextPage(): Promise<T[]>;
    /**
     * Returns true if next page is available for current enumeration.
     */
    isNextPageAvailable(): boolean;
    /**
     * Returns previous page of paged content.
     */
    getPreviousPage(): Promise<T[]>;
    /**
     * Returns true if previous page is available for current enumeration.
     */
    isPreviousPageAvailable(): boolean;
    /**
     * If available, returns number of all elements satisfying provided query.  
     */
    allItemsCount: number;
    /**
     * Returns current page number (index in current enumeration).
     */
    getCurrentPage(): number;
    /**
     * Number of elements per page.
     */
    pageSize: number;
}