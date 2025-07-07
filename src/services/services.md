
# CachedDriveItemService

## Overview
This service implements the `IDriveItemService` interface and provides caching functionality for drive items.
This service is based on QuickXoR cache available via driveItem API in M365. 

## Dependencies

* `IHttpClient`: used to make HTTP requests to the Microsoft Graph API.
* `BlobUtils`: used to convert between Blobs and base64 encoded strings.
* `DriveItemUtils`: used to construct API URIs for file shares.
* `ICacheService` and `LocalStorageCacheService`: used to manage caching.

## Methods

### getDriveItemContent(absoluteUrl: string)
Returns the contents of a drive item at the specified absolute URL as a Blob.

#### Parameters
* `absoluteUrl`: The absolute URL of the drive item.

#### Returns
A Promise that resolves with the drive item's contents as a Blob.

#### Throws
If the request to the Microsoft Graph API fails, an error is thrown.

### getDriveItemContentById(driveId: string, itemId: string)
Returns the contents of a drive item identified by its ID and parent drive ID as a Blob.

#### Parameters
* `driveId`: The ID of the parent drive.
* `itemId`: The ID of the drive item.

#### Returns
A Promise that resolves with the drive item's contents as a Blob.

#### Throws
If the request to the Microsoft Graph API fails, an error is thrown.

### checkDriveItemHash(absoluteUrl: string)
Returns the quickXorHash for a file at the specified absolute URL.

#### Parameters
* `absoluteUrl`: The absolute URL of the file.

#### Returns
A Promise that resolves with the quickXorHash as a string.

### checkDriveItemHashById(driveId: string, itemId: string)
Returns the quickXorHash for a drive item identified by its ID and parent drive ID.

#### Parameters
* `driveId`: The ID of the parent drive.
* `itemId`: The ID of the drive item.

#### Returns
A Promise that resolves with the quickXorHash as a string.

## Cache Management

This service uses caching to store the contents and hashes of drive items. The cache is stored locally using the `LocalStorageCacheService` but can be overridden by passing in an instance of the `ICacheService` interface and assigining it to public `cacheService` field. When a request is made for a drive item, the service first checks the cache to see if the item's hash matches what is currently cached. If it does, the cached version is returned. Otherwise, a new request is made to the Microsoft Graph API and the result is cached. The file is stored as base64 encoded data, and the hash is obtained via API.

## Notes

* The cache key prefix is set to `"driveCache-"` to prevent collisions with other cached items It's configurable via property `cacheKeyPrefix`.
* The `getDriveItemContentById` method uses a different cache key than `getDriveItemContent`, as it is not possible to quickly map id to url.