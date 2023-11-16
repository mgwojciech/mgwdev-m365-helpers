import { IHttpClient } from "../dal/http/IHttpClient";
import { DriveItemUtils } from "./DriveItemUtils";

export class ImageHelper {
    public static async getFeatureImage(featureImage: {
        thumbnailRenderer: {
            sponsorToken: string;
            spItemUrl: string;
        }
    }, spHttpClient: IHttpClient, size: number = 200) {
        if (featureImage == null) return null;
        const url = `${featureImage.thumbnailRenderer.spItemUrl}/thumbnails/0/c${size}x${size}/content?prefer=noredirect&cb=1&s=${featureImage.thumbnailRenderer.sponsorToken}`;

        const response = await spHttpClient.get(url);
        //@ts-ignore
        const binaryData = await response.arrayBuffer()
        let base64String = Buffer.from(
            new Uint8Array(binaryData)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        ).toString('base64');

        return "data:image/jpeg;base64," + base64String;
    }
    public static async getThumbnailImageFromPreviewUrlWithGraph(graphClient: IHttpClient, previewUrl: string, size: "small" | "medium" | "large" = "medium") {
        if (!previewUrl) return null;
        if (previewUrl.indexOf("getpreview.ashx") < 0) return previewUrl;
        const url = new URL(previewUrl);
        if (previewUrl.indexOf("?path=") >= 0) {
            const path = url.searchParams.get("path");
            const absolutePath = url.origin + path;
            const shareUrl = DriveItemUtils.getFileSharesApiUri(absolutePath);
            const graphApiUrl = `${shareUrl}/thumbnails/0/${size}/content`;
            return ImageHelper.getThumbnailImageFromGraph(graphClient, graphApiUrl);
        }
        const guidSite = url.searchParams.get("guidSite");
        const guidWeb = url.searchParams.get("guidWeb");
        const guidFile = url.searchParams.get("guidFile");


        return ImageHelper.getThumbnailImageFromMetadata(graphClient, guidSite, guidWeb, guidFile, size);
    }

    public static async getThumbnailImageFromMetadata(graphClient: IHttpClient, siteId: string, webId: string, fileId: string, size: "small" | "medium" | "large" = "medium") {
        const graphApiUrl = `https://graph.microsoft.com/beta/sites/${siteId}/sites/${webId}/items/${fileId}/microsoft.graph.listitem/driveItem/thumbnails/0/${size}/content`;
        return ImageHelper.getThumbnailImageFromGraph(graphClient, graphApiUrl);
    }

    protected static async getThumbnailImageFromGraph(graphClient: IHttpClient, graphApiUrl: string) {
        const response = await graphClient.get(graphApiUrl);
        if (response.headers["content-type"] === "application/json") {
            const binaryData = await response.text()

            return "data:image/png;base64," + binaryData.replace("\"", "").replace("\"", "");
        }
        if (response.status === 302) {
            return response.headers["Location"];
        }
        //@ts-ignore
        const binaryData = await response.arrayBuffer()
        let base64String = Buffer.from(
            new Uint8Array(binaryData)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        ).toString('base64');

        return `data:image/jpeg;base64,${base64String}`;
    }
}