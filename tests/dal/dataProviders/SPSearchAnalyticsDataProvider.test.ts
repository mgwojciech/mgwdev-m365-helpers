///<reference types="jest" />
import { SearchAnalyticsProvider } from "../../../src/dal/dataProviders/SPSearchAnalyticsDataProvider";
import { IHttpClient } from "../../../src/dal/http/IHttpClient";

describe("SearchAnalyticsProvider", () => {
    const siteUrl = "https://test.sharepoint.com/sites/test";

    const createMockHttpClient = (mockResults: any[] = []): IHttpClient => {
        return {
            post: jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    PrimaryQueryResult: {
                        RelevantResults: {
                            Table: {
                                Rows: mockResults.map(result => ({
                                    Cells: Object.entries(result).map(([key, value]) => ({
                                        Key: key,
                                        Value: value
                                    }))
                                }))
                            },
                            TotalRows: mockResults.length
                        }
                    }
                }),
                text: jest.fn().mockResolvedValue("")
            })
        } as unknown as IHttpClient;
    };

    test("should initialize with correct search API URL", async () => {
        const mockClient = createMockHttpClient();
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        await provider.getSearchResultsWithAnalytics("test");

        expect(mockClient.post).toHaveBeenCalledWith(
            `${siteUrl}/_api/search/postquery`,
            expect.anything()
        );
    });

    test("should search with provided search term", async () => {
        const mockClient = createMockHttpClient();
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        await provider.getSearchResultsWithAnalytics("my search term");

        expect(mockClient.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining("my search term")
            })
        );
    });

    test("should parse string view values to numbers", async () => {
        const mockResults = [{
            Title: "Test Document",
            SiteTitle: "Test Site",
            ViewsLifeTime: "150",
            ViewsLifeTimeUniqueUsers: "25",
            ViewsLast1Day: "10",
            ViewsLast1DayUniqueUsers: "5",
            ViewsLast7Days: "50",
            ViewsLast7DaysUniqueUsers: "15",
            ViewsLastMonths1: "100",
            ViewsLastMonths1Unique: "20",
            CommentCount: "3",
            LikeCount: "7"
        }];
        const mockClient = createMockHttpClient(mockResults);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("test");

        expect(results).toHaveLength(1);
        expect(results[0].ViewsLifeTime).toBe(150);
        expect(results[0].ViewsLifeTimeUniqueUsers).toBe(25);
        expect(results[0].ViewsLast1Day).toBe(10);
        expect(results[0].ViewsLast1DayUniqueUsers).toBe(5);
        expect(results[0].ViewsLast7Days).toBe(50);
        expect(results[0].ViewsLast7DaysUniqueUsers).toBe(15);
        expect(results[0].ViewsLastMonths1).toBe(100);
        expect(results[0].ViewsLastMonths1Unique).toBe(20);
        expect(results[0].CommentCount).toBe(3);
        expect(results[0].LikeCount).toBe(7);
    });

    test("should handle null or undefined view values as 0", async () => {
        const mockResults = [{
            Title: "Test Document",
            ViewsLifeTime: null,
            ViewsLifeTimeUniqueUsers: undefined,
            ViewsLast1Day: "",
            CommentCount: "NaN",
            LikeCount: null
        }];
        const mockClient = createMockHttpClient(mockResults);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("test");

        expect(results[0].ViewsLifeTime).toBe(0);
        expect(results[0].ViewsLifeTimeUniqueUsers).toBe(0);
        expect(results[0].ViewsLast1Day).toBe(0);
        expect(results[0].CommentCount).toBe(0);
        expect(results[0].LikeCount).toBe(0);
    });

    test("should preserve non-numeric fields", async () => {
        const mockResults = [{
            Title: "My Document",
            SiteTitle: "Marketing Site",
            SiteName: "marketing",
            Path: "https://test.sharepoint.com/sites/marketing/Shared Documents/doc.docx",
            Author: "John Doe",
            FileExtension: "docx",
            LastModifiedTime: "2025-01-15T10:30:00Z",
            SPWebUrl: "https://test.sharepoint.com/sites/marketing",
            ViewsLifeTime: "100"
        }];
        const mockClient = createMockHttpClient(mockResults);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("test");

        expect(results[0].Title).toBe("My Document");
        expect(results[0].SiteTitle).toBe("Marketing Site");
        expect(results[0].SiteName).toBe("marketing");
        expect(results[0].Path).toBe("https://test.sharepoint.com/sites/marketing/Shared Documents/doc.docx");
        expect(results[0].Author).toBe("John Doe");
        expect(results[0].FileExtension).toBe("docx");
        expect(results[0].LastModifiedTime).toBe("2025-01-15T10:30:00Z");
        expect(results[0].SPWebUrl).toBe("https://test.sharepoint.com/sites/marketing");
    });

    test("should handle empty results", async () => {
        const mockClient = createMockHttpClient([]);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("nonexistent");

        expect(results).toEqual([]);
    });

    test("should return multiple results", async () => {
        const mockResults = [
            { Title: "Document 1", ViewsLifeTime: "100", CommentCount: "5", LikeCount: "10" },
            { Title: "Document 2", ViewsLifeTime: "200", CommentCount: "3", LikeCount: "8" },
            { Title: "Document 3", ViewsLifeTime: "50", CommentCount: "1", LikeCount: "2" }
        ];
        const mockClient = createMockHttpClient(mockResults);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("documents");

        expect(results).toHaveLength(3);
        expect(results[0].Title).toBe("Document 1");
        expect(results[0].ViewsLifeTime).toBe(100);
        expect(results[1].Title).toBe("Document 2");
        expect(results[1].ViewsLifeTime).toBe(200);
        expect(results[2].Title).toBe("Document 3");
        expect(results[2].ViewsLifeTime).toBe(50);
    });

    test("should parse all day-based view fields correctly", async () => {
        const mockResults = [{
            Title: "Test",
            ViewsLast2Days: "20",
            ViewsLast2DaysUniqueUsers: "8",
            ViewsLast3Days: "30",
            ViewsLast3DaysUniqueUsers: "12",
            ViewsLast4Days: "40",
            ViewsLast4DaysUniqueUsers: "16",
            ViewsLast5Days: "50",
            ViewsLast5DaysUniqueUsers: "20",
            ViewsLast6Days: "60",
            ViewsLast6DaysUniqueUsers: "24"
        }];
        const mockClient = createMockHttpClient(mockResults);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("test");

        expect(results[0].ViewsLast2Days).toBe(20);
        expect(results[0].ViewsLast2DaysUniqueUsers).toBe(8);
        expect(results[0].ViewsLast3Days).toBe(30);
        expect(results[0].ViewsLast3DaysUniqueUsers).toBe(12);
        expect(results[0].ViewsLast4Days).toBe(40);
        expect(results[0].ViewsLast4DaysUniqueUsers).toBe(16);
        expect(results[0].ViewsLast5Days).toBe(50);
        expect(results[0].ViewsLast5DaysUniqueUsers).toBe(20);
        expect(results[0].ViewsLast6Days).toBe(60);
        expect(results[0].ViewsLast6DaysUniqueUsers).toBe(24);
    });

    test("should parse all month-based view fields correctly", async () => {
        const mockResults = [{
            Title: "Test",
            ViewsLastMonths2: "500",
            ViewsLastMonths2Unique: "100",
            ViewsLastMonths3: "750",
            ViewsLastMonths3Unique: "150"
        }];
        const mockClient = createMockHttpClient(mockResults);
        const provider = new SearchAnalyticsProvider(mockClient, siteUrl);

        const results = await provider.getSearchResultsWithAnalytics("test");

        expect(results[0].ViewsLastMonths2).toBe(500);
        expect(results[0].ViewsLastMonths2Unique).toBe(100);
        expect(results[0].ViewsLastMonths3).toBe(750);
        expect(results[0].ViewsLastMonths3Unique).toBe(150);
    });
});
