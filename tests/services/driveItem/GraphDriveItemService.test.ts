
///<reference types="jest" />
import { GraphDriveItemService } from "../../../src/services/driveItem/GraphDriveItemService";

//@ts-ignore
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    blob: jest.fn().mockResolvedValue(new Blob(["Hello World Redirected!"], { type: 'text/plain' }))
}))
describe("GraphDriveItemService", () => {
    test("should get by url", async () => {
        const graphClient = {
            get: jest.fn()
        }
        const fileUrl = "https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx"
        const service = new GraphDriveItemService(graphClient as any);
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            blob: jest.fn().mockResolvedValue(new Blob(["Hello World!"], { type: 'text/plain' }))
        });

        const file = await service.getDriveItemContent(fileUrl);
        const fileText = await file.text();

        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledWith("/v1.0/shares/u!aHR0cHM6Ly90ZXN0LnNoYXJlcG9pbnQuY29tL3NpdGVzL3Rlc3Qtc2l0ZXMvc2hhcmVkJTIwZG9jdW1lbnRzL1Rlc3QlMjBGaWxlLmFzcHg/driveItem/content");
    })
    test("should get by url with redirect", async () => {
        const graphClient = {
            get: jest.fn()
        }
        const fileUrl = "https://test.sharepoint.com/sites/test-sites/shared documents/Test File.aspx"
        const service = new GraphDriveItemService(graphClient as any);
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            status: 302,
            headers: {
                Location: "https://test.com/testfile.txt"
            }
        });

        const file = await service.getDriveItemContent(fileUrl);
        const fileText = await file.text();

        expect(fileText).toBe("Hello World Redirected!");
        expect(graphClient.get).toBeCalledWith("/v1.0/shares/u!aHR0cHM6Ly90ZXN0LnNoYXJlcG9pbnQuY29tL3NpdGVzL3Rlc3Qtc2l0ZXMvc2hhcmVkJTIwZG9jdW1lbnRzL1Rlc3QlMjBGaWxlLmFzcHg/driveItem/content");
    });
    test("should get file by ids", async () => {
        const graphClient = {
            get: jest.fn()
        }
        const driveId = "test-drive-id";
        const itemId = "test-item-id";

        const service = new GraphDriveItemService(graphClient as any);
        graphClient.get.mockResolvedValueOnce({
            ok: true,
            blob: jest.fn().mockResolvedValue(new Blob(["Hello World!"], { type: 'text/plain' }))
        });

        const file = await service.getDriveItemContentById(driveId, itemId);
        const fileText = await file.text();

        expect(fileText).toBe("Hello World!");
        expect(graphClient.get).toBeCalledWith("/v1.0/drives/test-drive-id/items/test-item-id/content");
    })
})