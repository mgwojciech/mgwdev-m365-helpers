///<reference types="jest" />
import { IAggregationRequest, IFilterRequest } from "../../src/model";
import { SPApiQueryBuilder } from "../../src/utils/queryBuilders/SPApiQueryBuilder";

const siteUrl: string = "https://test.sharepoint.com/sites/test"
describe("SPApiQueryBuilder", ()=>{
    test("should build base query for web", ()=>{
        const builder = new SPApiQueryBuilder(siteUrl);
        const expected = "https://test.sharepoint.com/sites/test/_api/web"

        expect(expected).toBe(builder.build())
    })
    test("should build base query for site", ()=>{
        const builder = new SPApiQueryBuilder(siteUrl);
        const expected = "https://test.sharepoint.com/sites/test/_api/site"

        expect(expected).toBe(builder.withSite().build())
    })
    test("should build base query for site with version", ()=>{
        const builder = new SPApiQueryBuilder(siteUrl);
        const expected = "https://test.sharepoint.com/sites/test/_api/v2.1/site"

        expect(expected).toBe(builder.withApiVersion("v2.1").withSite().build())
    })
    test("should build url to get list by title", ()=>{
        const builder = new SPApiQueryBuilder(siteUrl);
        const expected = "https://test.sharepoint.com/sites/test/_api/web/lists/getByTitle('Test list title')"

        expect(expected).toBe(builder.withWeb().withListByTitle("Test list title").build())
    });
    test("should build url to get list by title", ()=>{
        const builder = new SPApiQueryBuilder(siteUrl);
        const expected = "https://test.sharepoint.com/sites/test/_api/web/lists(guid'test-id')"

        expect(expected).toBe(builder.withWeb().withListById("test-id").build())
    });
    test("should build url to get list by url", ()=>{
        const builder = new SPApiQueryBuilder(siteUrl);
        const expected = "https://test.sharepoint.com/sites/test/_api/web/GetList('/sites/test/SitePages')"

        expect(expected).toBe(builder.withWeb().withListByUrl("/sites/test/SitePages").build())
    });
})