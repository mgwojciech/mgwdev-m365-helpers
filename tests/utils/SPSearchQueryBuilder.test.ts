///<reference types="jest" />
import { IAggregationRequest, IFilterRequest } from "../../src/model";
import { SPSearchQueryBuilder } from "../../src/utils/SPSearchQueryBuilder";

describe("SPSearchQueryBuilder", () => {
	let queryBuilder: SPSearchQueryBuilder;

	beforeEach(() => {
		queryBuilder = new SPSearchQueryBuilder();
	});

	test("should set the search query", () => {
		const query = "example query";
		queryBuilder.withSearchQuery(query);
		const searchRequest = queryBuilder.build();
		expect(searchRequest.Querytext).toEqual(query);
	});

	test("should set the template query", () => {
		const query = "example template query";
		queryBuilder.withTemplateQuery(query);
		const searchRequest = queryBuilder.build();
		expect(searchRequest.QueryTemplate).toEqual(query);
	});

	test("should set the aggregation request", () => {
		const aggregationRequest: IAggregationRequest = {
			field: "example field",
			bucketDefinition: {
				ranges: [
					{ from: 0, to: 5 },
					{ from: 5, to: 10 },
				],
			},
		};

		queryBuilder.withAggregationRequest(aggregationRequest);
		const searchRequest = queryBuilder.build();
		expect(searchRequest.Refiners).toEqual("example field(discretize=manual/0/5/10)");
	});

	test("should add filter", () => {
		const filter: IFilterRequest = {
			field: "example field",
			filterValue: "example value"
		};

		queryBuilder.withFilters(filter);
		const searchRequest = queryBuilder.build();
		expect(searchRequest.RefinementFilters).toEqual(["example field:example value"]);
	});

	test("should build the query", () => {
		const searchQuery = "example search query";
		const templateQuery = "example template query";
		const filter: IFilterRequest = {
			field: "example field",
			filterValue: "example value"
		};

		queryBuilder.withSearchQuery(searchQuery)
			.withTemplateQuery(templateQuery)
			.withFilters(filter);

		const result = queryBuilder.build();

		expect(result).toEqual({
			ClientType: "mgwdev-m365-helper",
			QueryTemplate: templateQuery,
			Querytext: searchQuery,
			RefinementFilters: [`${filter.field}:${filter.filterValue}`],
			Refiners: undefined,
			TrimDuplicates: false
		});
	});
});
