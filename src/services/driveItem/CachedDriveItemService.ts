import { IHttpClient } from "../../dal";
import { BlobUtils } from "../../utils/BlobUtils";
import { DriveItemUtils } from "../../utils/DriveItemUtils";
import { ICacheService, LocalStorageCacheService } from "../cache";
import { IDriveItemService } from "./IDriveItemService";

export class CacheDriveItemService implements IDriveItemService {
    public cacheService: ICacheService;
    public cacheKeyPrefix: string = "driveCache-";
    constructor(protected graphClient: IHttpClient, protected baseService: IDriveItemService) {
        this.cacheService = new LocalStorageCacheService();
    }
    public async getDriveItemContent(absoluteUrl: string): Promise<Blob> {
        const cacheKey = `${this.cacheKeyPrefix}${absoluteUrl}`
        const cachedHash = this.cacheService.get<string>(`${cacheKey}-hash`);
        if (!cachedHash) {
            const [file, hash] = await Promise.all([this.baseService.getDriveItemContent(absoluteUrl), this.checkDriveItemHash(absoluteUrl)]);
            this.cacheService.set<string>(`${cacheKey}-hash`, hash);
            this.cacheService.set<string>(`${cacheKey}-content`, await BlobUtils.blobToBase64(file))
            return file;
        }
        const fileHash = await this.checkDriveItemHash(absoluteUrl);
        if (cachedHash === fileHash) {
            return BlobUtils.base64ToBlob(this.cacheService.get<string>(`${cacheKey}-content`))
        }
        else {
            const file = await this.baseService.getDriveItemContent(absoluteUrl)
            this.cacheService.set<string>(`${cacheKey}-hash`, fileHash);
            this.cacheService.set<string>(`${cacheKey}-content`, await BlobUtils.blobToBase64(file))

            return file;
        }
    }
    public async getDriveItemContentById(driveId: string, itemId: string): Promise<Blob> {
        const cacheKey = `${this.cacheKeyPrefix}${driveId}-${itemId}`
        const cachedHash = this.cacheService.get<string>(`${cacheKey}-hash`);
        if (!cachedHash) {
            const [file, hash] = await Promise.all([this.baseService.getDriveItemContentById(driveId, itemId), this.checkDriveItemHashById(driveId, itemId)]);
            this.cacheService.set<string>(`${cacheKey}-hash`, hash);
            this.cacheService.set<string>(`${cacheKey}-content`, await BlobUtils.blobToBase64(file))
            return file;
        }
        const fileHash = await this.checkDriveItemHashById(driveId, itemId);
        if (cachedHash === fileHash) {
            return BlobUtils.base64ToBlob(this.cacheService.get<string>(`${cacheKey}-content`))
        }
        else {
            const file = await this.baseService.getDriveItemContentById(driveId, itemId)
            this.cacheService.set<string>(`${cacheKey}-hash`, fileHash);
            this.cacheService.set<string>(`${cacheKey}-content`, await BlobUtils.blobToBase64(file))

            return file;
        }
    }

    protected async checkDriveItemHash(absoluteUrl: string) {
        const apiUrl = DriveItemUtils.getFileSharesApiUri(absoluteUrl);
        const response = await this.graphClient.get(`${apiUrl}/file/hashes/quickXorHash`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const respJson = await response.json();
        return respJson.value;
    }
    protected async checkDriveItemHashById(driveId: string, itemId: string) {
        const apiUrl = `/v1.0/drives/${driveId}/items/${itemId}`;
        const response = await this.graphClient.get(`${apiUrl}/file/hashes/quickXorHash`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const respJson = await response.json();
        return respJson.value;
    }

}