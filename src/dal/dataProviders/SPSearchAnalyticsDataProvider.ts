import { SearchResultWithAnalytics } from "../../model/sharepoint/SearchResultWithAnalytics";
import { IHttpClient } from "../http/IHttpClient";
import { SPSearchDataProvider } from "./SPSearchDataProvider";


export class SearchAnalyticsProvider {
    protected searchDataProvider: SPSearchDataProvider<SearchResultWithAnalytics>
    constructor(protected spClient: IHttpClient, protected siteUrl: string) {
        this.searchDataProvider = new SPSearchDataProvider<SearchResultWithAnalytics>(this.siteUrl + "/_api/search/postquery", this.spClient, [
            "Title",
            "SiteTitle",
            "SiteName",
            "SiteId",
            "WebId",
            "ListId",
            "DriveId",
            "ListItemId",
            "NormUniqueId",
            "SPWebUrl",
            "ViewsLifeTime",
            "ViewsLifeTimeUniqueUsers",
            "ViewsLast1Day",
            "ViewsLast1DayUniqueUsers",
            "ViewsLast2Days",
            "ViewsLast2DaysUniqueUsers",
            "ViewsLast3Days",
            "ViewsLast3DaysUniqueUsers",
            "ViewsLast4Days",
            "ViewsLast4DaysUniqueUsers",
            "ViewsLast5Days",
            "ViewsLast5DaysUniqueUsers",
            "ViewsLast6Days",
            "ViewsLast6DaysUniqueUsers",
            "ViewsLast7Days",
            "ViewsLast7DaysUniqueUsers",
            "ViewsLastMonths1",
            "ViewsLastMonths1Unique",
            "ViewsLastMonths2",
            "ViewsLastMonths2Unique",
            "ViewsLastMonths3",
            "ViewsLastMonths3Unique",
            "Path",
            "LastModifiedTime",
            "Author",
            "FileExtension",
            "SPTranslationLanguage",
            "SPTranslatedLanguages",
            "CommentCount",
            "LikeCount"
        ], "{searchTerms} as IsDocument:1");
        this.searchDataProvider.setOrder("ViewsLifeTime", "ASC");
        this.searchDataProvider.pageSize = 500;
    }
    public async getSearchResultsWithAnalytics(searchTerm: string): Promise<SearchResultWithAnalytics[]> {
        this.searchDataProvider.setQuery(searchTerm);
        const results = await this.searchDataProvider.getData();
        // Parse string values to numbers for view fields
        return results.map(item => ({
            ...item,
            ViewsLifeTime: parseInt(String(item.ViewsLifeTime), 10) || 0,
            ViewsLifeTimeUniqueUsers: parseInt(String(item.ViewsLifeTimeUniqueUsers), 10) || 0,
            ViewsLast1Day: parseInt(String(item.ViewsLast1Day), 10) || 0,
            ViewsLast1DayUniqueUsers: parseInt(String(item.ViewsLast1DayUniqueUsers), 10) || 0,
            ViewsLast2Days: parseInt(String(item.ViewsLast2Days), 10) || 0,
            ViewsLast2DaysUniqueUsers: parseInt(String(item.ViewsLast2DaysUniqueUsers), 10) || 0,
            ViewsLast3Days: parseInt(String(item.ViewsLast3Days), 10) || 0,
            ViewsLast3DaysUniqueUsers: parseInt(String(item.ViewsLast3DaysUniqueUsers), 10) || 0,
            ViewsLast4Days: parseInt(String(item.ViewsLast4Days), 10) || 0,
            ViewsLast4DaysUniqueUsers: parseInt(String(item.ViewsLast4DaysUniqueUsers), 10) || 0,
            ViewsLast5Days: parseInt(String(item.ViewsLast5Days), 10) || 0,
            ViewsLast5DaysUniqueUsers: parseInt(String(item.ViewsLast5DaysUniqueUsers), 10) || 0,
            ViewsLast6Days: parseInt(String(item.ViewsLast6Days), 10) || 0,
            ViewsLast6DaysUniqueUsers: parseInt(String(item.ViewsLast6DaysUniqueUsers), 10) || 0,
            ViewsLast7Days: parseInt(String(item.ViewsLast7Days), 10) || 0,
            ViewsLast7DaysUniqueUsers: parseInt(String(item.ViewsLast7DaysUniqueUsers), 10) || 0,
            ViewsLastMonths1: parseInt(String(item.ViewsLastMonths1), 10) || 0,
            ViewsLastMonths1Unique: parseInt(String(item.ViewsLastMonths1Unique), 10) || 0,
            ViewsLastMonths2: parseInt(String(item.ViewsLastMonths2), 10) || 0,
            ViewsLastMonths2Unique: parseInt(String(item.ViewsLastMonths2Unique), 10) || 0,
            ViewsLastMonths3: parseInt(String(item.ViewsLastMonths3), 10) || 0,
            ViewsLastMonths3Unique: parseInt(String(item.ViewsLastMonths3Unique), 10) || 0,
            CommentCount: parseInt(String(item.CommentCount), 10) || 0,
            LikeCount: parseInt(String(item.LikeCount), 10) || 0,
        }));
    }
}