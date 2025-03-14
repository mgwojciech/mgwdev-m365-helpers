export interface ISPApiQueryBuilderBase {
    withSite(): ISPApiQueryBuilderSite;
    withWeb(): ISPApiQueryBuilderWeb
    withApiVersion(apiVersion: string): ISPApiQueryBuilderBase;
    withMethod(methodName: string): ISPApiQueryBuilderBase;
}

export interface ISPApiQueryBuilderWeb {
    withListByTitle(listTitle: string): ISPApiQueryBuilderWeb;
    withListById(listId: string): ISPApiQueryBuilderWeb;
    withListByUrl(listUrl: string): ISPApiQueryBuilderWeb;
    build(): string;
}
export interface ISPApiQueryBuilderSite {
    build(): string;
}

export interface ISPApiQueryBuilderList {
    build(): string;
}

export class SPApiQueryBuilderWeb implements ISPApiQueryBuilderWeb {
    protected list: {
        id?: string;
        url?: string;
        title?: string
    } | undefined;


    constructor() {

    }
    public withListByTitle(listTitle: string): ISPApiQueryBuilderWeb {
        this.list = {
            title: listTitle
        }
        return this;
    }
    public withListById(listId: string): ISPApiQueryBuilderWeb {
        this.list = {
            id: listId
        }
        return this;
    }

    public withListByUrl(listUrl: string): ISPApiQueryBuilderWeb {
        this.list = {
            url: listUrl
        }
        return this;
    }

    public build() {
        if (this.list) {
            if (this.list.title) {
                return `/lists/getByTitle('${this.list.title}')`
            }
            if (this.list.id) {
                return `/lists(guid'${this.list.id}')`
            }
            if (this.list.url) {
                return `/GetList('${this.list.url}')`
            }
        }
        return "";
    }
}





export class SPApiQueryBuilder implements ISPApiQueryBuilderBase {
    protected apiVersion: string = ""
    protected baseEntity: "site" | "web" | "" = "web";
    protected webBuilder: ISPApiQueryBuilderWeb = new SPApiQueryBuilderWeb();
    protected method: string = "";

    constructor(protected siteUrl: string) {

    }

    public withSite(): ISPApiQueryBuilderSite {
        this.baseEntity = "site";
        return this;
    }
    public withWeb(): ISPApiQueryBuilderWeb {
        this.baseEntity = "web";
        return this;
    }
    public withListByTitle(listTitle: string): ISPApiQueryBuilderWeb {
        this.webBuilder.withListByTitle(listTitle);
        return this;
    }
    public withListById(listId: string): ISPApiQueryBuilderWeb {
        this.webBuilder.withListById(listId);
        return this;
    }

    public withListByUrl(listUrl: string): ISPApiQueryBuilderWeb {
        this.webBuilder.withListByUrl(listUrl);
        return this;
    }

    public withEmptyRoot(): SPApiQueryBuilder {
        this.baseEntity = "";
        return this;
    }

    public withApiVersion(apiVersion: string): SPApiQueryBuilder {
        this.apiVersion = apiVersion;
        return this;
    }

    public withMethod(methodName: string): ISPApiQueryBuilderBase {
        this.method = methodName;
        return this;
    }

    public build(): string {
        let baseUrl = this.siteUrl + "/_api/";
        if (this.apiVersion) {
            baseUrl += `${this.apiVersion}/`
        }
        baseUrl += `${this.baseEntity}`
        baseUrl += this.webBuilder.build();
        if(this.method){
            baseUrl += `/${this.method}`
        }

        return baseUrl;
    }

}