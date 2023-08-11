///<reference types="jest"/>
import { IMockFileStructure, MockFileHttpClient } from "../../../src/dal/http/MockFileHttpClient";
import * as mock from "../../mocks/graph-proxy-mocks.json";

describe("MockFileHttpClient", () => {
    test("get Response", async () => {
        const mockFileHttpClient = new MockFileHttpClient(mock as IMockFileStructure);
        const response = await mockFileHttpClient.get("https://graph.microsoft.com/v1.0/me");
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("200");
        expect(response.headers["Content-type"]).toBe("application/json");
        expect(await response.json()).toEqual({
            "businessPhones": [
                "+1 425 555 0109"
            ],
            "displayName": "Adele Vance",
            "givenName": "Adele",
            "jobTitle": "Retail Manager",
            "mail": "AdeleV@contoso.onmicrosoft.com",
            "mobilePhone": "+1 425 555 0109",
            "officeLocation": "18/2111",
            "preferredLanguage": "en-US",
            "surname": "Vance",
            "userPrincipalName": "AdeleV@contoso.onmicrosoft.com",
            "id": "87d349ed-44d7-43e1-9a83-5f2406dee5bd"
        });
    });
    test("get Response with wildcard in mock", async () => {
        const mockFileHttpClient = new MockFileHttpClient(mock as IMockFileStructure);
        const response = await mockFileHttpClient.get("https://graph.microsoft.com/beta/sites/test-site-id/pages/test-page-id/microsoft.graph.sitePage/getWebPartsByPosition?isinverticalsection=true");
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("200");
        expect(response.headers["Content-Type"]).toBe("application/json");
        expect(await response.json()).toEqual({
            "value": [
                {
                    "@odata.type": "#microsoft.graph.textWebPart",
                    "id": "d79d70af-27ea-4208-8dce-23c3bf678664",
                    "innerHtml": "<h2>How do you get started?</h2>"
                }
            ]
        });
    });
    test("get Response with wildcard in mock no parameter", async () => {
        const mockFileHttpClient = new MockFileHttpClient(mock as IMockFileStructure);
        const response = await mockFileHttpClient.get("https://graph.microsoft.com/beta/sites/test-sites-id/pages/test-page-id/microsoft.graph.sitePage");
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("200");
        expect(await response.json()).toEqual({
            "@odata.type": "microsoft.graph.sitePage",
            "description": "Here's the page description",
            "id": "65e59907-59d5-44ff-a038-7c0bf3098c01",
            "name": "Home.aspx",
            "webUrl": "SitePages/Home.aspx",
            "title": "Organization Home",
            "thumbnailWebUrl": "https://cdn.hubblecontent.osi.office.net/m365content/publish/00210d24-bba0-42e6-9a31-1d452a95dd75/thumbnails/large.jpg?file=163352059.jpg",
            "promotionKind": "page",
            "pageLayout": "home",
            "showComments": true,
            "showRecommendedPages": false,
            "createdBy": {
              "user": {
                "displayName": "Rahul Mittal",
                "email": "rahmit@contoso.com"
              }
            },
            "lastModifiedBy": {
              "user": {
                "displayName": "Rahul Mittal",
                "email": "rahmit@contoso.com"
              }
            },
            "publishingState": {
              "level": "published",
              "versionId": "1.0"
            },
            "reactions": {
              "commentCount": 1
            }
          });
    });
});