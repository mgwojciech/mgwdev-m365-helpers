# DriveItemUtils Class
=====================================

The `DriveItemUtils` class provides static methods to perform various operations on drive item URLs.

### Methods

#### isEncoded(url: string)

Checks if the provided URL is already encoded.

*   **Returns**: `boolean`
*   **Parameters**:
    *   `url`: The URL to check (string)

#### trimEndCharacter(url: string, trailingCharacter: string)

Removes the specified character from the end of the URL.

*   **Returns**: The trimmed URL (string)
*   **Parameters**:
    *   `url`: The URL to trim (string)
    *   `trailingCharacter`: The character to remove (string)

#### getFileSharesApiUri(fileAbsoluteUrl: string)

Generates a relative API URL for the drive item from an absolute file URL.

*   **Returns**: The generated API URL (string)
*   **Parameters**:
    *   `fileAbsoluteUrl`: The absolute file URL (string)

### Notes

*   The `fileAbsoluteUrl` parameter must start with "https://".
*   If the `fileAbsoluteUrl` is already encoded, it will be used as-is.
*   The generated API URL is in the format `/v1.0/shares/<encodedShareId>/driveItem`.

# TokenUtils Class
=====================================

The `TokenUtils` class provides methods to handle Azure AD tokens.
### Methods

#### getTokenInfo(accessToken: string)

Parses and returns the token information from an access token.

*   **Returns**: `IAzureADToken`
*   **Parameters**:
    *   `accessToken`: The access token (string)

#### isTokenValid(accessToken: string)

Checks if a given access token has not yet expired.

*   **Returns**: `boolean`
*   **Parameters**:
    *   `accessToken`: The access token (string)
### Notes

*   This method uses the `btoa` function to decode the token payload.

# ImageHelper Class
=====================================

The `ImageHelper` class provides static methods for working with images in SharePoint.
### Methods

#### getFeatureImage(featureImage: {
    thumbnailRenderer: {
        sponsorToken: string;
        spItemUrl: string;
    }
}, spHttpClient: IHttpClient, size: number = 200)

Retrieves a feature image from the provided `featureImage` object and returns it as a base64-encoded string. This method assumes You already have sponsorToken available

*   **Returns**: The base64-encoded feature image (string)
*   **Parameters**:
    *   `featureImage`: The feature image object
    *   `spHttpClient`: The SharePoint HttpClient instance
    *   `size`: The desired size of the image (optional, default 200)

#### getThumbnailImageFromPreviewUrlWithGraph(graphClient: IHttpClient, previewUrl: string, size: "small" | "medium" | "large" = "medium")

Retrieves a thumbnail image from a preview URL using the Graph API. Will try to use getpreview.ashx and extract site,web,and file guids from the url.
Expected format of previewUrl is https://test.sharepoint.com/getpreview.ashx?guidSite=site-guid&guidWeb=web-guid&guidFile=file-guid

*   **Returns**: The base64-encoded thumbnail image (string)
*   **Parameters**:
    *   `graphClient`: The Graph HttpClient instance
    *   `previewUrl`: The preview URL to retrieve the thumbnail from
    *   `size`: The desired size of the thumbnail (optional, default "medium")

#### getThumbnailImageFromMetadata(graphClient: IHttpClient, siteId: string, webId: string, fileId: string, size: "small" | "medium" | "large" = "medium")

Retrieves a thumbnail image from metadata using the Graph API.

*   **Returns**: The base64-encoded thumbnail image (string)
*   **Parameters**:
    *   `graphClient`: The Graph HttpClient instance
    *   `siteId`: The site ID
    *   `webId`: The web ID
    *   `fileId`: The file ID
    *   `size`: The desired size of the thumbnail (optional, default "medium")

#### getThumbnailImageFromGraph(graphClient: IHttpClient, graphApiUrl: string)

Retrieves a thumbnail image from the Graph API.

*   **Returns**: The base64-encoded thumbnail image (string)
*   **Parameters**:
    *   `graphClient`: The Graph HttpClient instance
    *   `graphApiUrl`: The Graph API URL to retrieve the thumbnail from