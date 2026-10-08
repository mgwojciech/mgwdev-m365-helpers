---
name: mgwdev-m365-helpers
description: "Use when: consuming mgwdev-m365-helpers in a TypeScript app, using Graph/SharePoint clients, paging providers, auth wrappers, or Copilot services. Shows the library’s real usage patterns from the repo’s unit tests and common app integration flows."
---

# Consuming mgwdev-m365-helpers

## Purpose

Use this skill when you want to consume this library in application code rather than contribute to the library itself. The repo is a practical toolkit for Microsoft 365 integrations, not just raw HTTP clients. The parts that matter most for real usage are:

- HTTP clients and batching (`BatchGraphClient`, `BatchSPClient`, `AuthHttpClient`)
- authentication services (`Msal2AuthenticationService`, `MsalAuthenticationService`, and similar auth wrappers)
- query builders and search request builders (`SPSearchQueryBuilder`, Graph search patterns)
- paged data providers (`GraphSearchPagedDataProvider`, `ODataPagedDataProvider`, `DataversePagedDataProvider`, `SPListItemCamlPagedDataProvider`, SharePoint paging providers)
- feature services (`SearchInputSuggestionService`, `CopilotChatService`, `PageAdvancedAnalyticsService`)
- common model and utility helpers used across those flows

## What the library is good at

This package is useful when you need to:

- batch several Graph calls into one request
- attach bearer tokens automatically to outbound requests
- build SharePoint search queries consistently
- consume paged Graph or SharePoint data without manual nextLink logic
- use higher-level services for modern M365 scenarios like Copilot and search suggestions

## Core consumer patterns in this repo

### 1. Building an authenticated HTTP client

The repo’s composition pattern is based on an `IHttpClient` and an auth wrapper. The usual real-world consumer setup is to start with an app’s existing fetch client and wrap it with `AuthHttpClient`.

```ts
import { AuthHttpClient } from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const authenticatedGraphClient = new AuthHttpClient(auth as any, fetch as any);
const response = await authenticatedGraphClient.get("https://graph.microsoft.com/v1.0/me");
console.log(await response.json());
```

This is the main pattern for real app code: provide a token source and a fetch-based client, then let the auth wrapper add the `Authorization` header automatically.

### 2. Batching Graph calls

The repo’s tests show the expected usage directly in `tests/dal/http/BatchGraphClient.test.ts`:

```ts
import { AuthHttpClient, BatchGraphClient } from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const baseClient = new AuthHttpClient(auth as any, fetch as any);
const graph = new BatchGraphClient(baseClient);

const me = await graph.get("/me");
const groups = await graph.get("/me/groups");

console.log(await me.json());
console.log(await groups.json());
```

This is a good model for usage in an application: call the same Graph-like methods you expect from a normal client, but let the batch wrapper combine them.

### 3. Using higher-level service wrappers

The repo contains service abstractions beyond raw HTTP. A direct example is `CopilotChatService`.

```ts
import { AuthHttpClient, CopilotChatService } from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const graphClient = new AuthHttpClient(auth as any, fetch as any);
const chat = new CopilotChatService(graphClient);

await chat.initConversation();
```

This pattern is useful when the feature already has a known request/response shape and you want the library to handle the details for you.

### 4. Search suggestions built from query and data-provider patterns

The repo also includes `SearchInputSuggestionService` and a builder around `GraphSearchPagedDataProvider`, which is a good example of using search support classes in app logic.

```ts
import { AuthHttpClient, GraphSearchPagedDataProvider, SearchInputSuggestionService } from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const graphClient = new AuthHttpClient(auth as any, fetch as any);
const searchClient = new GraphSearchPagedDataProvider<any>(graphClient, ["listItem"], ["ID"]);
const suggestionService = new SearchInputSuggestionService(searchClient, ["Title", "Description", "Author"]);

const suggestions = await suggestionService.getSuggestions("Tit");
console.log(suggestions);
```

This shows the broader consumer pattern: services are often built on top of data providers and query logic, not directly on raw HTTP.

### 5. Building a CAML query and calling RenderListDataAsStream

For SharePoint list queries, the library includes `CamlQueryBuilder`. This is the pattern used by the SharePoint list data providers when they call `RenderListDataAsStream`.

```ts
import { AuthHttpClient, CamlQueryBuilder } from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const spClient = new AuthHttpClient(auth as any, fetch as any);
const listId = "{9F2D6C8F-8A9D-4E11-9C8E-1A2B3C4D5E6F}";

const caml = new CamlQueryBuilder()
  .withFieldQuery({
    name: "Status",
    type: "Text",
    comparer: "Eq",
    value: "Active",
  })
  .withFieldQuery(
    {
      name: "ProjectOwner",
      type: "Integer",
      comparer: "Eq",
      value: 42,
    },
    "And"
  )
  .build();

const response = await spClient.post(
  `https://contoso.sharepoint.com/sites/Projects/_api/web/lists('${listId}')/RenderListDataAsStream`,
  {
    headers: {
      accept: "application/json;odata=nometadata",
      "content-type": "application/json;odata=nometadata",
    },
    body: JSON.stringify({
      parameters: {
        RenderOptions: 2,
        ViewXml: `<View Scope="RecursiveAll"><Query><Where>${caml}</Where></Query></View>`,
      },
    }),
  }
);

if (response.ok) {
  const data = await response.json();
  console.log(data.Row ?? []);
}
```

This is the practical SharePoint pattern: build the CAML XML with `CamlQueryBuilder`, then post it as the body to the list’s `RenderListDataAsStream` endpoint.

### 6. Dataverse query building

The library also includes `DataverseQueryBuilder` for Dataverse-style OData filtering. It extends the standard OData builder but adds support for date comparison and `contains(...)` semantics.

```ts
import { AuthHttpClient, DataverseQueryBuilder } from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const dataverseClient = new AuthHttpClient(auth as any, fetch as any);

const query = new DataverseQueryBuilder()
  .withFieldQuery({
    name: "createdon",
    type: "DateTime",
    comparer: "Geq",
    value: "2024-01-01T00:00:00Z",
  })
  .withFieldQuery(
    {
      name: "statecode",
      type: "Integer",
      comparer: "Eq",
      value: 0,
    },
    "And"
  )
  .build();

const response = await dataverseClient.get(
  `https://contoso.crm.dynamics.com/api/data/v9.2/accounts?$filter=${encodeURIComponent(query)}`
);

if (response.ok) {
  const payload = await response.json();
  console.log(payload.value);
}
```

This is the pattern to use when you want a reusable query builder for Dataverse/OData filters instead of manually composing `$filter` strings.

### 7. Building SharePoint search queries with query builders

The repo exposes `SPSearchQueryBuilder`, which is one of the strong support utilities for SharePoint search use cases.

```ts
import { SPSearchQueryBuilder } from "mgwdev-m365-helpers";

const query = new SPSearchQueryBuilder()
  .withSearchQuery("project status")
  .withTemplateQuery("{searchTerms}")
  .withFilters({ field: "contentclass", filterValue: "STS_Site" })
  .build();

console.log(query);
```

This is a good example of how the library helps consumers structure advanced SharePoint search requests without manually constructing query JSON.

### 8. Paged data providers and their concrete implementations

The repo defines the `IPagedDataProvider<T>` contract, and several concrete implementations satisfy it for different Microsoft 365 APIs. Two especially important ones are `DataversePagedDataProvider` for Dataverse/OData list retrieval and `SPListItemCamlPagedDataProvider` for SharePoint list results using `RenderListDataAsStream`.

That is the pattern to use when you want reusable paging logic without rewriting `nextLink` or `$skip` handling in every feature.

```ts
import {
  AuthHttpClient,
  ODataPagedDataProvider,
  GraphSearchPagedDataProvider,
  DataversePagedDataProvider,
  SPListItemCamlPagedDataProvider,
} from "mgwdev-m365-helpers";

const auth = {
  getAccessToken: async () => "token-from-your-auth-flow",
};

const client = new AuthHttpClient(auth as any, fetch as any);

const users = new ODataPagedDataProvider<any>(
  client,
  "https://graph.microsoft.com/v1.0/users",
  false,
  "",
  "id,displayName,mail"
);
users.setOrder("displayName", "ASC");
users.setQuery("accountEnabled eq true");
const firstPage = await users.getData();

const search = new GraphSearchPagedDataProvider<any>(client, ["listItem"], ["title", "url"]);
search.setQuery("Project AND status");
const hits = await search.getData();

const accounts = new DataversePagedDataProvider<any>(
  client,
  "https://contoso.crm.dynamics.com/api/data/v9.2/accounts",
  ["name", "statecode", "createdon"]
);
accounts.setQuery("statecode eq 0");
const accountPage = await accounts.getData();

const listItems = new SPListItemCamlPagedDataProvider<any>(
  client,
  "https://contoso.sharepoint.com/sites/Projects",
  "{LIST-ID}",
  ["ID", "Title", "Status"]
);
listItems.setQuery("<Eq><FieldRef Name='Status'/><Value Type='Text'>Active</Value></Eq>");
const items = await listItems.getData();
```

The concrete implementations follow the same usage pattern:

- `ODataPagedDataProvider` for Graph/OData resources with `$filter`, `$orderby`, `$top`, and continuation links
- `GraphSearchPagedDataProvider` for Microsoft Graph Search results, including search query strings and aggregations
- `DataversePagedDataProvider` for Dataverse/OData resources, including `$filter`-based paging and `@odata.nextLink` handling
- `SPListItemCamlPagedDataProvider` for SharePoint list queries using `RenderListDataAsStream` and CAML `Where` clauses

This is the library’s general pattern for reusable paging: the consumer works against a provider instance and lets the implementation handle the API-specific details.

### 9. Using auth services in the usual app flow

The repo includes authentication service implementations for app scenarios where token acquisition is handled through a configured auth layer rather than raw fetch calls.

The important consumer pattern is that the auth service is treated as a dependency and plugged into `AuthHttpClient`; the library then handles the token injection for outbound requests.

## Typical app flow

A common real-world flow in this repo looks like this:

1. Choose an auth service and create a token-aware client
2. Wrap that client with `AuthHttpClient` or use a batch-enabled Graph client
3. Build/search through provider or query-builder classes when the API is paged or query-driven
4. Use a feature service such as `SearchInputSuggestionService` or `CopilotChatService` for higher-level operations
5. Keep the request shape and results aligned with the repo’s tested patterns

## When to use each layer

### Use `AuthHttpClient` or a batch-enabled client when

- you need authenticated Graph/SharePoint HTTP requests
- you want to reduce request count with batching
- you prefer to work with a familiar fetch-style interface

### Use `CamlQueryBuilder` when

- you are building SharePoint list filters for `RenderListDataAsStream`
- you want to express list conditions in a structured CAML query
- you need a reusable way to build `Where` clauses for list queries

### Use `DataverseQueryBuilder` when

- you are building Dataverse/OData `$filter` conditions
- you need date or `contains(...)` handling in a reusable builder
- you want to avoid manual string assembly for multi-part filters

### Use `SPSearchQueryBuilder` when

- you are constructing SharePoint search payloads
- you need refinement filters or query templates
- the search shape is complex but repeatable

### Use a provider when

- you need pagination
- the API returns `value` collections or continuation links
- you want a reusable abstraction instead of custom `nextLink` parsing

### Use a feature service when

- the library already packages best practices for a scenario
- you are working with Copilot, search suggestion flows, or a platform feature abstraction
- you want the repo’s tested request handling without implementing it yourself

## App integration checklist

Before wiring the library into a production app, confirm:

- your auth boundary is clear and token acquisition is handled before requests
- batching is only used when multiple Graph calls are related
- query builders are used for complex SharePoint search requests instead of ad hoc strings
- provider classes are used when pagination matters
- high-level services are reused where they already encapsulate the domain logic

## Example prompts

- “How do I use `AuthHttpClient` with a custom app-only auth flow?”
- “Show me the right way to build a SharePoint CAML query with `CamlQueryBuilder` and post it to `RenderListDataAsStream`.”
- “How do I build a Dataverse `$filter` with `DataverseQueryBuilder`?”
- “Show me the right way to build a SharePoint search query with `SPSearchQueryBuilder`.”
- “Which support service should I use for search suggestions in this library?”
- “How do I combine auth, batching, and providers in one Graph call flow?”
- “What are the repo’s common patterns for consuming services and utilities outside the HTTP layer?”

## Related repo references

- `src/dal/http/AuthHttpClient.ts`
- `src/dal/http/BatchGraphClient.ts`
- `src/utils/queryBuilders/CamlQueryBuilder.ts`
- `src/utils/queryBuilders/DataverseQueryBuilder.ts`
- `src/dal/dataProviders/DataversePagedDataProvider.ts` (`DataversePagedDataProvider`)
- `src/dal/dataProviders/SPListItemCamlPagedDataProvider.ts` (`SPListItemCamlPagedDataProvider`)
- `src/services/NodeAppOnlyAuthenticationService.ts`
- `src/utils/SPSearchQueryBuilder.ts`
- `src/services/SearchInputSuggestionService.ts`
- `src/services/copilot/CopilotChatService.ts`
- `tests/dal/http/BatchGraphClient.test.ts`
- `tests/services/copilot/CopilotChatService.test.ts`

The best way to consume this library is to treat it as a layered toolkit: auth services for identity, query builders and providers for search and pagination, and feature services for domain-specific flows. That combination is what makes the library practical for real M365 applications.
