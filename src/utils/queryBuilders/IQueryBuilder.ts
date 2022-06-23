import { IQueryField } from "../../model";

export interface IQueryBuilder {
    withQuery(query: string, joinBy: "And" | "Or"): IQueryBuilder;
    withFieldQuery(field: IQueryField): IQueryBuilder;
    build(): string;
}