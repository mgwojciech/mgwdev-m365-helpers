
///<reference types="jest" />
import { InMemoryCacheService } from "../../../src/services";
import { CacheDriveItemService } from "../../../src/services/driveItem/CachedDriveItemService";

describe("CacheDriveItemService", () => {
    let baseService
    beforeEach(() => {
        baseService = {
            getDriveItemContent: jest.fn().mockReturnValue(Promise.resolve(new Blob(["Hello World!"], { type: 'text/plain' }))),
            getDriveItemContentById: jest.fn().mockReturnValue(Promise.resolve(new Blob(["Hello World!"], { type: 'text/plain' })))
        }
    })
    test("should get by absolute url with empty cache", async () => {
        const graphClient = {
            get: jest.fn()
        }

        const fileUrl = "https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx"
        const service = new CacheDriveItemService(graphClient as any, baseService);
        service.cacheKeyPrefix = "";
        service.cacheService = new InMemoryCacheService();
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                value: "testhash"
            })
        });

        const file = await service.getDriveItemContent(fileUrl);
        const fileText = await file.text();
        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledWith("/v1.0/shares/u!aHR0cHM6Ly90ZXN0LnNoYXJlcG9pbnQuY29tL3NpdGVzL3Rlc3Qtc2l0ZXMvc2hhcmVkJTIwZG9jdW1lbnRzL1Rlc3QlMjBGaWxlLmFzcHg/driveItem/file/hashes/quickXorHash")
        expect(service.cacheService.get<string>("https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx-hash")).toBe("testhash")
        expect(service.cacheService.get<string>("https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx-content")).toBe("data:text/plain;base64,SGVsbG8gV29ybGQh");
    });
    test("should get by absolute url from cache when hashes match", async () => {
        const graphClient = {
            get: jest.fn()
        }

        const fileUrl = "https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx"
        const service = new CacheDriveItemService(graphClient as any, baseService);
        service.cacheKeyPrefix = "";
        service.cacheService = new InMemoryCacheService();
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                value: "testhash"
            })
        });
        service.cacheService.set<string>("https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx-hash", "testhash")
        service.cacheService.set<string>("https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx-content", "data:text/plain;base64,SGVsbG8gV29ybGQh")

        const file = await service.getDriveItemContent(fileUrl);
        const fileText = await file.text();
        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledTimes(1);
        expect(baseService.getDriveItemContent).toBeCalledTimes(0);
    })
    test("should get by absolute url from base service when hashes doesn't match", async () => {
        const graphClient = {
            get: jest.fn()
        }

        const fileUrl = "https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx"
        const service = new CacheDriveItemService(graphClient as any, baseService);
        service.cacheKeyPrefix = "";
        service.cacheService = new InMemoryCacheService();
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                value: "testhash"
            })
        });
        service.cacheService.set<string>("https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx-hash", "oldcache")
        service.cacheService.set<string>("https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx-content", "data:text/plain;base64,asd")

        const file = await service.getDriveItemContent(fileUrl);
        const fileText = await file.text();
        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledTimes(1);
        expect(baseService.getDriveItemContent).toBeCalledTimes(1);
    })
    test("should get by id with empty cache", async () => {
        const graphClient = {
            get: jest.fn()
        }
        const driveId = "test-drive-id"
        const itemId = "test-item-id"
        const service = new CacheDriveItemService(graphClient as any, baseService);
        service.cacheKeyPrefix = "";
        service.cacheService = new InMemoryCacheService();
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                value: "testhash"
            })
        })

        const file = await service.getDriveItemContentById(driveId, itemId);
        const fileText = await file.text();
        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledWith("/v1.0/drives/test-drive-id/items/test-item-id/file/hashes/quickXorHash")
        expect(service.cacheService.get<string>("test-drive-id-test-item-id-hash")).toBe("testhash")
        expect(service.cacheService.get<string>("test-drive-id-test-item-id-content")).toBe("data:text/plain;base64,SGVsbG8gV29ybGQh");
    });
    test("should get by id from cache when hashes match", async () => {
        const graphClient = {
            get: jest.fn()
        }

        const driveId = "test-drive-id"
        const itemId = "test-item-id"
        const service = new CacheDriveItemService(graphClient as any, baseService);
        service.cacheKeyPrefix = "";
        service.cacheService = new InMemoryCacheService();
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                value: "testhash"
            })
        });
        service.cacheService.set<string>("test-drive-id-test-item-id-hash", "testhash")
        service.cacheService.set<string>("test-drive-id-test-item-id-content", "data:text/plain;base64,SGVsbG8gV29ybGQh")

        const file = await service.getDriveItemContentById(driveId, itemId);
        const fileText = await file.text();
        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledTimes(1);
        expect(baseService.getDriveItemContentById).toBeCalledTimes(0);
    });
    test("should get by id from base service when hashes doesn't match", async () => {
        const graphClient = {
            get: jest.fn()
        }

        const driveId = "test-drive-id"
        const itemId = "test-item-id"
        const service = new CacheDriveItemService(graphClient as any, baseService);
        service.cacheKeyPrefix = "";
        service.cacheService = new InMemoryCacheService();
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                value: "testhash"
            })
        });
        service.cacheService.set<string>("test-drive-id-test-item-id-hash", "oldcache")
        service.cacheService.set<string>("test-drive-id-test-item-id-content", "data:text/plain;base64,asd")

        const file = await service.getDriveItemContentById(driveId, itemId);
        const fileText = await file.text();
        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledTimes(1);
        expect(baseService.getDriveItemContentById).toBeCalledTimes(1);
        expect(service.cacheService.get<string>("test-drive-id-test-item-id-hash")).toBe("testhash")
        expect(service.cacheService.get<string>("test-drive-id-test-item-id-content")).toBe("data:text/plain;base64,SGVsbG8gV29ybGQh");
    })
});