import { IQueryBuilder, FetchQueryBuilder } from "./queryBuilders";
import { IQueryField } from "../model";

export class FetchXMLBuilder implements IQueryBuilder {
    protected filterQueryBuilder: FetchQueryBuilder = new FetchQueryBuilder();
    protected entityName: string;
    protected attributes: string[] = [];
    protected pageSize: number = 25;
    protected pageNumber: number = 1;
    protected orderBy: string = "createdon";
    protected orderDir: "ASC" | "DESC" = "DESC";

    public constructor(entityName: string, attributes?: string[]) {
        this.entityName = entityName;
        if (attributes) {
            this.attributes = attributes;
        }
    }

    public withAttribute(attribute: string): IQueryBuilder {
        if(this.attributes.indexOf(attribute) === -1) {
            this.attributes.push(attribute);
        }
        return this;
    }

    public withQuery(query: string, joinBy?: "And" | "Or"): IQueryBuilder {
        this.filterQueryBuilder.withQuery(query, joinBy);
        return this;
    }
    public withFieldQuery(field: IQueryField, joinBy?: "And" | "Or"): IQueryBuilder {
        this.filterQueryBuilder.withFieldQuery(field, joinBy);
        return this;
    }
    public build(): string {
        const filterQuery = this.filterQueryBuilder.build();
        return `<fetch mapping="logical" returntotalrecordcount="true" page="${this.pageNumber}" count="${this.pageSize}" no-lock="false">
            <entity name="${this.entityName}">
            ${this.attributes.map(attr => `<attribute name="${attr}" />`).join("\n")}
            ${filterQuery}
            <order attribute="${this.orderBy}" descending="${this.orderDir === "DESC" ? "true" : "false"}" />
        </entity>
        </fetch>`;
    }
    public withOrder(orderBy: string, orderDir: "ASC" | "DESC"): IQueryBuilder {
        this.orderBy = orderBy;
        this.orderDir = orderDir;
        return this;
    }

    public withPageSize(pageSize: number): IQueryBuilder {
        this.pageSize = pageSize;
        return this;
    }

    public withPageNumber(pageNumber: number): IQueryBuilder {
        this.pageNumber = pageNumber;
        return this;
    }

}