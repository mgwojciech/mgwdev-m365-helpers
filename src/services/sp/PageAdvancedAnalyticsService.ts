import { IHttpClient } from "../../dal";
import { IDriveItemActivity } from "../../model/sharepoint/DriveItemAnalytics";

export class PageAdvancedAnalyticsService {
    constructor(protected httpClient: IHttpClient, protected siteUrl: string) {

    }

    public async getPageActivity(driveId: string, itemId: string, startDate: Date | undefined = undefined, endDate: Date | undefined = undefined, interval: string = "day"): Promise<IDriveItemActivity[]> {
        let start = startDate || new Date();
        if (!startDate) {
            start.setMonth(start.getMonth() - 1);
        }
        let end = endDate || new Date();
        const startDateString = start.toISOString();
        const endDateString = end.toISOString();
        const url = `${this.siteUrl}/_api/v2.0/drives/${driveId}/items/${itemId}/getActivitiesByInterval(startDateTime='${startDateString}',endDateTime='${endDateString}',interval='${interval}')`;
        const response = await this.httpClient.get(url);
        const data = await response.json();
        return data.value as IDriveItemActivity[];
    }
}