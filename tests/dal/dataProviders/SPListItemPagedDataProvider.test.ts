///<reference types="jest" />
import { deepStrictEqual } from "assert";
import { SPListItemCamlPagedDataProvider } from "../../../src/dal/dataProviders/SPListItemCamlPagedDataProvider";

describe("SPListItemCamlPagedDataProvider", () => {
	test("should get data without any filter query", async () => {
		let expectedItems = [{
			ID: 1
		}, {
			ID: 2
		}, {
			ID: 3
		}];
		let expectedTotalCount = 123;
		let spHttpClientMock = {
			get: (url) => { },
			post: (url, config, body) => { }
		}
		jest.spyOn(spHttpClientMock, "get").mockImplementation((url) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')?$select=itemCount")).toBeGreaterThan(-1);
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ ItemCount: expectedTotalCount })
			});
		});
		jest.spyOn(spHttpClientMock, "post").mockImplementation((url, options) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')/RenderListDataAsStream")).toBeGreaterThan(-1);

			let deserializedBody = JSON.parse(options.body);
			let viewQuery = deserializedBody.parameters.ViewXml;

			expect(viewQuery.indexOf("<View Scope=\"RecursiveAll\">")).toBeGreaterThan(-1);
			expect(viewQuery.indexOf("<Where>")).toBeLessThan(0);

			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ Row: expectedItems })
			});
		});
		let dataProvider = new SPListItemCamlPagedDataProvider(spHttpClientMock as any, "/sites/test-site", "test-list-id");
		let actual = await dataProvider.getData();
		expect(actual).toEqual(expectedItems);
		expect(dataProvider.allItemsCount).toEqual(expectedTotalCount);
	});
	test("should get data with filter query", async () => {
		let expectedItems = [{
			ID: 1
		}, {
			ID: 2
		}, {
			ID: 3
		}];
		let expectedTotalCount = 123;
		let spHttpClientMock = {
			get: (url) => { },
			post: (url, config, body) => { }
		}
		jest.spyOn(spHttpClientMock, "post").mockImplementationOnce((url, options) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')/RenderListDataAsStream")).toBeGreaterThan(-1);

			let deserializedBody = JSON.parse(options.body);
			let viewQuery = deserializedBody.parameters.ViewXml;

			expect(viewQuery.indexOf("<View Scope=\"RecursiveAll\">")).toBeGreaterThan(-1);
			expect(viewQuery.indexOf("<Where>test-query</Where>")).toBeGreaterThan(-1);

			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ Row: expectedItems })
			});
		});
		jest.spyOn(spHttpClientMock, "post").mockImplementationOnce((url) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')/RenderListDataAsStream")).toBeGreaterThan(-1);
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ Row: new Array(123) })
			});
		});
		let dataProvider = new SPListItemCamlPagedDataProvider(spHttpClientMock as any, "/sites/test-site", "test-list-id");
		dataProvider.setQuery("test-query");
		let actual = await dataProvider.getData();
		expect(actual).toEqual(expectedItems);
		expect(dataProvider.allItemsCount).toEqual(expectedTotalCount);
	});
	test("should execute pagination and disable next page", async () => {
		let expectedItems = [{
			ID: 1
		}, {
			ID: 2
		}, {
			ID: 3
		}];
		let expectedItemsOnTheSecondPage = [{
			ID: 3
		}, {
			ID: 5
		}];
		let expectedTotalCount = 5;
		let spHttpClientMock = {
			get: (url) => { },
			post: (url, config, body) => { }
		}
		jest.spyOn(spHttpClientMock, "get").mockImplementation((url) => {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ ItemCount: expectedTotalCount })
			});
		});
		jest.spyOn(spHttpClientMock, "post").mockImplementationOnce((url, config, options) => {

			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ Row: expectedItems })
			});
		});
		jest.spyOn(spHttpClientMock, "post").mockImplementationOnce((url, config, options) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')/RenderListDataAsStream?TryNewExperienceSingle=TRUE&Paged=TRUE&p_ID=3")).toBeGreaterThan(-1);
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ Row: expectedItemsOnTheSecondPage })
			});
		});
		let dataProvider = new SPListItemCamlPagedDataProvider(spHttpClientMock as any, "/sites/test-site", "test-list-id");
		dataProvider.pageSize = 3;
		let actual = await dataProvider.getData();
		expect(actual).toEqual(expectedItems);
		expect(dataProvider.allItemsCount).toEqual(expectedTotalCount);
		expect(dataProvider.isNextPageAvailable()).toBe(true);
		let actualSecondPage = await dataProvider.getNextPage();
		expect(actualSecondPage).toEqual(expectedItemsOnTheSecondPage);
		expect(dataProvider.isNextPageAvailable()).toBe(false);
	});
	test("should throw api exception", async () => {
		let spHttpClientMock = {
			get: (url) => { },
			post: (url, config, body) => { }
		}
		jest.spyOn(spHttpClientMock, "get").mockImplementation((url) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')?$select=itemCount")).toBeGreaterThan(-1);
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ ItemCount: 1 })
			});
		});
		jest.spyOn(spHttpClientMock, "post").mockImplementation((url, options) => {
			return Promise.resolve({ ok: false, text: () => Promise.resolve("Some exception") });
		});
		let dataProvider = new SPListItemCamlPagedDataProvider(spHttpClientMock as any, "/sites/test-site", "test-list-id");

		await expect(dataProvider.getData()).rejects.toThrow("Some exception");
	});
	test("should use custom map method", async () => {
		let expectedItems = [{
			ID: 1
		}, {
			ID: 2
		}, {
			ID: 3
		}];
		let expectedObjects = [{
			Title: "Id: 1"
		},{
			Title: "Id: 2"
		}, {
			Title: "Id: 3"
		}]
		let expectedTotalCount = 123;
		let spHttpClientMock = {
			get: (url) => { },
			post: (url, config, body) => { }
		}
		jest.spyOn(spHttpClientMock, "get").mockImplementation((url) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')?$select=itemCount")).toBeGreaterThan(-1);
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ ItemCount: expectedTotalCount })
			});
		});
		jest.spyOn(spHttpClientMock, "post").mockImplementation((url, options) => {
			expect(url.indexOf("/sites/test-site/_api/web/lists('test-list-id')/RenderListDataAsStream")).toBeGreaterThan(-1);

			let deserializedBody = JSON.parse(options.body);
			let viewQuery = deserializedBody.parameters.ViewXml;

			expect(viewQuery.indexOf("<View Scope=\"RecursiveAll\">")).toBeGreaterThan(-1);
			expect(viewQuery.indexOf("<Where>")).toBeLessThan(0);

			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ Row: expectedItems })
			});
		});
		let dataProvider = new SPListItemCamlPagedDataProvider(spHttpClientMock as any, "/sites/test-site", "test-list-id",["ID"],(item)=>({
			Title: `Id: ${item.ID}`
		}));
		let actual = await dataProvider.getData();
		deepStrictEqual(actual, expectedObjects);
	})
});
