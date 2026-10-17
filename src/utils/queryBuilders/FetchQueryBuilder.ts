import { IQueryField } from "../../model";
import { IQueryBuilder } from "./IQueryBuilder";

export class FetchQueryBuilder implements IQueryBuilder {
    protected tempQuery = "";
    public withQuery(query: string, joinBy?: "And" | "Or"): IQueryBuilder {
        const joinType = (joinBy ?? "And").toLocaleLowerCase();
        const filterQuery = `<filter type="${joinType}">${query}</filter>`;
        this.tempQuery = this.tempQuery
            ? `<filter type="${joinType}">${this.tempQuery}${filterQuery}</filter>`
            : filterQuery;
        return this;
    }
    public withFieldQuery(field: IQueryField, joinBy?: "And" | "Or"): IQueryBuilder {
        let comparer = field.comparer.toLocaleLowerCase(); 
        if(comparer === "leq"){
            comparer = "le";
        }
        if(comparer === "geq"){
            comparer = "ge";
        }
        let value = field.value;
        if (comparer === "contains") {
            comparer = "like";
            value = `%${value}%`;
        }
        if(comparer === "beginswith"){
            comparer = "like";
            value = `${value}%`;
        }
        if(comparer === "ideq"){
            comparer = "eq";
        }
        if(field.type === "Lookup" && !value.startsWith("{") && !value.endsWith("}")){
            value = `{${value}}`;
        }

        const fieldQuery = `<condition attribute="${field.name}" operator="${comparer}" value="${value}"/>`;
        return this.withQuery(fieldQuery, field.joinWith || joinBy);
    }
    public build(): string {
        return this.tempQuery;
    }

}