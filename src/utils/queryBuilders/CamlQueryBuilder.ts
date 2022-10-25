import { IQueryBuilder } from "./IQueryBuilder";

export class CamlQueryBuilder implements IQueryBuilder {
    protected query: string = "";
    public withQuery(query: string, joinBy: "And" | "Or" = "And"): CamlQueryBuilder {
        if (this.query) {
            this.query = `<${joinBy}>${this.query}${query}</${joinBy}>`;
        }
        else {
            this.query = query;
        }
        return this;
    }
    public withFieldQuery(fieldInfo: {name:string, value: string, type: string, comparer: "Eq" | "Contains"}, joinBy: "And" | "Or" = "And"): CamlQueryBuilder {
        if(!fieldInfo.name){
            throw new Error("Field name is required");
        }
        if(!fieldInfo.type){
            throw new Error("Field type is required");
        }
        if(!fieldInfo.comparer){
            fieldInfo.comparer = "Eq";
        }
        if (this.query) {
            this.query = `<${joinBy}>${this.query}<${fieldInfo.comparer}><FieldRef Name='${fieldInfo.name}' /><Value Type='${fieldInfo.type}'>${fieldInfo.value}</Value></${fieldInfo.comparer}></${joinBy}>`;
        }
        else{
            this.query = `<${fieldInfo.comparer}><FieldRef Name='${fieldInfo.name}' /><Value Type='${fieldInfo.type}'>${fieldInfo.value}</Value></${fieldInfo.comparer}>`;
        }
        return this;
    }
    public build(): string {
        return this.query;
    }
}