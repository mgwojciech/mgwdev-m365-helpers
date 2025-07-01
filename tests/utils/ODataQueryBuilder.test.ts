///<reference types="jest" />
import { ODataQueryBuilder } from "../../src/utils/queryBuilders/ODataQueryBuilder";

describe("ODataQueryBuilder", () => {
    test("should build a query with two queries", () => {
        let query = `substringof('Test', Test)`;
        let additionalQuery = `contains(Test, 'Test2')`;

        const expectedQuery = `(substringof('Test', Test)) and (contains(Test, 'Test2'))`;

        let odataQueryBuilder = new ODataQueryBuilder();
        odataQueryBuilder.withQuery(query).withQuery(additionalQuery);

        expect(odataQueryBuilder.build()).toBe(expectedQuery);
    });
    test("should build a query with a field query", () => {
        let expectedQuery = `substringof('Test', Test)`;

        let odataQueryBuilder = new ODataQueryBuilder();
        let actualQuery = odataQueryBuilder.withFieldQuery({
            name: "Test",
            value: "Test",
            type: "Text",
            comparer: "Contains"
        }).build();

        expect(actualQuery).toBe(expectedQuery);
    });
    test("should build a query with a single field query (startsWith)", () => {
        let expectedQuery = `startswith(Test, 'Test2')`;

        let odataQueryBuilder = new ODataQueryBuilder();
        let actualQuery = odataQueryBuilder.withFieldQuery({
            name: "Test",
            value: "Test2",
            type: "Text",
            comparer: "BeginsWith"
        }).build();

        expect(actualQuery).toBe(expectedQuery);
    });
    test("should throw an exception for not ok field name", () => {
        let odataQueryBuilder = new ODataQueryBuilder();

        expect(() => {
            odataQueryBuilder.withFieldQuery({
                name: "",
                value: "",
                type: "",
                comparer: "Eq"
            });
        }).toThrowError("Field name is required");
    })
    test("should throw an exception for not ok field type", () => {
        let odataQueryBuilder = new ODataQueryBuilder();

        expect(() => {
            odataQueryBuilder.withFieldQuery({
                name: "Test",
                value: "",
                type: "",
                comparer: "Eq"
            });
        }).toThrowError("Field type is required");
    });

    test("should build a query with multiple fields", () => {
        let expectedQuery = "(Title eq 'test') and (Created ge datetime'2019-07-31T00:00:00Z')";
        let odataQueryBuilder = new ODataQueryBuilder();

        odataQueryBuilder.withFieldQuery({
            name: "Title",
            value: "test",
            type: "Text",
            comparer: "Eq"
        }).withFieldQuery({
            name: "Created",
            value: "2019-07-31T00:00:00Z",
            type: "DateTime",
            comparer: "Geq"
        });

        expect(odataQueryBuilder.build()).toEqual(expectedQuery);
    });
    test("should build a query with LookupId", () => {
        let expectedQuery = "Author/Id eq 1";
        let odataQueryBuilder = new ODataQueryBuilder();
        odataQueryBuilder.withFieldQuery({
            name: "Author",
            value: "1",
            type: "LookupId",
            comparer: "IDEq"
        });
        expect(odataQueryBuilder.build()).toEqual(expectedQuery);
    });
    test("should build a query with date", () => {
        let expectedQuery = "Created ge datetime'2019-07-31T00:00:00Z'";
        let odataQueryBuilder = new ODataQueryBuilder();
        odataQueryBuilder.withFieldQuery({
            name: "Created",
            value: "2019-07-31T00:00:00Z",
            type: "DateTime",
            comparer: "Geq"
        });
        expect(odataQueryBuilder.build()).toEqual(expectedQuery);
    });
    test("should build a query with date range", () => {
        let expectedQuery = "(Created ge datetime'2019-07-31T00:00:00Z') and (Created le datetime'2019-08-01T00:00:00Z')";
        let odataQueryBuilder = new ODataQueryBuilder();
        odataQueryBuilder.withFieldQuery({
            name: "Created",
            value: "2019-07-31T00:00:00Z",
            type: "DateTime",
            comparer: "Geq"
        });
        odataQueryBuilder.withFieldQuery({
            name: "Created",
            value: "2019-08-01T00:00:00Z",
            type: "DateTime",
            comparer: "Leq"
        });
        expect(odataQueryBuilder.build()).toEqual(expectedQuery);
    });
    test("should build a query with guid", ()=>{
        let expectedQuery = "Id eq guid'12345678-90ab-cdef-1234-567890abcdef'";
        let odataQueryBuilder = new ODataQueryBuilder();
        odataQueryBuilder.withFieldQuery({
            name: "Id",
            value: "12345678-90ab-cdef-1234-567890abcdef",
            type: "Guid",
            comparer: "Eq"
        });
        expect(odataQueryBuilder.build()).toEqual(expectedQuery);
    })
});