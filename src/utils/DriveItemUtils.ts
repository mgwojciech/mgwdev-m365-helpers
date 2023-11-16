export class DriveItemUtils {
    public static isEncoded(url: string): boolean {
        return decodeURI(url) !== url;
    }
    public static trimEndCharacter(url: string, trailingCharacter: string): string {
        if (!url || !trailingCharacter) {
            return url;
        }
        if (url.indexOf(trailingCharacter) === url.length - 1) {
            url = url.substring(0, url.length - trailingCharacter.length);
        }
        return url;
    }
    /**
     * Returns relative (starting with /v1.0/shares...) api url to the drive item
     * @param fileAbsoluteUrl - absolute url to the file. Must start with https://
     * @returns api url to the drive item
     */
    public static getFileSharesApiUri(fileAbsoluteUrl: string): string {
        if (!fileAbsoluteUrl) throw new Error("fileAbsoluteUrl is required");
        if (fileAbsoluteUrl.indexOf("https://") !== 0) throw new Error("fileAbsoluteUrl must start with https://");
        
        let encodeAbsoluteUrl = DriveItemUtils.isEncoded(fileAbsoluteUrl) ? fileAbsoluteUrl : encodeURI(fileAbsoluteUrl)
        let base64Url = btoa(encodeAbsoluteUrl);
        base64Url = DriveItemUtils.trimEndCharacter(base64Url, "=");
        let encodedShareId = `u!${base64Url.replace("/", "_").replace("+", "-")}`;
        return `/v1.0/shares/${encodedShareId}/driveItem`
    }
}