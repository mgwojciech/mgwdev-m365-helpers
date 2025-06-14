import { IHttpClient } from "../../dal";
import { DriveItemUtils } from "../../utils/DriveItemUtils";
import { IDriveItemService } from "./IDriveItemService";

export class GraphDriveItemService implements IDriveItemService {
    constructor(protected graphClient: IHttpClient) {

    }
    public async getDriveItemContentById(driveId: string, itemId: string): Promise<Blob> {
        return this.getItemContent(`/v1.0/drives/${driveId}/items/${itemId}`);
    }
    public async getDriveItemContent(absoluteUrl: string): Promise<Blob> {
        const apiUrl = DriveItemUtils.getFileSharesApiUri(absoluteUrl);
        return this.getItemContent(apiUrl);
    }
    protected async getItemContent(apiUrl: string){
        const result = await this.graphClient.get(`${apiUrl}/content`);
        if(result.status === 302){
            const redirectedResp = await fetch(result.headers.Location)
            return redirectedResp.blob();
        }
        if (!result.ok) {
            throw new Error(result.statusText);
        }
        return result.blob();
    }
}