///<reference types="jest" />
import { ImageHelper } from "../../src/utils/ImageHelper";
import { IHttpClient } from "../../src/dal/http/IHttpClient";

describe("ImageHelper", () => {
    const mockHttpClient: IHttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        put: jest.fn(),
        delete: jest.fn()
    }
    test("getThumbnailImageFromPreviewUrlWithGraph should return null if previewUrl is null", async () => {
        const result = await ImageHelper.getThumbnailImageFromPreviewUrlWithGraph(mockHttpClient, "");
        expect(result).toBeNull();
    });
    test("getThumbnailImageFromPreviewUrlWithGraph should return previewUrl if previewUrl is not a getpreview.ashx url", async () => {
        const result = await ImageHelper.getThumbnailImageFromPreviewUrlWithGraph(mockHttpClient, "https://somedomain.com/someimage.png");
        expect(result).toBe("https://somedomain.com/someimage.png");
    });
    test("getThumbnailImageFromPreviewUrlWithGraph should return previewUrl if response is not a 302", async () => {
        mockHttpClient.get = jest.fn().mockImplementation(() => {
            return Promise.resolve({
                headers: {
                    "content-type": "application/json"
                },
                text: () => Promise.resolve("somebase64string")
            });
        });
        const result = await ImageHelper.getThumbnailImageFromPreviewUrlWithGraph(mockHttpClient, "https://somedomain.com/getpreview.ashx?guidSite=123&guidWeb=456&guidFile=789");
        expect(result).toBe("data:image/png;base64,somebase64string");
    });
    test("getThumbnailImageFromPreviewUrlWithGraph should return previewUrl if response is 302", async () => {
        mockHttpClient.get = jest.fn().mockImplementation(() => {
            return Promise.resolve({
                status: 302,
                headers: {
                    "Location": "https://somedomain.com/someimage.png"
                }
            });
        });
        const result = await ImageHelper.getThumbnailImageFromPreviewUrlWithGraph(mockHttpClient, "https://somedomain.com/getpreview.ashx?guidSite=123&guidWeb=456&guidFile=789");
        expect(result).toBe("https://somedomain.com/someimage.png");
    });
    test("getThumbnailImageFromPreviewUrlWithGraph should return previewUrl if response is byte array", async () => {
        mockHttpClient.get = jest.fn().mockImplementation(() => {
            return Promise.resolve({
                status: 200,
                headers: {
                    "content-type": "image/jpeg"
                },
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
            });
        });
        const result = await ImageHelper.getThumbnailImageFromPreviewUrlWithGraph(mockHttpClient, "https://somedomain.com/getpreview.ashx?guidSite=123&guidWeb=456&guidFile=789");
        expect(result).toBe("data:image/jpeg;base64,AAAAAAAAAAA=");
    });
    test("getThumbnailImageFromPreviewUrlWithGraph should build correct url", async () => {
        mockHttpClient.get = jest.fn().mockImplementation(() => {
            return Promise.resolve({
                status: 200,
                headers: {
                    "content-type": "image/jpeg"
                },
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
            });
        });
        const result = await ImageHelper.getThumbnailImageFromPreviewUrlWithGraph(mockHttpClient, "https://somedomain.com/getpreview.ashx?guidSite=123&guidWeb=456&guidFile=789");
        expect(mockHttpClient.get).toBeCalledWith("https://graph.microsoft.com/beta/sites/123/sites/456/items/789/microsoft.graph.listitem/driveItem/thumbnails/0/medium/content");
    });
});