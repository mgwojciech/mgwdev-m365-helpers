///<reference types="jest" />
import { SPSearchDataProvider } from "../../../src/dal/dataProviders/SPSearchDataProvider";
import { IHttpClient } from "../../../src/dal/http/IHttpClient";
import { IAggregationRequest, IFilterRequest } from "../../../src/model";
describe('SPSearchDataProvider', () => {
	const fakeHttpClient: IHttpClient = {
		post: jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({PrimaryQueryResult:{
			RelevantResults: {
				Table: {
					Rows: [
					]
				}
			}
		}}), text: jest.fn().mockResolvedValue('') })
	} as unknown as IHttpClient;
	let dataProvider: SPSearchDataProvider<any>;
	let httpClientSpy: jest.SpyInstance;

	beforeEach(() => {
		dataProvider = new SPSearchDataProvider('https://test.sharepoint.com/sites/test-site/_api/search/postquery', fakeHttpClient, ['Title'], 'ContentTypeId:0x0101*');
		httpClientSpy = jest.spyOn(fakeHttpClient, 'post');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	test('setQuery should send correct post request', async () => {
		const query = 'example query';
		dataProvider.setQuery(query);

		await dataProvider.getData();

		expect(httpClientSpy).toHaveBeenCalledWith(
			'https://test.sharepoint.com/sites/test-site/_api/search/postquery',
			expect.objectContaining({
				body: expect.stringContaining(`"Querytext":"${query}"`),
				headers: expect.objectContaining({
					"accept": "application/json",
					"content-type": "application/json",
					"odata-version": "3.0"
				})
			})
		);
	});

	test('setRefiners should send correct post request', async () => {
		const aggregations: IAggregationRequest[] = [
			{ field: 'example field', bucketDefinition: { ranges: [{ from: 0, to: 5 }] } }
		];

		dataProvider.setRefiners(aggregations);

		await dataProvider.getData();

		expect(httpClientSpy).toHaveBeenCalledWith(
			'https://test.sharepoint.com/sites/test-site/_api/search/postquery',
			expect.objectContaining({
				body: expect.stringContaining(`"Refiners":"${aggregations[0].field}(discretize=manual/0/5)"`),
				headers: expect.objectContaining({
					"accept": "application/json",
					"content-type": "application/json",
					"odata-version": "3.0"
				})
			})
		);
	});
	test('applyRefiners should send correct post request', async () => {
		const filters: IFilterRequest[] = [
			{ field: 'example field', filterValue: 'example filter value' }
		];
	
		dataProvider.applyRefiners(filters);
	
		await dataProvider.getData();
	
		expect(httpClientSpy).toHaveBeenCalledWith(
			'https://test.sharepoint.com/sites/test-site/_api/search/postquery',
			expect.objectContaining({
				body: expect.stringContaining(`"RefinementFilters":["${filters[0].field}:${filters[0].filterValue}"]`),
				headers: expect.objectContaining({
					"accept": "application/json",
					"content-type": "application/json",
					"odata-version": "3.0"
				})
			})
		);
	});
	
	test('setOrder should send correct post request', async () => {
		const orderColumn = 'example column';
		const orderDir: "ASC" | "DESC" = "DESC";
	
		dataProvider.setOrder(orderColumn, orderDir);
	
		await dataProvider.getData();
		expect(httpClientSpy).toHaveBeenCalledWith(
			'https://test.sharepoint.com/sites/test-site/_api/search/postquery',
			expect.objectContaining({
				body: expect.stringContaining(`"SortList":[{"Direction":${orderDir === "DESC" ? 0 : 1},"Property":"${orderColumn}"}]`),
				headers: expect.objectContaining({
					"accept": "application/json",
					"content-type": "application/json",
					"odata-version": "3.0"
				})
			})
		);
	});
	
	test('getNextPage should increase the StartRow in the request', async () => {
		httpClientSpy.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({PrimaryQueryResult:{
			RelevantResults: {
				Table:{
					Rows: []
				},
				TotalRows: 50
			}
		}}), text: jest.fn().mockResolvedValue('') });
		await dataProvider.getData();
		await dataProvider.getNextPage();
	
		expect(httpClientSpy).toHaveBeenCalledWith(
			'https://test.sharepoint.com/sites/test-site/_api/search/postquery',
			expect.objectContaining({
				body: expect.stringContaining('"StartRow":25'),
				headers: expect.objectContaining({
					"accept": "application/json",
					"content-type": "application/json",
					"odata-version": "3.0"
				})
			})
		);
	});
	
	test('getPreviousPage should decrease the StartRow in the request', async () => {
		httpClientSpy.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({PrimaryQueryResult:{
			RelevantResults: {
				Table:{
					Rows: []
				},
				TotalRows: 50
			}
		}}), text: jest.fn().mockResolvedValue('') });
		
		httpClientSpy.mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({PrimaryQueryResult:{
			RelevantResults: {
				Table:{
					Rows: []
				},
				TotalRows: 50
			}
		}}), text: jest.fn().mockResolvedValue('') });
		await dataProvider.getData();
		await dataProvider.getNextPage();
		await dataProvider.getPreviousPage();
	
		expect(httpClientSpy).toHaveBeenCalledWith(
			'https://test.sharepoint.com/sites/test-site/_api/search/postquery',
			expect.objectContaining({
				body: expect.stringContaining('"StartRow":0'),
				headers: expect.objectContaining({
					"accept": "application/json",
					"content-type": "application/json",
					"odata-version": "3.0"
				})
			})
		);
	});
	
});