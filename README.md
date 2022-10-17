## MGWDEV M365 Helpers

This library is a set of classes and methods I consider useful when developing apps against M365 stack.

## Data Access Layer (DAL)

The core of this library is dal folder. Under dal/http there are multiple http clients You can use in SPFx as well as any other app (that includes node.js console applications). 

### AuthHttpClient

If You are not using SPFx Extensibility Principal AuthHttpClient will handle authentication for You (if You are using SPFx Extensibility Principal use SPFxGraphHttpClient or SPFxSPHttpClient).

To construct AuthHttpClient You need to provide baseClient (usually it will be FetchHttpClient but if You like axios You can create Your own based on axios) and implementation of IAuthenticationService. Currently there are two supported implementations of IAuthenticationService. One is MsalAuthenticationService and the other is NodeAppOnlyAuthenticationService.

``` Javascript

let baseClient = new FetchHttpClient();
let authService = new MsalAuthenticationService("<client-id>");

let client = new AuthHttpClient(authService, baseClient);

let me = await client.get("https://graph.microsoft.com/v1.0/me");
```

### BatchGraphClient

BatchGraphClient will automatically create batch out of Yours get requests. In constructor it requires a baseClient (AuthHttpClient, SPFxGraphHttpClient or any IHttpClient capable of calling MS Graph).

``` Javascript

let baseClient = new FetchHttpClient();
let authService = new MsalAuthenticationService("<client-id>");
let authClient = new AuthHttpClient(authService, baseClient);

let client = new BatchGraphClient(authClient);

let [me, photo, presence] = await Promise.all([
    client.get("https://graph.microsoft.com/v1.0/me"),
    client.get("https://graph.microsoft.com/v1.0/me/presence"),
    client.get("https://graph.microsoft.com/v1.0/me/photo/$value")
])
```

Or in SPFx context

``` Javascript
let spfxGraphClient = await this.context.aadHttpClientFactory.getClient('https://graph.microsoft.com');

let client = new BatchGraphClient(new SPFxGraphHttpClient(spfxGraphClient));

let [me, photo, presence] = await Promise.all([
    client.get("https://graph.microsoft.com/v1.0/me"),
    client.get("https://graph.microsoft.com/v1.0/me/presence"),
    client.get("https://graph.microsoft.com/v1.0/me/photo/$value")
])
```

In both cases all three request will be combined into one batch request. Thanks to this You will not have to think about batching ever again. It will just happen.

### BatchSPClient

In a very similar way You can use SPBatchClient to batch requests to SharePoint endpoints.
Let's consider SPFx scenario

``` Javascript
let spfxSPClient = new SPFxSPHttpClient(this.context.spHttpClient);

let client = new BatchSPClient(spfxSPClient, this.context.pageContext.web.absoluteUrl);

let [web, site] = await Promise.all([client.get("/_api/web").then(r => r.json()), client.get("/_api/site").then(r => r.json())]);

```

### SPFxGraphHttpClient

SPFxGraphHttpClient is a simple adapter converting AadHttpClient from @microsoft/sp-http to IHttpClient implementation from this library. One of the advantages of IHttpClient is You don't have to pass HttpClient.configurations.v1 everywhere.

### SPFxSPHttpClient

SPFxSPHttpClient serves the same purpose as SPFxGraphHttpClient but for calls to SharePoint in SPFx context.

## DataProviders

One of the most common task is to present some data in a list or table. Usually we need to implement pagination to that list to keep high performance. Under dataProviders folder You can find IPagedDataProvider interface which exposes methods required to implement pagination. Currently following classes implements that interface.

### SPListItemCamlPagedDataProvider

Under this complex name there is a logic to paginate list items of provided list. If You want to add filter - this class supports caml query.

``` Javascript
let spHttpClient = new SPFxSPHttpClient(this.context.spHttpClient);
let pagedProvider = new SPListItemCamlPagedDataProvider<any>(spHttpClient,"https://contoso.sharepoint.com/sites/tea-point","2fa2e9af-593b-4c89-b606-e174ded5b563");
pagedProvider.pageSize = 25;
pagedProvider.setQuery(`<Eq><FieldRef Name="Test" /><Value Type="Choice">Test 1</Value></Eq>`);
let data = await pagedProvider.getData();
let totalItemsCount = pagedProvider.allItemsCount;
if(pagedProvider.isNextPageAvailable()){
    let nextPage = await pagedProvider.getNextPage()
}
```

### GraphODataPagedDataProvider

GraphODataPagedDataProvider will allow You to easy paginate through resources exposed by MS Graph API
`
Note: Not all endpoints exposed by MS Graph API allow pagination. You can check if an endpoint allows pagination in Graph Explorer.
`
```Javascript
let spfxGraphClient = await this.context.aadHttpClientFactory.getClient('https://graph.microsoft.com');

let batchClient = new BatchGraphClient(new SPFxGraphHttpClient(spfxGraphClient));
let pagedProvider = new GraphODataPagedDataProvider<any>(batchClient, "https://graph.microsoft.com/v1.0/users");
pagedProvider.pageSize = 10;

let users = await pagedProvider.getData();
let allUsers = pagedProvider.allItemsCount;
if(pagedProvider.isNextPageAvailable()){
    let nextPage = await pagedProvider.getNextPage();
}
if(pagedProvider.isPreviousPageAvailable()){
    let previousPage = await pagedProvider.getPreviousPage();
}
```

## Utils

### FunctionUtils

#### useStorage
This is a function decorator that will handle caching. If You have a method that is time consuming and should be cached, this is the easiest way to do that.

```Javascript
class TestClassComputedKey {
		constructor(){

		}
		@useStorage("test-key-{0}")
		public getData(testArgument: string): Promise<string> {
			return Promise.resolve("data");
		}
	}
```

Now, the result of the first execution of method getData will be stored (by default in sessionStorage). Each next execution will just return value stored in sessionStorage.

`Note: this decorator works only with async methods
`