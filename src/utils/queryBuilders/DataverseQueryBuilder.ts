import { IQueryField } from "../../model";
import { IQueryBuilder } from "./IQueryBuilder";
import { ODataQueryBuilder } from "./ODataQueryBuilder";

export class DataverseQueryBuilder extends ODataQueryBuilder {
  public override withFieldQuery(
    fieldInfo: IQueryField,
    joinBy?: "And" | "Or"
  ): IQueryBuilder {
    let newQuery = "";
    if (
      fieldInfo.type &&
      (fieldInfo.type === "Date" || fieldInfo.type === "DateTime")
    ) {
      newQuery = fieldInfo.name;
      newQuery += " ";
      newQuery += fieldInfo.comparer
        .toLocaleLowerCase()
        .replace("geq", "ge")
        .replace("leq", "le");
      newQuery += " ";
      newQuery += fieldInfo.value;
      if (this.query) {
        this.query = `(${
          this.query
        }) ${joinBy.toLocaleLowerCase()} (${newQuery})`;
      } else {
        this.query = newQuery;
      }
      return this;
    } else if (fieldInfo.comparer === "Contains") {
      newQuery = `contains(${fieldInfo.name}, '${fieldInfo.value}')`;
      if (this.query) {
        this.query = `(${
          this.query
        }) ${joinBy.toLocaleLowerCase()} (${newQuery})`;
      } else {
        this.query = newQuery;
      }
      return this;
    } else {
      return super.withFieldQuery(fieldInfo, joinBy);
    }
  }
}
