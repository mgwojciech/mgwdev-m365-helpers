///<reference types="jest" />
import { ODataPagedDataProvider } from "../../../src/dal/dataProviders/ODataPagedDataProvider";

describe("ODataPagedDataProvider", () => {
    test("should return data", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }]
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true);
        let data = await provider.getData();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toBeCalledWith("test-resource?$top=25");
    });
    test("should return data with filter", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }]
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true);
        provider.setQuery("title eq 'Test'");
        let data = await provider.getData();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toBeCalledWith("test-resource?$top=25&$filter=title eq 'Test'");
    });
    test("should return data with order", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }]
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true);
        provider.setOrder("title", "ASC");
        let data = await provider.getData();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toBeCalledWith("test-resource?$top=25&$orderby=title asc");
    });
    test("should return data with expand", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }]
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true, "test");
        let data = await provider.getData();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toBeCalledWith("test-resource?$top=25&$expand=test");
    });
    test("should return data with select", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }]
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true, "", "title");
        let data = await provider.getData();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toBeCalledWith("test-resource?$top=25&$select=title");
    });
    test("should return next page", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }]
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true);
        provider.pageSize = 1;
        await provider.getData();
        let data = await provider.getNextPage();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toHaveBeenNthCalledWith(1, "test-resource?$top=1");
        expect(httpClient.get).toHaveBeenNthCalledWith(2, "test-resource?$top=1&$skip=1");
    });
    test("should return next page with next link", async () => {
        let httpClient = {
            get: jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    value: [{
                        id: 1,
                        title: "Test"
                    }],
                    "@odata.nextLink": "next-link"
                })

            })
        };
        let provider = new ODataPagedDataProvider<string>(httpClient as any, "test-resource", true);
        provider.pageSize = 1;
        await provider.getData();
        let data = await provider.getNextPage();
        expect(data).toStrictEqual([{
            id: 1,
            title: "Test"
        }]);
        expect(httpClient.get).toHaveBeenNthCalledWith(1, "test-resource?$top=1");
        expect(httpClient.get).toHaveBeenNthCalledWith(2, "next-link");
    });
});