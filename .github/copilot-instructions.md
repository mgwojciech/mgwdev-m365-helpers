# Copilot Instructions for mgwdev-m365-helpers

## Project Overview
TypeScript helper library for M365 API communication (SharePoint, MS Graph, Dataverse). Designed for both SPFx webparts and Node.js applications. Dual build output: ES modules (`lib/`) and CommonJS (`lib-commonjs/`).

## Architecture

### Core Pattern: Composable HTTP Clients
The library uses a **decorator pattern** for HTTP clients. All clients implement `IHttpClient`:
```typescript
interface IHttpClient {
  get(url: string, options?: RequestInit): Promise<IHttpClientResponse>;
  post/patch/put/delete...
}
```

**Layering pattern** (wrap clients to add functionality):
1. **Base**: `FetchHttpClient` - raw fetch wrapper
2. **Auth**: `AuthHttpClient` - adds token acquisition via `IAuthenticationService`
3. **Batching**: `BatchGraphClient`, `BatchSPClient`, `DataverseBatchClient` - auto-batch concurrent requests

Example composition: `BatchGraphClient(AuthHttpClient(FetchHttpClient))`

### Automatic Batching (Key Feature)
Batch clients collect GET/POST requests made within `batchWaitTime` (default 500ms) and combine into single batch request. Batches split at `batchSplitThreshold` (default 15). See [BatchGraphClient.ts](src/dal/http/BatchGraphClient.ts) for reference implementation.

### Data Providers for Pagination
`IPagedDataProvider<T>` interface standardizes pagination across data sources:
- `ODataPagedDataProvider` - Generic OData/Graph pagination
- `SPListItemCamlPagedDataProvider` - SharePoint CAML queries
- `GraphSearchPagedDataProvider` - MS Graph search API

## Key Directories
- `src/dal/http/` - HTTP clients (batching, auth, adapters)
- `src/dal/dataProviders/` - Paged data provider implementations
- `src/services/` - Authentication services (MSAL2, Node app-only)
- `src/utils/` - Utilities (ArrayUtilities, StringUtilities, query builders)
- `src/model/` - TypeScript interfaces

## Development Commands
```bash
npm test           # Run Jest tests
npm run build      # Build both ESM (lib/) and CommonJS (lib-commonjs/)
```

## Coding Conventions

### Exports
- Each folder has `index.ts` re-exporting public APIs
- Main entry: `src/index.ts` exports all modules

### Naming
- Interfaces: `I` prefix (`IHttpClient`, `IAuthenticationService`)
- HTTP clients: `*Client` suffix
- Data providers: `*DataProvider` suffix

### Testing
- Tests in `tests/` mirror `src/` structure
- Use mock clients implementing `IHttpClient` (see [BatchGraphClient.test.ts](tests/dal/http/BatchGraphClient.test.ts))
- `TestingUtilities.sleep()` for async timing tests

### HTTP Client Implementation
When creating new HTTP clients:
1. Implement `IHttpClient` interface
2. Accept `baseClient: IHttpClient` in constructor for composition
3. For batch clients: use `setTimeout` to collect requests, `ArrayUtilities.splitToMaxLength` for batch limits
4. Handle 429 throttling with retry logic (see `BatchHandler.maxRetries`)

### SPFx Adapters
`SPFxGraphHttpClient` and `SPFxSPHttpClient` wrap SPFx's built-in HTTP clients to `IHttpClient`. These are **not exported from main entry** to avoid SPFx dependency for non-SPFx consumers. For SPFx projects, import directly:
```typescript
import { SPFxGraphHttpClient } from "mgwdev-m365-helpers/lib/dal/http/SPFxGraphHttpClient";
import { SPFxSPHttpClient } from "mgwdev-m365-helpers/lib/dal/http/SPFxSPHttpClient";
```

## Common Patterns

### Adding a new batch client
Follow `DataverseBatchClient` pattern:
1. Collect requests in `batch: IBatch[]` array
2. Track promises in `registeredPromises` Map
3. Use `IdGenerator` for request IDs
4. Delegate to a `*BatchHandler` for execution and retry logic
