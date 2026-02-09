import { IHttpClient } from "../../dal";
import { IDriveItemActivity } from "../../model/sharepoint/DriveItemAnalytics";

export class PageAdvancedAnalyticsService {
    constructor(protected httpClient: IHttpClient, protected siteUrl: string) {

    }

    public async getPageActivity(driveId: string, itemId: string, startDate: Date | undefined = undefined, endDate: Date | undefined = undefined, interval: string = "day"): Promise<IDriveItemActivity[]> {
        startDate = startDate || new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = endDate || new Date();
        const startDateString = startDate.toISOString();
        const endDateString = endDate.toISOString();
        const url = `${this.siteUrl}/_api/v2.0/drives/${driveId}/items/${itemId}/getActivitiesByInterval(startDateTime='${startDateString}',endDateTime='${endDateString}',interval='${interval}')`;
        const response = await this.httpClient.get(url);
        const data = await response.json();
        return data.value as IDriveItemActivity[];
    }
}