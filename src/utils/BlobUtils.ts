export class BlobUtils {
    public static async blobToBase64(blob: Blob): Promise<string> {
        const buffer = await blob.arrayBuffer();
        const binary = new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), "");
        const base64 = btoa(binary);
        return `data:${blob.type};base64,${base64}`;
    }
    public static base64ToBlob(value: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const valueInfo = value.indexOf(";base64") >= 0 ? value.split(";base64,") : ["application/octet-stream", value];
            const byteCharacters = atob(valueInfo[1]);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: valueInfo[0].replace("data:", "") });
            resolve(blob);
        });
    }
}