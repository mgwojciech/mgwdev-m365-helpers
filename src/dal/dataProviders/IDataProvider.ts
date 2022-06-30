export interface IDataProvider<T, U> {
    getData(query?: U): Promise<T>
}