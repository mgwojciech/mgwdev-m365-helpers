///<reference types="jest" />
import { GraphODataPagedDataProvider } from "../../../src/dal/dataProviders/GraphODataPagedDataProvider";

describe("GraphODataPagedDataProvider", () => {
    test("should create correct query", async () => {
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery);
        let getSpy = jest.spyOn(httpClientMock, "get");
        //data mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: [] })
        } as any);
        //count mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("10")
        } as any);

        let data = await dataProvider.getData();
        expect(getSpy.mock.calls[0]).toMatchObject(["https://graph.microsoft.com/v1.0/groups?$top=25"]);
        expect(getSpy.mock.calls[1]).toMatchObject(["https://graph.microsoft.com/v1.0/groups/$count"]);
    });
    test("should create correct query and skip count call", async () => {
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery, true);
        let getSpy = jest.spyOn(httpClientMock, "get");
        //data mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: [] })
        } as any);
        let data = await dataProvider.getData();
        expect(getSpy.mock.calls[0]).toMatchObject(["https://graph.microsoft.com/v1.0/groups?$top=25"]);
    });
    test("should execute pagination", async () => {
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        let firstPage = [{
            id: 1,
            displayName: "Test Group 1"
        },
        {
            id: 2,
            displayName: "Test Group 2"
        }]
        let secondPage = [{
            id: 3,
            displayName: "Test Group 3"
        }]
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery, true);
        let getSpy = jest.spyOn(httpClientMock, "get");
        //data mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: firstPage, "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups?$top=2&$skiptoken=skip_token" })
        } as any);
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: secondPage })
        } as any);
        
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: firstPage, "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups?$top=2&$skiptoken=skip_token" })
        } as any);
        let data = await dataProvider.getData();
        expect(data).toMatchObject(firstPage);
        expect(dataProvider.isNextPageAvailable()).toBeTruthy();
        expect(dataProvider.isPreviousPageAvailable()).toBeFalsy();
        expect(dataProvider.getCurrentPage()).toBe(0);

        let nextPage = await dataProvider.getNextPage();
        expect(nextPage).toMatchObject(secondPage);
        expect(dataProvider.isNextPageAvailable()).toBeFalsy();
        expect(dataProvider.isPreviousPageAvailable()).toBeTruthy();
        expect(dataProvider.getCurrentPage()).toBe(1);

        let prevPage = await dataProvider.getPreviousPage();
        expect(prevPage).toMatchObject(firstPage);
        expect(dataProvider.isNextPageAvailable()).toBeTruthy();
        expect(dataProvider.isPreviousPageAvailable()).toBeFalsy();
        expect(dataProvider.getCurrentPage()).toBe(0);

    });
    test("should build query with filter", async ()=>{
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery);
        dataProvider.setQuery("startsWith(displayName, 'TestPrefix')");
        let getSpy = jest.spyOn(httpClientMock, "get");
        //data mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: [] })
        } as any);
        
        //count mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("5")
        } as any);
        let data = await dataProvider.getData();
        expect(getSpy.mock.calls[0]).toMatchObject(["https://graph.microsoft.com/v1.0/groups?$top=25&$filter=startsWith(displayName, 'TestPrefix')"]);
    });
    test("should build query with orderBy", async ()=>{
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery, true);
        dataProvider.setOrder("displayName", "ASC");
        let getSpy = jest.spyOn(httpClientMock, "get");
        //data mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: [] })
        } as any);
        let data = await dataProvider.getData();
        expect(getSpy.mock.calls[0]).toMatchObject(["https://graph.microsoft.com/v1.0/groups?$top=25&$orderBy=displayName asc"]);
    });
    test("should throw http exception", async ()=>{
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery, true);
        let getSpy = jest.spyOn(httpClientMock, "get");
		jest.spyOn(httpClientMock, "get").mockImplementation(() => {
			return Promise.resolve({ ok: false, text: () => Promise.resolve("Some exception") });
		});

		await expect(dataProvider.getData()).rejects.toThrow("Some exception");
    });
    test("should prevent pagination if page is not available", async ()=>{
        let httpClientMock = {
            get: () => Promise.resolve({
                ok: true,
            })
        };
        const baseQuery = "https://graph.microsoft.com/v1.0/groups";
        let dataProvider = new GraphODataPagedDataProvider<any>(httpClientMock as any, baseQuery, true);
        let getSpy = jest.spyOn(httpClientMock, "get");
        //data mock
        getSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ value: [] })
        } as any);
        await dataProvider.getData();
        expect(getSpy.mock.calls[0]).toMatchObject(["https://graph.microsoft.com/v1.0/groups?$top=25"]);
        expect(dataProvider.isNextPageAvailable()).toBeFalsy();
        let nextPage = await dataProvider.getNextPage();
        expect(nextPage).toMatchObject([]);

        expect(dataProvider.isPreviousPageAvailable()).toBeFalsy();
        let prevPage = await dataProvider.getPreviousPage();
        expect(prevPage).toMatchObject([]);
    });
});