export interface IQueryField {
    name: string,
    value: string,
    type?: string,
    comparer: "Eq" | "Contains"
}