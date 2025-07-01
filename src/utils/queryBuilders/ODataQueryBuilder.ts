import { IQueryField } from "../../model";
import { IQueryBuilder } from "./IQueryBuilder";

/**
 * OData filter query builder.
 * Note, not all IFieldQuery.comparer vales are supported by oData protocol in SharePoint REST API
 */
export class ODataQueryBuilder implements IQueryBuilder {
    protected query: string = "";
    protected oDataSupportedComparers: string[] = ['BeginsWith', 'Contains', 'Eq', 'IDEq', 'Geq', 'Gt', 'IsNotNull', 'IsNull', 'Leq', 'Lt', 'Neq']
    public withQuery(query: string, joinBy: "And" | "Or" = "And"): IQueryBuilder {
        if (this.query) {
            this.query = `(${this.query}) ${joinBy.toLocaleLowerCase()} (${query})`
        }
        else {
            this.query = query;
        }
        return this;
    }
    /**
     * Add field query to the query
     * @param fieldInfo Field information
     * @param joinBy Join by And or Or
     * @returns ODataQueryBuilder
     * @throws Error if field name or type is not provided
     * @throws Error if field comparer is not provided
     * @throws Error if field comparer is not supported
     */
    public withFieldQuery(fieldInfo: IQueryField, joinBy: "And" | "Or" = "And"): IQueryBuilder {
        if (!fieldInfo.name) {
            throw new Error("Field name is required");
        }
        if (!fieldInfo.type) {
            throw new Error("Field type is required");
        }
        if (!fieldInfo.comparer) {
            fieldInfo.comparer = "Eq";
        }

        let newQuery = '';
        switch (fieldInfo.comparer) {
            case 'IsNull':
                newQuery = `${fieldInfo.name} eq null`;
                break;
            case 'IsNotNull':
                newQuery = `${fieldInfo.name} ne null`
                break;
            case 'CurrentUserGroups':
                throw new Error("Not supported!");
            case 'IDEq':
                newQuery = `${fieldInfo.name}/Id eq ${fieldInfo.value}`
                break;
            default:
                if (this.oDataSupportedComparers.indexOf(fieldInfo.comparer) >= 0) {
                    if (fieldInfo.comparer === "Contains") {
                        newQuery = `substringof('${fieldInfo.value}', ${fieldInfo.name})`;
                        break;
                    }
                    else if (fieldInfo.comparer === "BeginsWith") {
                        newQuery = `startswith(${fieldInfo.name}, '${fieldInfo.value}')`;
                        break;
                    }
                    else {
                        newQuery = `${fieldInfo.name} ${fieldInfo.comparer.toLocaleLowerCase().replace('geq', 'ge').replace("leq","le")} `;
                        if (fieldInfo.type && (fieldInfo.type === "Number" || fieldInfo.type === "Counter" || fieldInfo.type === "Integer")) {
                            newQuery += fieldInfo.value;
                        }
                        else if (fieldInfo.type && (fieldInfo.type === "Guid")) {
                            newQuery += `guid'${fieldInfo.value}'`
                        }
                        else if (fieldInfo.type && (fieldInfo.type === "Date" || fieldInfo.type === "DateTime" )) {
                            newQuery += `datetime'${fieldInfo.value}'`
                        }
                        else {
                            newQuery += `'${fieldInfo.value}'`
                        }
                        break;
                    }
                }
                else {
                    throw new Error("Unsupported comparer")
                }
        }

        if (this.query) {
            this.query = `(${this.query}) ${joinBy.toLocaleLowerCase()} (${newQuery})`;
        } else {
            this.query = newQuery;
        }
        return this;
    }
    public build(): string {
        return this.query;
    }

}