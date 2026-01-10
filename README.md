# MGWDEV M365 Helpers

A TypeScript helper library for M365 API communication (SharePoint, MS Graph, Dataverse). Works in both SPFx webparts and standalone applications (browser/Node.js).

## Installation

```bash
npm install mgwdev-m365-helpers
```

## Architecture Overview

The library is built around composable HTTP clients using the **decorator pattern**. All clients implement `IHttpClient`, allowing them to be wrapped and combined:

```
FetchHttpClient → AuthHttpClient → BatchGraphClient
     (base)          (adds auth)      (adds batching)
```

This design lets you:
- Use any combination of features by wrapping clients
- Create custom implementations (e.g., axios-based client)
- Swap authentication strategies without changing business logic

## Data Access Layer (DAL)

### IHttpClient Interface

All HTTP clients implement this interface:

```typescript
interface IHttpClient {
    get(url: string, options?: RequestInit): Promise<IHttpClientResponse>;
    post(url: string, options?: RequestInit): Promise<IHttpClientResponse>;
    patch(url: string, options?: RequestInit): Promise<IHttpClientResponse>;
    put(url: string, options?: RequestInit): Promise<IHttpClientResponse>;
    delete(url: string, options?: RequestInit): Promise<IHttpClientResponse>;
}
```

### FetchHttpClient

The base HTTP client wrapping the native `fetch` API. Optionally accepts a `baseUrl` for relative URL support.

```javascript
let client = new FetchHttpClient("https://api.example.com");
let response = await client.get("/endpoint"); // calls https://api.example.com/endpoint
```

### AuthHttpClient

Adds authentication to any base client. Requires an `IAuthenticationService` implementation.

```javascript
let baseClient = new FetchHttpClient();
let authService = new Msal2AuthenticationService({ clientId: "<client-id>" });

let client = new AuthHttpClient(authService, baseClient);
// Set resource URI if not MS Graph (default)
client.resourceUri = "https://your-dataverse.crm.dynamics.com";

let me = await client.get("https://graph.microsoft.com/v1.0/me");
```

### BatchGraphClient

Automatically batches concurrent GET/POST requests to MS Graph. Requests made within `batchWaitTime` (default 500ms) are combined into a single batch request. Batches split at `batchSplitThreshold` (default 15).

```javascript
let baseClient = new FetchHttpClient();
let authService = new Msal2AuthenticationService({ clientId: "<client-id>" });
let authClient = new AuthHttpClient(authService, baseClient);

let client = new BatchGraphClient(authClient);

// All three requests are automatically combined into one batch
let [me, presence, photo] = await Promise.all([
    client.get("https://graph.microsoft.com/v1.0/me"),
    client.get("https://graph.microsoft.com/v1.0/me/presence"),
    client.get("https://graph.microsoft.com/v1.0/me/photo/$value")
]);
```

**Features:**
- Automatic deduplication of identical GET requests
- Handles 429 (throttling) responses with automatic retry
- Separates v1.0 and beta requests into appropriate batch endpoints

### BatchSPClient

Automatic batching for SharePoint REST API calls.

```javascript
let authClient = new AuthHttpClient(authService, new FetchHttpClient());
let client = new BatchSPClient(authClient, "https://contoso.sharepoint.com/sites/mysite");

let [web, site] = await Promise.all([
    client.get("/_api/web").then(r => r.json()),
    client.get("/_api/site").then(r => r.json())
]);
```

### DataverseBatchClient

Automatic batching for Dataverse Web API calls.

```javascript
let authClient = new AuthHttpClient(authService, new FetchHttpClient());
authClient.resourceUri = "https://your-org.crm.dynamics.com";

let client = new DataverseBatchClient(
    authClient,
    "https://your-org.crm.dynamics.com",
    "/api/data/v9.2"  // optional, defaults to v9.2
);

let [accounts, contacts] = await Promise.all([
    client.get("/accounts?$top=10"),
    client.get("/contacts?$top=10")
]);
```

## SPFx Integration

For SPFx projects, import adapters directly from the source files to wrap SPFx's built-in HTTP clients:

```javascript
import { SPFxGraphHttpClient } from "mgwdev-m365-helpers/lib/dal/http/SPFxGraphHttpClient";
import { SPFxSPHttpClient } from "mgwdev-m365-helpers/lib/dal/http/SPFxSPHttpClient";
```

### SPFxGraphHttpClient

Adapts `AadHttpClient` from `@microsoft/sp-http` to `IHttpClient`.

```javascript
let spfxGraphClient = await this.context.aadHttpClientFactory.getClient('https://graph.microsoft.com');
let client = new BatchGraphClient(new SPFxGraphHttpClient(spfxGraphClient));

let [me, presence, photo] = await Promise.all([
    client.get("https://graph.microsoft.com/v1.0/me"),
    client.get("https://graph.microsoft.com/v1.0/me/presence"),
    client.get("https://graph.microsoft.com/v1.0/me/photo/$value")
]);
```

### SPFxSPHttpClient

Adapts `SPHttpClient` from `@microsoft/sp-http` to `IHttpClient`.

```javascript
let spfxSPClient = new SPFxSPHttpClient(this.context.spHttpClient);
let client = new BatchSPClient(spfxSPClient, this.context.pageContext.web.absoluteUrl);

let [web, site] = await Promise.all([
    client.get("/_api/web").then(r => r.json()),
    client.get("/_api/site").then(r => r.json())
]);
```

> **Note:** SPFx adapters are not exported from the main entry point to avoid SPFx dependency for non-SPFx consumers. Import them directly when needed.

## Data Providers

Standardized pagination interfaces for presenting data in lists/tables. All providers implement `IPagedDataProvider<T>`.

### IPagedDataProvider Interface

```typescript
interface IPagedDataProvider<T> {
    getData(): Promise<T[]>;           // Get first page, starts enumeration
    getNextPage(): Promise<T[]>;       // Get next page
    getPreviousPage(): Promise<T[]>;   // Get previous page
    isNextPageAvailable(): boolean;
    isPreviousPageAvailable(): boolean;
    setQuery(value: string);           // Set filter query
    setOrder(orderBy: string, orderDir: "ASC" | "DESC");
    allItemsCount: number;             // Total items matching query
    pageSize: number;                  // Items per page
}
```

### ODataPagedDataProvider

Generic OData pagination for any OData-compatible API.

```javascript
let provider = new ODataPagedDataProvider(
    httpClient,
    "https://graph.microsoft.com/v1.0/users"
);
provider.pageSize = 25;
provider.setQuery("startsWith(displayName,'A')");

let users = await provider.getData();
if (provider.isNextPageAvailable()) {
    let nextPage = await provider.getNextPage();
}
```

### GraphODataPagedDataProvider

MS Graph-specific pagination with proper OData handling.

```javascript
let batchClient = new BatchGraphClient(authClient);
let provider = new GraphODataPagedDataProvider(
    batchClient,
    "https://graph.microsoft.com/v1.0/users"
);
provider.pageSize = 10;

let users = await provider.getData();
console.log(`Total users: ${provider.allItemsCount}`);
```

> **Note:** Not all Graph endpoints support pagination. Check Graph Explorer for endpoint capabilities.

### SPListItemCamlPagedDataProvider

SharePoint list pagination with CAML query support.

```javascript
let provider = new SPListItemCamlPagedDataProvider(
    spHttpClient,
    "https://contoso.sharepoint.com/sites/mysite",
    "list-guid-here"
);
provider.pageSize = 25;
provider.setQuery(`<Eq><FieldRef Name="Status" /><Value Type="Choice">Active</Value></Eq>`);

let items = await provider.getData();
let totalItems = provider.allItemsCount;

if (provider.isNextPageAvailable()) {
    let nextPage = await provider.getNextPage();
}
```

### DataversePagedDataProvider

Dataverse table pagination with OData support.

```javascript
let provider = new DataversePagedDataProvider(
    dataverseClient,
    "https://your-org.crm.dynamics.com",
    "accounts"  // table name
);
provider.pageSize = 50;
provider.setQuery("statecode eq 0");

let accounts = await provider.getData();
```

## Authentication Services

The library provides `IAuthenticationService` implementations for different authentication scenarios.

### IAuthenticationService Interface

```typescript
interface IAuthenticationService {
    getAccessToken(resource: string): Promise<string>;
}
```

### Msal2AuthenticationService (Browser)

For browser-based applications using MSAL 2.x with interactive authentication.

```javascript
import { Msal2AuthenticationService } from "mgwdev-m365-helpers/lib/services/Msal2AuthenticationService";

let authService = new Msal2AuthenticationService({
    clientId: "<client-id>",
    tenantId: "<tenant-id>",      // optional, defaults to 'common'
    redirectUri: window.location.origin  // optional
}, true);  // usePopup = true (default)

let token = await authService.getAccessToken("https://graph.microsoft.com");
```

### NodeAppOnlyAuthenticationService (Node.js)

For Node.js applications using client credentials flow (app-only authentication).

```javascript
import { NodeAppOnlyAuthenticationService } from "mgwdev-m365-helpers/lib/services/NodeAppOnlyAuthenticationService";

let authService = new NodeAppOnlyAuthenticationService(
    "<client-id>",
    "<client-secret>",
    "<tenant-id>"
);

let token = await authService.getAccessToken("https://graph.microsoft.com");
```

> **Note:** Authentication services requiring MSAL are not exported from main entry to avoid dependency issues. Import directly when needed.

## Utils

### ArrayUtilities

Utility methods for array operations used throughout the library.

```javascript
// Split array into chunks (used for batch size limits)
ArrayUtilities.splitToMaxLength([1,2,3,4,5], 2); // [[1,2], [3,4], [5]]

// Get subset of Map by keys
ArrayUtilities.getSubMap(myMap, ['key1', 'key2']);
```

### FunctionUtils - @useStorage Decorator

Cache decorator for async methods. Results are stored in sessionStorage (by default).

```javascript
class MyService {
    @useStorage("user-{0}")  // {0} is replaced with first argument
    public async getUser(userId: string): Promise<User> {
        return await fetchUserFromApi(userId);
    }
}

// First call fetches from API and caches
// Subsequent calls return cached value
```

### TokenUtils

Utilities for working with Azure AD tokens.

```javascript
// Parse token payload
let tokenInfo = TokenUtils.getTokenInfo(accessToken);

// Check if token is still valid
let isValid = TokenUtils.isTokenValid(accessToken);
```

### ImageHelper

Methods for retrieving thumbnails and images from SharePoint/Graph.

```javascript
// Get thumbnail from Graph API
let thumbnail = await ImageHelper.getThumbnailImageFromMetadata(
    graphClient,
    siteId,
    webId,
    fileId,
    "medium"  // "small" | "medium" | "large"
);
```

More utilities documented in [utils.md](./src/utils/utils.md).

## Services

### CachedDriveItemService

Caches drive item contents using QuickXorHash for cache validation.

```javascript
let service = new CachedDriveItemService(graphClient);
let content = await service.getDriveItemContent("https://contoso.sharepoint.com/sites/docs/file.docx");
```

More services documented in [services.md](./src/services/services.md).

## Development

### Commands

```bash
npm install     # Install dependencies
npm test        # Run Jest tests
npm run build   # Build ESM (lib/) and CommonJS (lib-commonjs/)
```

### Project Structure

```
src/
├── dal/
│   ├── http/           # HTTP clients (IHttpClient implementations)
│   └── dataProviders/  # Paged data providers
├── services/           # Authentication and utility services
├── model/              # TypeScript interfaces
└── utils/              # Utility classes and helpers
```

### Dual Module Output

The library outputs both ES modules (`lib/`) and CommonJS (`lib-commonjs/`) for maximum compatibility:

```json
{
  "main": "lib-commonjs/index.js",   // CommonJS entry
  "module": "lib/index.js"           // ES module entry
}
```

## License

MIT