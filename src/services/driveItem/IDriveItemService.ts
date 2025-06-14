export interface IDriveItemService{
    getDriveItemContent(absoluteUrl: string): Promise<Blob>;
    getDriveItemContentById(driveId: string, itemId: string): Promise<Blob>;
}