///<reference types="jest" />
import { DriveItemUtils } from "../../src/utils/DriveItemUtils";

describe("DriveItemUtils", () => {
    test("should get file shares api uri", () => {
        const fileAbsoluteUrl = "https://contoso.sharepoint.com/sites/site1/Shared%20Documents/Document.docx";
        const expectedApiUrl = "/v1.0/shares/u!aHR0cHM6Ly9jb250b3NvLnNoYXJlcG9pbnQuY29tL3NpdGVzL3NpdGUxL1NoYXJlZCUyMERvY3VtZW50cy9Eb2N1bWVudC5kb2N4/driveItem";
        const actualApiUrl = DriveItemUtils.getFileSharesApiUri(fileAbsoluteUrl);
        expect(actualApiUrl).toBe(expectedApiUrl);
    });
    test("should throw exception if fileAbsoluteUrl is not provided", () => {
        expect(() => {
            DriveItemUtils.getFileSharesApiUri("");
        }).toThrowError("fileAbsoluteUrl is required");
    });
    test("should throw exception if fileAbsoluteUrl does not start with https://", () => {
        expect(() => {
            DriveItemUtils.getFileSharesApiUri("http://contoso.sharepoint.com/sites/site1/Shared%20Documents/Document.docx");
        }).toThrowError("fileAbsoluteUrl must start with https://");
    });
    test("should trim trailing character", () => {
        const actual = DriveItemUtils.trimEndCharacter("test/", "/");
        expect(actual).toBe("test");
    });
    test("should not trim trailing character if it is not present", () => {
        const actual = DriveItemUtils.trimEndCharacter("test", "/");
        expect(actual).toBe("test");
    });
    test("should not trim trailing character if it is not provided", () => {
        const actual = DriveItemUtils.trimEndCharacter("test", "");
        expect(actual).toBe("test");
    });
    test("should return true if url is encoded", () => {
        const actual = DriveItemUtils.isEncoded("https://contoso.sharepoint.com/sites/site1/Shared%20Documents/Document.docx");
        expect(actual).toBe(true);
    });
    test("should return false if url is not encoded", () => {
        const actual = DriveItemUtils.isEncoded("https://contoso.sharepoint.com/sites/site1/Shared Documents/Document.docx");
        expect(actual).toBe(false);
    });
})