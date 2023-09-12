///<reference types="jest" />
import { GraphSearchPagedDataProvider } from "../../../src/dal/dataProviders/GraphSearchPagedDataProvider";

describe("GraphSearchPagedDataProvider", () => {
    const response = {
        value: [
            {
                hitsContainers: [
                    {
                        hits: [
                            {
                                hitId: "1",
                                rank: 1,
                                summary: "",
                                resource: {
                                    fields: [{
                                        id: "test-id-1",
                                        title: "Test 1"
                                    }]
                                }
                            }
                        ],
                        total: 133,
                        moreResultsAvailable: true
                    }
                ]
            }
        ]
    };

    test("should call correct query", async () => {
        let mockGraphClient = {
            post: () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(response)
            })
        };
        let postSpy = jest.spyOn(mockGraphClient, "post");
        let dataProvider = new GraphSearchPagedDataProvider<any>(mockGraphClient as any);
        await dataProvider.getData();

        //@ts-ignore
        let callOptions: any = postSpy.mock.calls[0][1];
        let callBody = JSON.parse(callOptions.body);

        expect(callBody.requests[0].entityTypes).toMatchObject(["listItem"]);
        expect(callBody.requests[0].query.queryString).toBe("*");
        expect(callBody.requests[0].fields).toMatchObject(["id", "title", "url"]);
        expect(dataProvider.allItemsCount).toBe(133);
        expect(dataProvider.isNextPageAvailable()).toBeTruthy();
        expect(dataProvider.isPreviousPageAvailable()).toBeFalsy();
        expect(dataProvider.getCurrentPage()).toBe(0);

        expect(callBody.requests[0].from).toBe(0);
        expect(callBody.requests[0].to).toBe(25);
    });
    test("should call correct query with query and order", async () => {
        let mockGraphClient = {
            post: () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(response)
            })
        };
        let postSpy = jest.spyOn(mockGraphClient, "post");
        let dataProvider = new GraphSearchPagedDataProvider<any>(mockGraphClient as any);
        dataProvider.setQuery("test");
        dataProvider.setOrder("TestColumn", "ASC");
        await dataProvider.getData();

        //@ts-ignore
        let callOptions: any = postSpy.mock.calls[0][1];
        let callBody = JSON.parse(callOptions.body);

        expect(callBody.requests[0].entityTypes).toMatchObject(["listItem"]);
        expect(callBody.requests[0].query.queryString).toBe("test");
        expect(callBody.requests[0].fields).toMatchObject(["id", "title", "url"]);
        expect(callBody.requests[0].sortProperties[0]).toMatchObject({
            name: "TestColumn",
            isDescending: false
        });
    });
    test("should throw http exception", async () => {
        let mockGraphClient = {
            post: () => Promise.resolve({
                ok: true,
            })
        };
        let dataProvider = new GraphSearchPagedDataProvider<any>(mockGraphClient as any);
        jest.spyOn(mockGraphClient, "post").mockImplementation(() => {
            return Promise.resolve({ ok: false, text: () => Promise.resolve("Some exception") });
        });

        await expect(dataProvider.getData()).rejects.toThrow("Some exception");
    });
    test("should call with correct query during pagination", async () => {

        let mockGraphClient = {
            post: () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(response)
            })
        };
        let postSpy = jest.spyOn(mockGraphClient, "post");
        let dataProvider = new GraphSearchPagedDataProvider<any>(mockGraphClient as any);
        dataProvider.setQuery("test");
        dataProvider.setOrder("TestColumn", "ASC");
        await dataProvider.getData();
        await dataProvider.getNextPage();
        //@ts-ignore
        let callOptions: any = postSpy.mock.calls[1][1];
        let callBody = JSON.parse(callOptions.body);

        expect(callBody.requests[0].from).toBe(25);
        expect(callBody.requests[0].to).toBe(50);

        await dataProvider.getPreviousPage();
        //@ts-ignore
        callOptions = postSpy.mock.calls[2][1];
        callBody = JSON.parse(callOptions.body);
        expect(callBody.requests[0].from).toBe(0);
        expect(callBody.requests[0].to).toBe(25);

        await dataProvider.jumpToAPage(5);
        //@ts-ignore
        callOptions = postSpy.mock.calls[3][1];
        callBody = JSON.parse(callOptions.body);
        expect(callBody.requests[0].from).toBe(125);
        expect(callBody.requests[0].to).toBe(150);
        expect(dataProvider.isNextPageAvailable()).toBeFalsy();

        let lastPage = await dataProvider.getNextPage();
        expect(lastPage).toMatchObject([]);

        await dataProvider.jumpToAPage(0);
        let minusOnePage = await dataProvider.getPreviousPage();
        expect(minusOnePage).toMatchObject([]);
    });
    test("should append queryText to query", async () => {
        let mockGraphClient = {
            post: () => Promise.resolve({
                ok: true,
                json: () => Promise.resolve(response)
            })
        };
        let postSpy = jest.spyOn(mockGraphClient, "post");
        let dataProvider = new GraphSearchPagedDataProvider<any>(mockGraphClient as any);
        dataProvider.setQuery("test");
        dataProvider.queryTemplate = "({searchTerms}) AND Test 1";

        await dataProvider.getData();
        //@ts-ignore
        let callOptions: any = postSpy.mock.calls[0][1];
        let callBody = JSON.parse(callOptions.body);
        expect(callBody.requests[0].query.queryString).toBe("test");
        expect(callBody.requests[0].query.queryTemplate).toBe("({searchTerms}) AND Test 1");
    });
});
