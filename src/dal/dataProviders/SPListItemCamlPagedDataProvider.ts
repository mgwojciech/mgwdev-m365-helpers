import { IPagedDataProvider } from "./IPagedDataProvider";
import { IHttpClient } from "../http/IHttpClient";
const requiredHttpOptions = {
  headers: {
    'content-type': 'application/json;odata=nometadata',
    accept: 'application/json;odata=nometadata'
  },
};
/**
 * Uses RenderListDataAsStream (CamlQuery) to get list items.
 */
export class SPListItemCamlPagedDataProvider<T> implements IPagedDataProvider<T> {
  public pageSize: number = 25;
  protected orderBy: string = "ID";
  protected orderDir: "ASC" | "DESC" = "DESC";
  protected lastValue: string = "";
  protected previousPages: string[] = [];
  protected previousPageIndex: number = -1;
  protected currentLink: string = "";
  protected query: string = "";
  protected lastId: number = 0;
  protected lastRow: number = 0;
  public allItemsCount: number = 0;
  public recursive: boolean = true;
  /**
   * Creates new instance of PagedDataProvider which will use caml query to filter data.
   * @param spHttpClient SharePoint REST API client - SPFxSPHttpClient for example.
   * @param siteUrl Site url of a site hosting the list.
   * @param listId List id of list You want to query.
   * @param selectedFields Array of internal names of fields You want to get (optional).
   * @param mapMethod Custom method used to map result from RenderListDataAsStream to Your domain object (optional).
   */
  constructor(protected spHttpClient: IHttpClient, protected siteUrl: string, protected listId: string, public selectedFields: string[] = [], public mapMethod?: (item: any) => T) {
  }

  public async getData(): Promise<T[]> {
    this.previousPageIndex = -1;
    this.previousPages = [];
    this.currentLink = `${this.siteUrl}/_api/web/lists('${this.listId}')/RenderListDataAsStream?TryNewExperienceSingle=TRUE&Paged=TRUE`;
    let [data] = await Promise.all([this.getDataWithAPI(this.currentLink), this.getAllItemsCount()]);
    return data;
  }
  public async getAllItemsCount(): Promise<number> {
    if (!this.query) {
      let response = await this.spHttpClient.get(`${this.siteUrl}/_api/web/lists('${this.listId}')?$select=itemCount`, {
        headers: {
          accept: "application/json",
          "content-type": "application/json;odata=verbose"
        }
      });
      if (response.ok) {
        let data = await this.getResponse(response);
        this.allItemsCount = data.ItemCount;
      }
    }
    else {
      let camlQuery = `<View Scope="RecursiveAll"><Query><Where>${this.query}</Where><ViewFields><FieldRef Name='ID' /></ViewFields></Query></View>`;
      let response = await this.spHttpClient.post(`${this.siteUrl}/_api/web/lists('${this.listId}')/RenderListDataAsStream`, {
        ...requiredHttpOptions,
        body: JSON.stringify(this.buildPostBody(camlQuery))
      });
      if (response.ok) {
        this.allItemsCount = (await this.getResponse(response)).Row.length;
      }
    }
    return this.allItemsCount;
  }
  public setOrder(orderBy: string, orderDir: "ASC" | "DESC") {
    this.orderBy = orderBy;
    this.orderDir = orderDir;
  }
  protected getCamlQuery(): string {
    if (!this.query && !this.orderBy) {
      return "";
    }
    return `<Query>${this.query ? `<Where>${this.query}</Where>` : ''
      }<OrderBy><FieldRef Name="${this.orderBy}" Ascending="${this.orderDir === 'ASC' ? 'TRUE' : 'FALSE'
      }"/></OrderBy><ViewFields>${this.selectedFields
        .map((field) => `<FieldRef Name='${field}' />`)
        .join('')}</ViewFields></Query>`;
  }

  protected buildPostBody(camlQuery: string) {
    return {
      parameters: {
        RenderOptions: 2,
        ViewXml: camlQuery
      }
    }
  }
  public getQuery(): string {
    return this.query;
  }
  public getCurrentPage() {
    return this.previousPageIndex + 1;
  }

  protected async getResponse(apiResponse){
    return await apiResponse.json();
  }
  public async getDataWithAPI(url: string): Promise<T[]> {
    let response = await this.spHttpClient.post(url, {
      ...requiredHttpOptions,
      body: JSON.stringify(this.buildPostBody(`<View${this.recursive ? ' Scope="RecursiveAll"' : ""}>${this.getCamlQuery()}<RowLimit>${this.pageSize}</RowLimit></View>`))
    });
    if (response.ok) {
      let data = await this.getResponse(response);
      if (data.Row.length > 0) {
        this.lastValue = data.Row[data.Row.length - 1][this.orderBy];
        this.lastValue = this.getLastFieldValue(data.Row);
        this.lastId = data.Row[data.Row.length - 1].ID;
        this.lastRow = data.LastRow;
      }
      if (this.mapMethod) {
        return data.Row.map(this.mapMethod);
      }
      return data.Row;
    }
    else {
      throw new Error(await response.text());
    }
  }
  protected getLastFieldValue(rows: any[]) {
    return rows[rows.length - 1][this.orderBy];
  }
  public setQuery(value: string) {
    this.query = value;
  }
  public async getNextPage(): Promise<T[]> {
    if (!this.previousPages.find((p) => p === this.currentLink)) {
      this.previousPages.push(this.currentLink);
      this.previousPageIndex = this.previousPages.length - 1;
    } else {
      this.previousPageIndex = this.previousPages.findIndex(
        (p) => p === this.currentLink
      );
    }
    this.currentLink = `${this.siteUrl}/_api/web/lists('${this.listId
      }')/RenderListDataAsStream?TryNewExperienceSingle=TRUE&Paged=TRUE&p_${this.orderBy
      }=${encodeURIComponent(this.lastValue).toLocaleLowerCase()}&p_ID=${this.lastId
      }&SortField=${this.orderBy}&SortDir=${this.orderDir === 'ASC' ? 'Asc' : 'Desc'
      }&PageFirstRow=${this.lastRow + 1}`;
    return this.getDataWithAPI(this.currentLink);
  }
  public isNextPageAvailable(): boolean {
    return this.previousPageIndex + 2 <= Math.floor(this.allItemsCount / this.pageSize);
  }
  public async getPreviousPage(): Promise<T[]> {
    let requestUrl = this.previousPages[this.previousPageIndex];
    this.previousPageIndex--;
    return this.getDataWithAPI(requestUrl);
  }
  public isPreviousPageAvailable(): boolean {
    return this.previousPageIndex >= 0;
  }
}