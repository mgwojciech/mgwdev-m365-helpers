/**
 * Represents the result of a data provider request.
 * Generic type T represents the type of the data that is returned by the data provider.
 */
export interface IDataProviderResult<T> {
  itemsCount: number;
  data: T[];
}