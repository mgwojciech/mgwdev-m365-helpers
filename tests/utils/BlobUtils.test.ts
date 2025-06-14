///<reference types="jest" />
import { BlobUtils } from "../../src/utils/BlobUtils";

describe('BlobUtils', () => {
    test('should convert blob to base64 correctly', async () => {
        const blob = new Blob(['Hello, world!'], { type: 'text/plain' });
        const result = await BlobUtils.blobToBase64(blob);
        expect(result.startsWith('data:text/plain;base64,')).toBe(true);
    });

    test('should convert base64 to blob correctly', async () => {
        const value = 'data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==';
        const result = await BlobUtils.base64ToBlob(value);
        expect(result.type).toBe("text/plain");
        const buffer = await result.text();
        expect(buffer).toBe("Hello, world!");
    });
    test('should convert base64 to blob correctly', async () => {
        const value = 'SGVsbG8sIHdvcmxkIQ==';
        const result = await BlobUtils.base64ToBlob(value);
        expect(result.type).toBe("application/octet-stream");
        const buffer = await result.text();
        expect(buffer).toBe("Hello, world!");
    });
});