///<reference types="jest" />
import { DeferredWithCacheDataProvider } from "../../../src/dal/dataProviders/DeferredWithCacheDataProvider";
describe("DeferredWithCacheDataProvider", () => {
    test("should return cached data and a promise", async () => {
        let dataProvider = {
            getData: () => Promise.resolve("Test")
        };
        let cacheService = {
            get: (key) => "Test from cache",
            set: (key, value) => { },
            remove: (key) => { }
        };
        const setDataSpy = jest.spyOn(cacheService, "set");
        let provider = new DeferredWithCacheDataProvider<string, null>(dataProvider,
            cacheService as any,
            "test-key");
        let data = provider.getData();
        expect(data.cached).toBe("Test from cache");
        let newData = await data.dataPromise;
        expect(newData).toBe("Test");
        expect(setDataSpy).toBeCalledWith("test-key", "Test");
    });
    test("should handle query input", async () => {
        let dataProvider = {
            getData: (test: { queryProp1: string }) => Promise.resolve("Test")
        };
        let cacheService = {
            get: (key) => "Test from cache",
            set: (key, value) => { },
            remove: (key) => { }
        };
        const getDataSpy = jest.spyOn(dataProvider, "getData");
        const setDataSpy = jest.spyOn(cacheService, "set");
        let provider = new DeferredWithCacheDataProvider<string, { queryProp1: string }>(dataProvider,
            cacheService as any,
            "test-key");
        let data = provider.getData({ queryProp1: "Test query property" });
        expect(data.cached).toBe("Test from cache");
        let newData = await data.dataPromise;
        expect(newData).toBe("Test");
        expect(setDataSpy).toBeCalledWith("test-key", "Test");
        expect(getDataSpy).toHaveBeenCalledWith({ queryProp1: "Test query property" });
    });
});