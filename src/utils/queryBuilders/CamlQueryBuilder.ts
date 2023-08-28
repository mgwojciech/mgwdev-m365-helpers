import { IQueryField } from "../../model";
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
    public withFieldQuery(fieldInfo: IQueryField, joinBy: "And" | "Or" = "And"): CamlQueryBuilder {
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
            case 'IsNotNull':
                newQuery = `<${fieldInfo.comparer}><FieldRef Name='${fieldInfo.name}' /></${fieldInfo.comparer}>`;
                break;
            case 'CurrentUserGroups':
                newQuery = `<Or>
                <Membership Type="CurrentUserGroups">
                <FieldRef Name="${fieldInfo.name}"/>
              </Membership>
              <Eq>
                <FieldRef Name="${fieldInfo.name}"></FieldRef>
                <Value Type="Integer">
                  <UserID/>
                </Value>
              </Eq>
              </Or>`;
                break;
            case 'IDEq':
                newQuery = `<Eq><FieldRef Name='${fieldInfo.name
                    }' LookupId='True' /><Value Type='${fieldInfo.type}'>${fieldInfo.value}</Value></Eq>`;
                break;
            default:
                newQuery = `<${fieldInfo.comparer}><FieldRef Name='${fieldInfo.name
                    }' /><Value ${fieldInfo.includeTimeValue != null
                        ? `IncludeTimeValue='${fieldInfo.includeTimeValue ? 'TRUE' : 'FALSE'
                        }' `
                        : ''
                    }Type='${fieldInfo.type}'>${fieldInfo.value}</Value></${fieldInfo.comparer
                    }>`;
                break;
        }

        if (this.query) {
            this.query = `<${joinBy}>${this.query}${newQuery}</${joinBy}>`;
        } else {
            this.query = newQuery;
        }
        return this;
    }
    public build(): string {
        return this.query;
    }
}